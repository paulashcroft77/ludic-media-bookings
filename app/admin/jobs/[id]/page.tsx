import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { requireTeamUser } from "@/lib/auth";
import {
  STAGES,
  STATUS_LABEL,
  feeTotalMinor,
  formatDate,
  formatDateRange,
  formatMoney,
  formatTime,
  formatTimestamp,
  humanise,
} from "@/lib/format";
import { getActiveClientLink, getJob, listTeamMembers, teamMemberName } from "@/lib/jobs";
import { FEE_UNITS, JOB_SOURCES } from "@/lib/schemas";
import { StatusPill } from "../../status-pill";
import { BookingLinkPanel } from "./booking-link";

export const metadata: Metadata = { title: "Job" };

export default function JobPage({ params, searchParams }: PageProps<"/admin/jobs/[id]">) {
  return (
    <Suspense fallback={<div className="skeleton" style={{ marginTop: 24 }} aria-label="Loading job" />}>
      <JobDetail params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function JobDetail({ params, searchParams }: PageProps<"/admin/jobs/[id]">) {
  await requireTeamUser();
  const { id } = await params;
  const { created } = await searchParams;
  if (!z.uuid().safeParse(id).success) notFound();

  const [job, activeLink, team] = await Promise.all([getJob(id), getActiveClientLink(id), listTeamMembers()]);
  if (!job) notFound();

  const names = new Map(team.map((m) => [m.id, teamMemberName(m)]));
  const total = feeTotalMinor(job.job_fee_lines);
  const money = (minor: number) => formatMoney(minor, job.currency);
  const stageIndex = STAGES.indexOf(job.status);
  const contact = job.contacts!;

  return (
    <main>
      <div className="strip">
        <span className="ref" data-testid="job-ref">
          {job.job_ref}
        </span>
        <span>
          {job.event_name} · {job.clients?.name}
        </span>
        {job.status === "cancelled" ? (
          <StatusPill status="cancelled" />
        ) : (
          <div className="steps" aria-label="Stage">
            {STAGES.slice(1).map((s, k) => (
              <span
                key={s}
                className={`step ${k + 1 < stageIndex ? "done" : k + 1 === stageIndex ? "now" : ""}`}
                aria-current={k + 1 === stageIndex ? "step" : undefined}
              >
                {STATUS_LABEL[s]}
              </span>
            ))}
          </div>
        )}
      </div>

      {created === "1" && job.status === "draft" && (
        <p className="ok" role="status" style={{ marginBottom: 20 }}>
          Job {job.job_ref} created as draft. Nothing has been sent to the client.
        </p>
      )}

      <div className="grid side">
        <div className="stack">
          <section className="card">
            <p className="eyebrow">{job.job_ref}</p>
            <h2>{job.event_name}</h2>
            <p style={{ margin: "6px 0 14px", display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span data-testid="job-status">
                <StatusPill status={job.status} />
              </span>
              <span className={`pill ${job.payment_status === "paid" ? "go" : job.payment_status === "unpaid" ? "warn" : "info"}`}>
                {humanise(job.payment_status)}
              </span>
              <span className={`pill ${job.contract_status === "pending" ? "warn" : "go"}`}>
                Contract {humanise(job.contract_status).toLowerCase()}
              </span>
            </p>
            <dl className="kv">
              <dt>Client</dt>
              <dd>
                {job.clients?.name} · {contact.name}
              </dd>
              <dt>Dates</dt>
              <dd>
                {formatDateRange(job.job_sessions.map((s) => s.session_date))}
                {job.venue && ` · ${job.venue}`}
              </dd>
              <dt>Fee</dt>
              <dd>
                <span className="mono">{money(total)}</span> ·{" "}
                {job.payment_route ? job.payment_route.toUpperCase() : "route not chosen"}
              </dd>
              <dt>Owner</dt>
              <dd>{(job.owner_id && names.get(job.owner_id)) ?? "—"}</dd>
              <dt>Source</dt>
              <dd>{job.source ? JOB_SOURCES[job.source as keyof typeof JOB_SOURCES] ?? job.source : "—"}</dd>
            </dl>
            <BookingLinkPanel
              jobId={job.id}
              status={job.status}
              contactName={contact.name}
              contactEmail={contact.email}
              activeLink={activeLink}
            />
          </section>

          <section className="card">
            <h2>Scope and fee</h2>
            <dl className="kv" style={{ marginTop: 14 }}>
              <dt>Purpose</dt>
              <dd>{job.purpose ?? "—"}</dd>
              <dt>What we capture</dt>
              <dd>{job.capture ?? "—"}</dd>
              <dt>Format</dt>
              <dd>{[job.scribing_type, job.group_size].filter(Boolean).join(" · ") || "—"}</dd>
              <dt>Outputs</dt>
              <dd>
                {job.output_spec ?? "—"}
                {job.output_due && (
                  <>
                    <br />
                    <span className="muted">Delivered by {formatDate(job.output_due)}</span>
                  </>
                )}
              </dd>
              <dt>Expenses</dt>
              <dd>{job.expenses_policy ?? "—"}</dd>
            </dl>

            <h3 style={{ margin: "18px 0 8px" }}>Schedule</h3>
            {job.job_sessions.length === 0 ? (
              <p className="muted">Dates tbc.</p>
            ) : (
              <div className="tbl">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Session</th>
                    </tr>
                  </thead>
                  <tbody>
                    {job.job_sessions.map((s) => (
                      <tr key={s.id}>
                        <td>{formatDate(s.session_date)}</td>
                        <td className="mono">
                          {[formatTime(s.start_time), formatTime(s.end_time)].filter(Boolean).join("–") || "tbc"}
                        </td>
                        <td>{s.session_type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <h3 style={{ margin: "18px 0 8px" }}>Fee</h3>
            <div className="tbl">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="num">Qty</th>
                    <th className="num">Rate</th>
                    <th className="num">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {job.job_fee_lines.map((f) => (
                    <tr key={f.id}>
                      <td>
                        {f.description}{" "}
                        <span className="muted">· {FEE_UNITS[f.unit as keyof typeof FEE_UNITS] ?? f.unit}</span>
                      </td>
                      <td className="num">{Number(f.qty)}</td>
                      <td className="num">{money(f.unit_rate_minor)}</td>
                      <td className="num">{money(Math.round(Number(f.qty) * f.unit_rate_minor))}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={3}>
                      <b>Total, excluding VAT and expenses</b>
                    </td>
                    <td className="num">
                      <b data-testid="fee-total">{money(total)}</b>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="card">
            <h2>Activity</h2>
            <ul className="log" style={{ marginTop: 10 }} data-testid="activity">
              {job.job_events.map((e) => {
                const who = e.actor_type === "team" ? (e.actor_id && names.get(e.actor_id)) : humanise(e.actor_type);
                const what =
                  e.note ??
                  (e.from_status && e.to_status
                    ? `${STATUS_LABEL[e.from_status]} → ${STATUS_LABEL[e.to_status]}`
                    : e.to_status && STATUS_LABEL[e.to_status]);
                return (
                  <li key={e.id}>
                    <span>{formatTimestamp(e.at)}</span>
                    <span>
                      {what}
                      {who && <span className="muted"> · {who}</span>}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <aside className="stack">
          <div className="card">
            <p className="eyebrow">Client contact</p>
            <p style={{ marginTop: 6 }}>
              <b>{contact.name}</b>
              {contact.role && <span className="muted"> · {contact.role}</span>}
              <br />
              <a href={`mailto:${contact.email}`} className="muted">
                {contact.email}
              </a>
              {contact.phone && (
                <>
                  <br />
                  <span className="muted">{contact.phone}</span>
                </>
              )}
            </p>
            <p className="muted" style={{ fontSize: ".85rem", marginTop: 10 }}>
              {job.clients?.name}
              {job.clients?.billing_entity ? ` · invoiced to ${job.clients.billing_entity}` : " · billing details come from the client's booking"}
            </p>
          </div>
          <div className="card">
            <p className="eyebrow">Record</p>
            <dl className="kv" style={{ marginTop: 8, gridTemplateColumns: "90px 1fr" }}>
              <dt>Created</dt>
              <dd>{formatTimestamp(job.created_at)}</dd>
              <dt>Currency</dt>
              <dd>{job.currency}</dd>
              <dt>Service</dt>
              <dd>{humanise(job.service_type)}</dd>
            </dl>
          </div>
        </aside>
      </div>
    </main>
  );
}
