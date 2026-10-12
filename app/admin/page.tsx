import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireTeamUser } from "@/lib/auth";
import {
  STAGES,
  STATUS_LABEL,
  feeTotalMinor,
  formatDateRange,
  formatMoney,
  type JobStatus,
} from "@/lib/format";
import { countJobsByStatus, listJobs, listTeamMembers, teamMemberName } from "@/lib/jobs";
import { StatusPill } from "./status-pill";

export const metadata: Metadata = { title: "Scribing jobs" };

export default function JobsPage({ searchParams }: PageProps<"/admin">) {
  return (
    <main>
      <div
        className="hero"
        style={{ display: "flex", flexWrap: "wrap", alignItems: "end", justifyContent: "space-between", gap: 12 }}
      >
        <div>
          <p className="eyebrow">Job tracker · Ludic Media Studio</p>
          <h1>Scribing jobs</h1>
        </div>
        <Link href="/admin/jobs/new" className="btn marker">
          + New job
        </Link>
      </div>
      <Suspense fallback={<div className="skeleton" aria-label="Loading jobs" />}>
        <JobList searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

const FILTERS: JobStatus[] = [...STAGES, "cancelled"];

async function JobList({ searchParams }: Pick<PageProps<"/admin">, "searchParams">) {
  await requireTeamUser();
  const { status: statusParam } = await searchParams;
  const status = FILTERS.find((s) => s === statusParam);

  const [jobs, counts, team] = await Promise.all([listJobs(status), countJobsByStatus(), listTeamMembers()]);
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  const owners = new Map(team.map((m) => [m.id, teamMemberName(m)]));

  return (
    <>
      <nav className="steps" aria-label="Filter by status" style={{ marginBottom: 16 }}>
        <Link href="/admin" className={`step ${!status ? "now" : ""}`} aria-current={!status ? "page" : undefined}>
          All · {total}
        </Link>
        {FILTERS.filter((s) => counts.get(s) || s === status).map((s) => (
          <Link
            key={s}
            href={`/admin?status=${s}`}
            className={`step ${status === s ? "now" : ""}`}
            aria-current={status === s ? "page" : undefined}
          >
            {STATUS_LABEL[s]} · {counts.get(s) ?? 0}
          </Link>
        ))}
      </nav>

      {jobs.length === 0 ? (
        <div className="card">
          <p>{status ? `No jobs are ${STATUS_LABEL[status].toLowerCase()}.` : "No jobs yet."}</p>
          <p className="muted" style={{ marginTop: 6 }}>
            Create one straight after the scoping call; the client gets nothing until you send the booking link.
          </p>
        </div>
      ) : (
        <section className="card tbl" aria-label="Jobs">
          <table>
            <thead>
              <tr>
                <th>Job</th>
                <th>Event</th>
                <th>Client</th>
                <th>Dates</th>
                <th className="num">Fee</th>
                <th>Status</th>
                <th>Owner</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="link-row">
                  <td className="mono" style={{ whiteSpace: "nowrap" }}>
                    <Link href={`/admin/jobs/${job.id}`} className="row-link">
                      {job.job_ref}
                    </Link>
                  </td>
                  <td>{job.event_name}</td>
                  <td>{job.clients?.name}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {formatDateRange(job.job_sessions.map((s) => s.session_date))}
                  </td>
                  <td className="num mono">{formatMoney(feeTotalMinor(job.job_fee_lines), job.currency)}</td>
                  <td>
                    <StatusPill status={job.status} />
                  </td>
                  <td className="muted">{(job.owner_id && owners.get(job.owner_id)) ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </>
  );
}
