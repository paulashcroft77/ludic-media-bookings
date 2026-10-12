# bookings.ludicmedia.studio

Booking system for Ludic Media Studio visual scribing jobs: one job record with its own ID, a client booking link, a scribe portal and a job tracker. Supabase + Next.js on Vercel.

- `CLAUDE.md` — project brief and rules (read first)
- `docs/spec.md` — the full specification
- `docs/prototype.html` — clickable reference for the three views (open in a browser)
- `supabase/migrations/0001_init.sql` — schema, ID generator, transition guard, audit trigger, RLS
- `supabase/migrations/0002_admin_jobs.sql` — team members, `create_job` and `send_booking_link` functions
- `.env.example` — every environment variable the integrations need

## Build order

1. Supabase client, Microsoft sign-in, `/admin` job list, job detail, New job form, Send booking link
2. `/book/[token]` client booking, click-to-accept, SoW PDF, stage emails, HubSpot sync
3. Scribe pool, `/scribe/[token]` offer and accept, client confirmation, Stripe deposit, Xero invoices
4. Output upload and release, balance invoice, feedback, calendar invites, board and reporting

## Local run

1. `npm install`
2. `npx supabase start` (needs Docker), which applies the migrations in `supabase/migrations/`
3. Copy `.env.example` to `.env.local`. Fill `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` from `npx supabase status`, set `TOKEN_SIGNING_SECRET` to any long random string (`openssl rand -hex 32`) and `NEXT_PUBLIC_APP_URL=http://localhost:3000`
4. `npm run dev`

Microsoft sign-in is off in the local Supabase (see `[auth.external.azure]` in `supabase/config.toml` to turn it on with your own Entra app). The Playwright tests sign in without it.

After changing the schema, run `npm run db:types` to regenerate `lib/database.types.ts`.

## Tests

`npm run lint`, `npm run typecheck`, and `npm run test:e2e` (Playwright). The e2e suite builds and starts the app on port 3100, creates a test team member (`e2e.tester@ludicgroup.com`) in the **local** Supabase and walks the happy path. It refuses to run against a hosted Supabase. First time: `npx playwright install chromium`.

## Team sign-in (Microsoft Entra) setup

1. In Entra (ludicgroup.com tenant) register an app, single tenant. Redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`. Create a client secret. Add the `email` optional claim to the ID token.
2. In Supabase → Authentication → Providers → Azure: enable it, paste the client ID and secret, and set the Azure Tenant URL to `https://login.microsoftonline.com/<tenant-id>` so only the Ludic tenant can sign in.
3. In Supabase → Authentication → URL Configuration: Site URL `https://bookings.ludicmedia.studio`; add redirect URLs `https://bookings.ludicmedia.studio/auth/callback` and your Vercel preview pattern (e.g. `https://*-<team>.vercel.app/auth/callback`).
4. Turn off the Email provider's sign-ups in the hosted project; the team only signs in with Microsoft.

The app also checks the address ends in `@ludicgroup.com` (callback, proxy, every page and action) and RLS does the same via `is_team()`.
