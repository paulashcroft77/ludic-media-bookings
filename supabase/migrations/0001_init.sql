-- Ludic Media Studio bookings — initial schema
-- Matches docs/spec.md "Data model". Apply with `supabase db push`.

create extension if not exists pgcrypto;

-- ---------- enums ----------
create type job_status as enum (
  'draft','awaiting_client','booked','sourcing','scribe_assigned','confirmed','delivered','closed','cancelled');
create type payment_status as enum ('unpaid','deposit_paid','po_received','paid');
create type contract_status as enum ('pending','accepted_online','signed_docusign');
create type payment_route as enum ('po','card');
create type party as enum ('team','client','scribe','system');
create type offer_response as enum ('pending','accepted','declined','expired','withdrawn');
create type file_kind as enum ('brief','output','po','invoice','receipt','sow');
create type invoice_kind as enum ('deposit','balance','full','expenses');

-- ---------- reference ----------
create table service_types (
  id text primary key,                 -- 'scribing', later 'visualisation', 'film' ...
  name text not null,
  form_template jsonb not null default '{}'::jsonb,
  active boolean not null default true
);
insert into service_types (id, name) values ('scribing', 'Visual scribing');

create table settings (
  key text primary key,
  value jsonb not null
);
insert into settings (key, value) values
  ('rate_card', '{"currency":"GBP","half_day":100000,"full_day":180000,"travel_day":60000}'),
  ('terms_version', '"terms_v1"'),
  ('deposit_pct', '50'),
  ('link_ttl_days', '30');

-- ---------- clients ----------
create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  billing_entity text,
  billing_address text,
  vat_number text,
  ap_email text,
  po_required boolean not null default false,
  hubspot_company_id text,
  xero_contact_id text,
  created_at timestamptz not null default now()
);

create table contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id),
  name text not null,
  email text not null,
  phone text,
  role text,
  hubspot_contact_id text,
  created_at timestamptz not null default now()
);
create index on contacts (client_id);

-- ---------- scribes ----------
create table scribes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  phone text,
  base_location text,
  styles text[] not null default '{}',
  languages text[] not null default '{}',
  day_rate_minor integer,
  half_day_rate_minor integer,
  currency text not null default 'GBP',
  portfolio_urls text[] not null default '{}',
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- jobs ----------
create sequence job_ref_seq;

create table jobs (
  id uuid primary key default gen_random_uuid(),
  job_ref text not null unique,
  service_type text not null references service_types(id) default 'scribing',
  client_id uuid not null references clients(id),
  contact_id uuid not null references contacts(id),
  status job_status not null default 'draft',
  payment_status payment_status not null default 'unpaid',
  contract_status contract_status not null default 'pending',
  payment_route payment_route,
  source text,                          -- 'call' | 'hubspot' | 'web'
  owner_id uuid references auth.users(id),
  event_name text not null,
  purpose text,
  capture text,
  scribing_type text,
  group_size text,
  venue text,
  venue_tz text not null default 'Europe/London',
  currency text not null default 'GBP',
  expenses_policy text,
  output_spec text,
  output_due date,
  usage_rights text,
  logistics jsonb not null default '{}'::jsonb,   -- room, onsite contact, arrival, access, materials, travel
  terms_version text,
  accepted_at timestamptz,
  accepted_by text,
  accepted_ip inet,
  po_number text,
  hubspot_deal_id text,
  cancelled_reason text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on jobs (status);
create index on jobs (client_id);

create table job_sessions (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  session_date date not null,
  start_time time,
  end_time time,
  session_type text,
  location text,
  notes text,
  sort integer not null default 0
);
create index on job_sessions (job_id);

create table job_fee_lines (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  description text not null,
  unit text not null,                   -- 'half_day' | 'day' | 'item'
  qty numeric(6,2) not null default 1,
  unit_rate_minor integer not null,
  sort integer not null default 0
);
create index on job_fee_lines (job_id);

create table job_assignments (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  scribe_id uuid not null references scribes(id),
  fee_to_scribe_minor integer,
  offered_at timestamptz not null default now(),
  expires_at timestamptz,
  responded_at timestamptz,
  response offer_response not null default 'pending',
  client_confirmed_at timestamptz,
  client_declined_at timestamptz
);
create index on job_assignments (job_id);
create unique index one_open_offer_per_job on job_assignments (job_id) where response = 'pending';

create table job_files (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  kind file_kind not null,
  storage_path text not null,
  filename text not null,
  size_bytes bigint,
  uploaded_by party not null,
  uploaded_at timestamptz not null default now(),
  released_to_client_at timestamptz
);
create index on job_files (job_id);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id),
  kind invoice_kind not null,
  amount_minor integer not null,
  currency text not null default 'GBP',
  xero_invoice_id text,
  xero_invoice_number text,
  stripe_checkout_id text,
  stripe_payment_intent_id text,
  status text not null default 'draft',  -- draft | sent | paid | void
  issued_at timestamptz,
  due_at date,
  paid_at timestamptz
);
create index on invoices (job_id);

create table job_events (
  id bigserial primary key,
  job_id uuid not null references jobs(id) on delete cascade,
  at timestamptz not null default now(),
  actor_type party not null,
  actor_id text,
  from_status job_status,
  to_status job_status,
  note text,
  meta jsonb
);
create index on job_events (job_id, at);

create table tokens (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  party party not null check (party in ('client','scribe')),
  scribe_id uuid references scribes(id),
  token_hash text not null unique,
  expires_at timestamptz not null,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index on tokens (job_id);

-- ---------- functions & triggers ----------
create or replace function next_job_ref() returns text language plpgsql as $$
declare
  yr text := to_char(now() at time zone 'Europe/London', 'YYYY');
  n integer;
begin
  -- per-year sequence: count existing refs for this year, +1 (small volume, so a count is fine; serialised by the advisory lock)
  perform pg_advisory_xact_lock(hashtext('job_ref_' || yr));
  select coalesce(max(substring(job_ref from 10)::integer), 0) + 1 into n
    from jobs where job_ref like 'LMS-' || yr || '-%';
  return 'LMS-' || yr || '-' || lpad(n::text, 4, '0');
end $$;

create or replace function set_job_ref() returns trigger language plpgsql as $$
begin
  if new.job_ref is null or new.job_ref = '' then
    new.job_ref := next_job_ref();
  end if;
  return new;
end $$;
create trigger jobs_set_ref before insert on jobs for each row execute function set_job_ref();

create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
create trigger jobs_touch before update on jobs for each row execute function touch_updated_at();

create or replace function log_job_event() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    insert into job_events (job_id, actor_type, actor_id, to_status, note)
      values (new.id, 'team', new.created_by::text, new.status, 'Job created');
  elsif new.status is distinct from old.status then
    insert into job_events (job_id, actor_type, actor_id, from_status, to_status)
      values (new.id, coalesce(current_setting('app.actor_type', true), 'system')::party,
              current_setting('app.actor_id', true), old.status, new.status);
  end if;
  return new;
end $$;
create trigger jobs_log after insert or update on jobs for each row execute function log_job_event();

-- legal transitions
create or replace function check_job_transition() returns trigger language plpgsql as $$
begin
  if new.status = old.status then return new; end if;
  if new.status = 'cancelled' and old.status in ('draft','awaiting_client','booked','sourcing','scribe_assigned','confirmed') then return new; end if;
  if (old.status, new.status) in (
     ('draft','awaiting_client'),
     ('awaiting_client','booked'),
     ('booked','sourcing'),
     ('sourcing','scribe_assigned'),
     ('scribe_assigned','sourcing'),        -- client asked for an alternative / scribe withdrew
     ('scribe_assigned','confirmed'),
     ('confirmed','delivered'),
     ('delivered','closed')) then return new; end if;
  raise exception 'Illegal job transition % -> %', old.status, new.status;
end $$;
create trigger jobs_transition before update of status on jobs for each row execute function check_job_transition();

-- ---------- row level security ----------
-- Team: any signed-in user on the ludicgroup.com tenant. Clients/scribes never hold a DB session;
-- their routes run with the service role after validating a token server-side.
alter table clients enable row level security;
alter table contacts enable row level security;
alter table scribes enable row level security;
alter table jobs enable row level security;
alter table job_sessions enable row level security;
alter table job_fee_lines enable row level security;
alter table job_assignments enable row level security;
alter table job_files enable row level security;
alter table invoices enable row level security;
alter table job_events enable row level security;
alter table tokens enable row level security;
alter table settings enable row level security;
alter table service_types enable row level security;

create or replace function is_team() returns boolean language sql stable as $$
  select coalesce((auth.jwt() ->> 'email') like '%@ludicgroup.com', false)
$$;

do $$
declare t text;
begin
  foreach t in array array['clients','contacts','scribes','jobs','job_sessions','job_fee_lines','job_assignments','job_files','invoices','job_events','settings','service_types']
  loop
    execute format('create policy team_all on %I for all to authenticated using (is_team()) with check (is_team())', t);
  end loop;
end $$;
-- tokens: team can read/revoke, never see hashes in the UI; service role does the rest
create policy team_read_tokens on tokens for select to authenticated using (is_team());

-- ---------- storage ----------
insert into storage.buckets (id, name, public) values ('jobs', 'jobs', false) on conflict do nothing;
create policy team_jobs_bucket on storage.objects for all to authenticated
  using (bucket_id = 'jobs' and is_team()) with check (bucket_id = 'jobs' and is_team());
