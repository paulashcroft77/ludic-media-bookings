# Ludic Media Studio — Scribing Bookings

Internal booking system for visual scribing jobs. Replaces a Word briefing sheet, a schedule-of-work letter and DocuSign with one job record, a client booking link, a scribe portal and a job tracker. Spec: `docs/spec.md` (export of the Claude doc). Visual reference: `docs/prototype.html` (open in a browser; three views, shared job state).

## Stack

- Next.js 16 (App Router, TypeScript, server actions) on Vercel. Read AGENTS.md first: this Next.js version differs from older conventions, domain `bookings.ludicmedia.studio`
- Supabase (Postgres, Auth, Storage, Edge Functions), region London. Migrations in `supabase/migrations/`
- Auth: team sign in with Microsoft (Entra) on the ludicgroup.com tenant. Clients and scribes never sign in; they use signed tokens (`tokens` table) checked server-side
- Stripe Checkout (deposit, balance), Xero API (invoices), HubSpot API (company/contact/deal), Resend (email), Microsoft Graph (calendar) — all behind server actions or Edge Functions, never from the browser
- Styling: Tailwind 4 (already configured), matching the tokens in `docs/prototype.html` (`:root` block). Fonts: Bricolage Grotesque (display), Instrument Sans (body), JetBrains Mono (refs/amounts)

## Domain rules (do not drift from these)

- Job ID `LMS-YYYY-NNNN`, issued by the `next_job_ref()` DB function at insert; sequence resets each year; never reused
- `jobs.status` is the single lifecycle: draft → awaiting_client → booked → sourcing → scribe_assigned → confirmed → delivered → closed; `cancelled` reachable from anything before `delivered`. `payment_status` and `contract_status` are separate columns
- Every transition is written to `job_events` by the `log_job_event` trigger. Terms acceptance writes `accepted_at`, `accepted_by`, `accepted_ip`, `terms_version`
- Clients never see scribe contact details or rates; scribes never see client contact details until the job is `confirmed`, and never billing details
- Rates are per job (`job_fee_lines`), never published. The internal rate card lives in `settings`
- Payment routes: `po` (Xero invoice against PO, 30 days) or `card` (Stripe 50% deposit at booking, 50% balance at delivered, 7 days)
- Nothing is emailed to a client while a job is `draft`. Sending the booking link is an explicit action
- One email per transition, templated in `emails/`, sent from `bookings@ludicmedia.studio`

## Build order

1. Migrations + RLS + Microsoft sign-in + `/admin` job list, job detail, New job form, Send booking link
2. `/book/[token]` client booking form, click-to-accept, SoW PDF, stage emails, HubSpot sync
3. Scribe pool, `/scribe/[token]` offer and accept, client scribe confirmation, Stripe deposit, Xero invoices and paid webhooks
4. Output upload and release, balance invoice, feedback, calendar invites, board and reporting

Ship each step to Vercel preview before starting the next. Write a Playwright test for the happy path of each step.

## Conventions

- Server actions in `app/actions/*.ts`; one file per aggregate (jobs, scribes, invoices)
- Zod schemas for every form in `lib/schemas.ts`; the DB types are generated (`supabase gen types`) into `lib/database.types.ts`
- Money in integer pence/cents (`amount_minor`) with a `currency` column; format at the edge
- All dates stored as `timestamptz`; sessions as `date` + `time` in the venue's timezone (`jobs.venue_tz`)
- Secrets only in Vercel/Supabase env; `.env.example` lists every key
- Commit messages: `feat(jobs): …`, `fix(book): …`
