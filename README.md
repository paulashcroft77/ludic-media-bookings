# bookings.ludicmedia.studio

Booking system for Ludic Media Studio visual scribing jobs: one job record with its own ID, a client booking link, a scribe portal and a job tracker. Supabase + Next.js on Vercel.

- `CLAUDE.md` — project brief and rules (read first)
- `docs/spec.md` — the full specification
- `docs/prototype.html` — clickable reference for the three views (open in a browser)
- `supabase/migrations/0001_init.sql` — schema, ID generator, transition guard, audit trigger, RLS
- `.env.example` — every environment variable the integrations need

## Build order

1. Supabase client, Microsoft sign-in, `/admin` job list, job detail, New job form, Send booking link
2. `/book/[token]` client booking, click-to-accept, SoW PDF, stage emails, HubSpot sync
3. Scribe pool, `/scribe/[token]` offer and accept, client confirmation, Stripe deposit, Xero invoices
4. Output upload and release, balance invoice, feedback, calendar invites, board and reporting

## Local run

`npm install`, copy `.env.example` to `.env.local` and fill in the Supabase values, then `npm run dev`.
