# Scribing Booking System Spec

Oct 12, 2026 · @Paul

Ludic Media Studio replaces the briefing sheet, schedule-of-work letter and DocuSign with one online booking flow: a single job record with its own ID, a client booking link, a scribe acceptance portal and a 50/50 card or PO payment route, backed by Supabase and synced to HubSpot and Xero.

## Recommendation

Build a small booking app on ludicmedia.studio backed by Supabase, with HubSpot as the CRM view and Xero as the ledger. At 5–10 jobs a month, growing, the app pays for itself in the first quarter by removing the manual briefing sheet, letter, DocuSign round-trip and chasing.

Why this over HubSpot-native: our HubSpot is on Starter (2 pipelines, both used; no workflows; no custom objects), so a native build means Sales Hub Professional at roughly £90 per seat per month and still gives a weaker client experience. The app keeps the operational detail (logistics, scribe assignment, client confirmation, outputs) where we control it and pushes a contact, company and deal into HubSpot so the team's pipeline reviews still see every job.

Design principles:

- One job record, one ID, one link per party. Client, scribe and our team all look at the same job.
- Rates are quoted on the job, never published. The client sees the fee in their booking, nothing on the site.
- Clients never see scribe contact details; scribes never see client contact details. We sit in the middle.
- Click-to-accept terms with an audit trail for standard jobs; DocuSign kept for clients who insist on a signed schedule of work.
- Every stage change sends one email. Nobody chases by hand.
- Scribing first, built so Strategic Visualisation and the other five services can be added as job types later.

## The booking journey

(Flow diagram: client → studio → scribe lanes, 9 steps; see the stages table below and docs/prototype.html.)

The job moves between the three lanes but never skips the studio: the client and the scribe are never in direct contact. The two shaded steps are where money and commitment lock in (6) and where the job closes (9).

## Stages in detail

Eight stages, each with one trigger, one actor and one automated email. A job can be cancelled from any stage before the event.

| # | Stage | Trigger | Actor | What they see / do | Email sent |
| --- | --- | --- | --- | --- | --- |
| 1 | Draft | Scoping call done | Us | Create job: client contact, event, dates, service, rate basis, fee, deliverables. Job ID issued | None |
| 2 | Awaiting client | We click Send | Client | Unique link: reviews scope and fee, completes logistics and billing, picks PO or card, accepts terms | "Your booking with Ludic Media Studio" with link |
| 3 | Booked | Client submits | Us | Booking confirmed; job appears in Sourcing queue. Deposit invoice (card) or PO request (PO) raised | Client: booking received. Us: new booking |
| 4 | Sourcing scribe | Booking received | Us | Shortlist from scribe pool; send offer to one scribe at a time (or several, first to accept wins) | Scribe: job offer with brief, dates, fee, accept/decline link |
| 5 | Scribe assigned | Scribe accepts | Scribe → Client | Client sees scribe's first name, style, portfolio samples; one-click confirm or request alternative | Client: your scribe is confirmed |
| 6 | Confirmed | Client confirms, deposit paid or PO received | Us | Job locked in; calendar entry; pre-event checklist opens (materials, access, travel) | Scribe: you're confirmed, calendar invite. Client: confirmation and what happens next |
| 7 | Delivered | Event date passed, outputs uploaded | Us / Scribe | Scribe uploads outputs to the job; we review and release to the client; balance invoice raised | Client: your outputs are ready. Then: balance due |
| 8 | Closed | Balance paid | Us | Feedback request; HubSpot deal marked won; job archived | Client: thank you + 2-question feedback |

Cancellation: the client can cancel from their link until Stage 6; after that cancellation terms apply (set in the job's terms). Cancelling notifies the scribe automatically.

## The three portals

One app, three views, each reached by a signed link (no passwords for clients or scribes; magic link if they need to return).

| Portal | Who | URL pattern | What it shows |
| --- | --- | --- | --- |
| Client booking | Client contact | ludicmedia.studio/book/‹token› | Scope and fee (read-only), logistics and billing form, PO/card choice, terms acceptance, later the scribe confirmation, outputs download and invoices |
| Scribe portal | Freelance scribe | ludicmedia.studio/scribe/‹token› | Job offer (brief, dates, venue, fee, travel policy), accept/decline, then the full brief, pre-event checklist, output upload. No client contact details |
| Job tracker | Ludic Media team | ludicmedia.studio/admin (Microsoft 365 sign-in) | Kanban by stage, job detail, scribe pool, send/resend links, assign scribe, raise invoices, release outputs, HubSpot/Xero status |

The client and scribe portals are deliberately thin: one job, one action at a time, matching the stage. The tracker is where all the complexity lives.

## Booking form fields

We pre-fill everything agreed on the scoping call; the client completes logistics and billing. Every field below comes from the current briefing sheet or the schedule-of-work letter, so nothing we capture today is lost.

| Section | Field | Filled by | Source today |
| --- | --- | --- | --- |
| Scope | Event name, purpose, what is being captured | Us (client can edit) | Briefing sheet |
| Scope | Type of scribing (live digital, live analogue/wall, sketchnote, remote), style of event | Us | Briefing sheet |
| Scope | Session schedule: per day, start/end, session type (keynote, breakout, closing) | Us | Schedule of Work table |
| Scope | Size of group, language | Us / Client | Briefing sheet |
| Fee | Rate basis (half day up to 4 h consecutive, full day), number of units, unit rate, total, currency, excludes expenses | Us | Schedule of Work |
| Fee | Expenses policy (travel, accommodation billed at cost / capped / included) | Us | Letter ("excludes expenses") |
| Outputs | Output spec (format, resolution, editable files), delivery date, usage rights | Us / Client | Briefing sheet |
| Logistics | Venue name and address, room, on-site contact and mobile, arrival time, access/security requirements | Client | Briefing sheet |
| Logistics | Materials on site (whiteboards, flip charts, screens, camera, power, Wi-Fi) | Client | Briefing sheet |
| Logistics | Accommodation and travel: who books, flights/transfers needed (Yes/No; details later) | Client | Briefing sheet |
| Contacts | Primary client contact, organisation, email, phone | Us (pre-filled) | Briefing sheet |
| Billing | Legal entity, billing address, AP email, VAT number, PO required (Yes/No), PO number if known | Client | Letter (address for LOE and billing) |
| Payment | Route: Purchase order / Pay by card (50% now, 50% on delivery) | Client | New |
| Terms | Cancellation terms, IP/usage, confidentiality, acceptance checkbox, name, date, IP address logged | Client | Letter + DocuSign |

Fields we drop from the client-facing form: Ludic contact names, after-hours travel number and internal job support names. Those sit in the confirmation email and the tracker, not the booking.

## Job IDs and statuses

Format: `LMS-2026-0042` — studio prefix, year, sequence reset each January and zero-padded to four digits. Issued at Draft, never reused, printed on every email, invoice, output file name and the HubSpot deal name. Today's `LC-360In-30.11.26` style mixes client, project and date and cannot be sorted or searched reliably.

Status is a single column on the job with these values, in this order: `draft`, `awaiting_client`, `booked`, `sourcing`, `scribe_assigned`, `confirmed`, `delivered`, `closed`, plus `cancelled` reachable from any stage before `delivered`. Two independent flags sit beside it so the main status stays clean: `payment_status` (`unpaid`, `deposit_paid`, `po_received`, `paid`) and `contract_status` (`pending`, `accepted_online`, `signed_docusign`).

Every transition is written to a `job_events` log with who, when and from/to status. That log is the audit trail for the terms acceptance and the source for the tracker's activity feed.

## Data model (Supabase)

Eleven tables in Postgres. Row-level security does the access control: team members (Supabase Auth via Microsoft 365) see everything; clients and scribes reach rows only through signed tokens checked by an edge function, never with a direct database session.

| Table | Purpose | Key fields |
| --- | --- | --- |
| `clients` | Client organisations | name, billing\_entity, billing\_address, vat\_number, ap\_email, po\_required, hubspot\_company\_id |
| `contacts` | People at clients | client\_id, name, email, phone, role, hubspot\_contact\_id |
| `jobs` | One row per booking | job\_ref (LMS-2026-0042), client\_id, contact\_id, service\_type, event\_name, purpose, status, payment\_status, contract\_status, currency, fee\_total, expenses\_policy, output\_spec, output\_due, venue, logistics (jsonb), terms\_version, accepted\_at, accepted\_by, accepted\_ip, hubspot\_deal\_id, xero\_contact\_id, created\_by |
| `job_sessions` | Schedule lines | job\_id, date, start, end, session\_type, location, notes |
| `job_fee_lines` | Fee breakdown | job\_id, description, unit (half\_day / day / item), qty, unit\_rate, amount |
| `scribes` | Freelance pool | name, email, phone, base\_location, styles (array), languages, day\_rate, half\_day\_rate, portfolio\_urls, notes, active |
| `job_assignments` | Scribe offers | job\_id, scribe\_id, offered\_at, responded\_at, response (accepted / declined / expired), fee\_to\_scribe, client\_confirmed\_at |
| `job_files` | Briefs and outputs | job\_id, kind (brief / output / po / invoice), storage\_path, uploaded\_by, released\_to\_client\_at |
| `invoices` | Money | job\_id, kind (deposit / balance / full), amount, xero\_invoice\_id, stripe\_payment\_intent\_id, status, issued\_at, paid\_at |
| `job_events` | Audit log | job\_id, at, actor\_type (team / client / scribe / system), actor\_id, from\_status, to\_status, note |
| `tokens` | Signed links | job\_id, party (client / scribe), scribe\_id, token\_hash, expires\_at, last\_used\_at |

Files (briefs, outputs, POs) go in Supabase Storage in a bucket per job, with signed download URLs that expire. A `service_types` lookup table carries the form template per service so Strategic Visualisation and the rest can be added without a schema change.

## Payments and invoicing

The client picks one route on the booking form; the invoices are always raised in Xero so the ledger stays single.

|  | Purchase order | Pay by card |
| --- | --- | --- |
| Who it suits | Corporates with procurement (most of our clients) | Smaller clients, agencies, short-notice jobs |
| At booking | Client enters PO number or uploads PO; if none yet, job holds at Booked with a "PO outstanding" flag | Stripe Checkout for 50% deposit; card, Apple Pay, Google Pay, Link |
| Invoice 1 | Xero invoice for 100% (or 50% if client asks for split), PO number on it, emailed from Xero on confirmation | Xero invoice for the deposit, marked paid from the Stripe webhook |
| Invoice 2 | None (or balance) | Xero invoice for the remaining 50% at Delivered, with a Stripe payment link on it |
| Terms | Xero default (30 days) | Deposit on booking; balance within 7 days of delivery |
| Cost to us | None | Stripe UK: 1.5% + 20p domestic cards, 2.5% + 20p EU cards, 3.25% + 20p non-EU (standard published rates; worth confirming on signup) |

Why Stripe: no monthly fee, pay-per-transaction only, multi-currency (GBP, EUR, USD, CHF match our HubSpot currencies), hosted checkout so no card data touches our servers, and a native Xero integration. At our volume the fee on a £2,800 job paid by UK card is about £42; most clients will choose PO anyway.

Expenses are billed at cost on the balance invoice, from receipts the scribe uploads to the job.

## Integrations

All integrations run as Supabase Edge Functions (Deno) triggered by database webhooks on `jobs` and `invoices`, so the app itself stays simple and each connection can fail and retry on its own.

| System | Direction | What moves | When |
| --- | --- | --- | --- |
| HubSpot (Starter, EU portal) | App → HubSpot | Upsert company and contact; create deal "LMS-2026-0042 – Event name" in the Ludic Pipeline at Contracting with amount and close date = event date; move to Closed Won at Confirmed, Closed Lost at Cancelled; log a note on each status change | Draft created; every status change |
| HubSpot | HubSpot → App | Optional: "Create scribing job" from a deal pre-fills the Draft from the deal's company and contact | Manual, from the tracker |
| Xero | App → Xero | Upsert contact; create invoice with PO reference and job ref; attach PO PDF | Booked (PO) / Confirmed and Delivered (card) |
| Xero | Xero → App | Invoice paid (webhook) updates `payment_status` | On payment |
| Stripe | App → Stripe | Checkout session for deposit; payment link on balance invoice | Booking submitted; Delivered |
| Stripe | Stripe → App | `checkout.session.completed` marks invoice paid, moves job on, marks the Xero invoice paid | On payment |
| Email (Resend or Postmark) | App → Client / Scribe / Team | The eight stage emails, from bookings@ludicmedia.studio, templated with the job ref | Every stage |
| Calendar (Microsoft 365 Graph) | App → Team + Scribe | Calendar invite for each session on Confirmed | Confirmed |
| DocuSign | Manual fallback | For clients requiring a signed schedule of work: generate the SoW PDF from the job, send via DocuSign, upload the signed copy to the job, set `contract_status = signed_docusign` | Only when the client asks |

The SoW PDF is generated from the job in both cases, so the DocuSign route uses the same data and the same ID.

## Terms, security and data protection

Click-to-accept is enforceable in the UK for standard commercial terms when we can show what was accepted, by whom and when. The booking stores the terms version, the accepting name, email, timestamp and IP, and emails the client a PDF of the accepted schedule of work and terms. For clients whose procurement requires a wet or DocuSign signature, the fallback in Integrations applies.

- Terms are versioned (`terms_v1`, `terms_v2`); a job always points at the version it accepted.
- Client and scribe links are signed tokens with an expiry (30 days, renewable from the tracker), stored hashed. A leaked link exposes one job only.
- Team access is Microsoft 365 sign-in (Entra) on our ludicgroup.com tenant; no separate passwords.
- Scribe personal data (rates, phone, address) is visible only to the team. Clients see first name, style and portfolio samples.
- Client contact data syncs to HubSpot under the same lawful basis as today (contract). Privacy notice on the booking form links to the Ludic Group policy.
- Outputs and briefs live in Supabase Storage in the EU (London or Frankfurt region); signed download URLs expire after 7 days and can be re-issued.
- Retention: jobs kept 7 years for accounting; scribe records deleted on request.

## Build plan

Three phases; phase 1 replaces the briefing sheet and letter on its own and can go live in about three weeks of one developer's time.

| Phase | Scope | Effort (dev days) | Outcome |
| --- | --- | --- | --- |
| 1 – Book | Supabase schema, job tracker (list + detail), client booking link, terms acceptance, SoW PDF, stage emails, HubSpot deal sync | 12–15 | Every new job booked online with an ID; no more Word sheet or DocuSign for standard jobs |
| 2 – Staff and pay | Scribe pool, offer/accept portal, client scribe confirmation, Stripe deposit checkout, Xero invoice creation and paid webhooks | 10–12 | Sourcing and payment run inside the job; cash arrives earlier |
| 3 – Deliver | Scribe output upload, review and release, balance invoice, feedback, calendar invites, Kanban and reporting (jobs per month, revenue, scribe utilisation) | 8–10 | Full lifecycle; management view of the studio |

Stack: Next.js on Vercel (or our existing front-end stack), Supabase (Postgres, Auth, Storage, Edge Functions), Stripe, Xero API, HubSpot API, Resend. Running cost at our volume is under £60 a month before Stripe fees.

First two weeks: I produce the clickable prototype (done alongside this spec), we agree the form fields and emails with the studio team, then the dev builds against the schema above. Migrate the last 12 months of jobs by CSV so reporting has a baseline.

## Open questions

- [ ] Who in the studio owns the tracker day to day (sends links, assigns scribes)? Named owner per job, or a shared queue?
- [ ] Scribe offers: one at a time, or several with first-to-accept? One at a time is cleaner for relationships; several is faster for short notice.
- [ ] Do we want the client to be able to decline an assigned scribe and ask for another? Suggested: yes, once.
- [ ] Should the scribe's fee be set per job in the tracker (current practice) or default from the scribe's rate card?
- [ ] Xero: which entity invoices (Ludic Limited, as on the letter)? Any clients invoiced from a different entity or currency?
- [ ] Card route: deposit only (50%) with balance by invoice, or should the client be able to pay 100% up front?
- [ ] Expenses: billed at cost, capped, or quoted into the fee? The letter says excluded; the form needs one default.
- [ ] Do we want HubSpot deals created for every job, or only above a fee threshold, to keep the pipeline readable?
- [ ] Which of our developers builds it, and is Next.js/Vercel the stack they would choose?
