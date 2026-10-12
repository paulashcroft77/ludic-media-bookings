-- Build step 1: team members, atomic job creation and the Send booking link action.

-- ---------- team check ----------
-- Entra can return mixed-case addresses; compare lower-cased.
create or replace function is_team() returns boolean language sql stable as $$
  select coalesce(lower(auth.jwt() ->> 'email') like '%@ludicgroup.com', false)
$$;

-- ---------- team members ----------
-- A readable mirror of auth.users for the team (names for owners and the activity feed).
create table team_members (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now()
);
alter table team_members enable row level security;
create policy team_read on team_members for select to authenticated using (is_team());

create or replace function sync_team_member() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if lower(new.email) like '%@ludicgroup.com' then
    insert into public.team_members (id, email, full_name)
    values (new.id, lower(new.email),
            coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'))
    on conflict (id) do update
      set email = excluded.email,
          full_name = coalesce(excluded.full_name, team_members.full_name);
  end if;
  return new;
end $$;
create trigger on_auth_user_saved after insert or update of email, raw_user_meta_data on auth.users
  for each row execute function sync_team_member();

insert into team_members (id, email, full_name)
select id, lower(email), coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name')
  from auth.users where lower(email) like '%@ludicgroup.com'
on conflict (id) do nothing;

-- ---------- audit log: allow a note on the transition row ----------
create or replace function log_job_event() returns trigger language plpgsql as $$
declare
  v_note text := nullif(current_setting('app.note', true), '');
begin
  if tg_op = 'INSERT' then
    insert into job_events (job_id, actor_type, actor_id, to_status, note)
      values (new.id, 'team', new.created_by::text, new.status, coalesce(v_note, 'Job created'));
  elsif new.status is distinct from old.status then
    insert into job_events (job_id, actor_type, actor_id, from_status, to_status, note)
      values (new.id, coalesce(nullif(current_setting('app.actor_type', true), ''), 'system')::party,
              nullif(current_setting('app.actor_id', true), ''), old.status, new.status, v_note);
  end if;
  return new;
end $$;

-- ---------- create_job ----------
-- One transaction for client, contact, job, sessions and fee lines. Runs as the caller, so RLS applies.
-- The job ref is issued by the jobs_set_ref trigger.
create or replace function create_job(payload jsonb) returns jobs
language plpgsql set search_path = public, pg_temp as $$
declare
  v_client_id uuid;
  v_contact_id uuid;
  v_job jobs;
  v_row jsonb;
  v_sort integer := 0;
begin
  if not is_team() then
    raise exception 'Only the Ludic team can create jobs' using errcode = '42501';
  end if;

  select id into v_client_id from clients
   where lower(name) = lower(trim(payload ->> 'client_name'))
   order by created_at limit 1;
  if v_client_id is null then
    insert into clients (name) values (trim(payload ->> 'client_name')) returning id into v_client_id;
  end if;

  select id into v_contact_id from contacts
   where client_id = v_client_id and lower(email) = lower(trim(payload ->> 'contact_email'))
   limit 1;
  if v_contact_id is null then
    insert into contacts (client_id, name, email, phone)
    values (v_client_id, trim(payload ->> 'contact_name'), lower(trim(payload ->> 'contact_email')),
            nullif(trim(payload ->> 'contact_phone'), ''))
    returning id into v_contact_id;
  else
    update contacts
       set name = trim(payload ->> 'contact_name'),
           phone = coalesce(nullif(trim(payload ->> 'contact_phone'), ''), phone)
     where id = v_contact_id;
  end if;

  insert into jobs (client_id, contact_id, source, owner_id, event_name, purpose, capture, scribing_type,
                    group_size, venue, currency, expenses_policy, output_spec, output_due, created_by)
  values (v_client_id, v_contact_id, payload ->> 'source',
          coalesce(nullif(payload ->> 'owner_id', '')::uuid, auth.uid()),
          trim(payload ->> 'event_name'),
          nullif(trim(payload ->> 'purpose'), ''),
          nullif(trim(payload ->> 'capture'), ''),
          nullif(payload ->> 'scribing_type', ''),
          nullif(trim(payload ->> 'group_size'), ''),
          nullif(trim(payload ->> 'venue'), ''),
          coalesce(nullif(payload ->> 'currency', ''), 'GBP'),
          nullif(payload ->> 'expenses_policy', ''),
          nullif(trim(payload ->> 'output_spec'), ''),
          nullif(payload ->> 'output_due', '')::date,
          auth.uid())
  returning * into v_job;

  for v_row in select * from jsonb_array_elements(coalesce(payload -> 'sessions', '[]'::jsonb)) loop
    insert into job_sessions (job_id, session_date, start_time, end_time, session_type, sort)
    values (v_job.id, (v_row ->> 'date')::date, nullif(v_row ->> 'start', '')::time,
            nullif(v_row ->> 'end', '')::time, nullif(trim(v_row ->> 'session_type'), ''), v_sort);
    v_sort := v_sort + 1;
  end loop;

  v_sort := 0;
  for v_row in select * from jsonb_array_elements(coalesce(payload -> 'fee_lines', '[]'::jsonb)) loop
    insert into job_fee_lines (job_id, description, unit, qty, unit_rate_minor, sort)
    values (v_job.id, trim(v_row ->> 'description'), v_row ->> 'unit', (v_row ->> 'qty')::numeric,
            (v_row ->> 'unit_rate_minor')::integer, v_sort);
    v_sort := v_sort + 1;
  end loop;

  return v_job;
end $$;

-- ---------- send_booking_link ----------
-- Stores the hash of a new client token, revokes any earlier client link, and moves a draft to
-- awaiting_client. Security definer because the team can read tokens but not write them; the
-- is_team() check below is the gate. The raw token never reaches the database.
create or replace function send_booking_link(p_job_id uuid, p_token_hash text) returns tokens
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_job jobs;
  v_contact contacts;
  v_token tokens;
  v_ttl integer;
begin
  if not is_team() then
    raise exception 'Only the Ludic team can send booking links' using errcode = '42501';
  end if;

  select * into v_job from jobs where id = p_job_id for update;
  if not found then
    raise exception 'Job not found' using errcode = 'P0002';
  end if;
  if v_job.status not in ('draft', 'awaiting_client') then
    raise exception 'A booking link can only be sent while the job is draft or awaiting client'
      using errcode = '22023';
  end if;

  select * into v_contact from contacts where id = v_job.contact_id;
  select coalesce((value #>> '{}')::integer, 30) into v_ttl from settings where key = 'link_ttl_days';

  update tokens set revoked_at = now()
   where job_id = p_job_id and party = 'client' and revoked_at is null;

  insert into tokens (job_id, party, token_hash, expires_at)
  values (p_job_id, 'client', p_token_hash, now() + make_interval(days => coalesce(v_ttl, 30)))
  returning * into v_token;

  perform set_config('app.actor_type', 'team', true);
  perform set_config('app.actor_id', auth.uid()::text, true);

  if v_job.status = 'draft' then
    perform set_config('app.note',
      format('Booking link sent to %s (%s). Expires %s.', v_contact.name, v_contact.email,
             to_char(v_token.expires_at at time zone 'Europe/London', 'FMDD Mon YYYY')), true);
    update jobs set status = 'awaiting_client' where id = p_job_id;
    perform set_config('app.note', '', true);
  else
    insert into job_events (job_id, actor_type, actor_id, note)
    values (p_job_id, 'team', auth.uid()::text,
            format('Booking link re-issued to %s (%s); the previous link no longer works. Expires %s.',
                   v_contact.name, v_contact.email,
                   to_char(v_token.expires_at at time zone 'Europe/London', 'FMDD Mon YYYY')));
  end if;

  return v_token;
end $$;

revoke execute on function create_job(jsonb) from public, anon;
revoke execute on function send_booking_link(uuid, text) from public, anon;
grant execute on function create_job(jsonb) to authenticated;
grant execute on function send_booking_link(uuid, text) to authenticated;
