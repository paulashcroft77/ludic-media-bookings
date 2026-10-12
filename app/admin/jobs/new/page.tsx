import type { Metadata } from "next";
import { Suspense } from "react";
import { requireTeamUser } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { getRateCard, listTeamMembers, teamMemberName } from "@/lib/jobs";
import { NewJobForm } from "./new-job-form";

export const metadata: Metadata = { title: "New job" };

export default function NewJobPage() {
  return (
    <main>
      <div className="hero">
        <p className="eyebrow">Job tracker · new job</p>
        <h1>New scribing job</h1>
        <p className="muted" style={{ marginTop: 6 }}>
          Fill this in straight after the scoping call. Everything here is pre-filled into the client&apos;s booking
          link; they add logistics and billing.
        </p>
      </div>
      <Suspense fallback={<div className="skeleton" aria-label="Loading form" />}>
        <NewJob />
      </Suspense>
    </main>
  );
}

async function NewJob() {
  const user = await requireTeamUser();
  const [team, rateCard] = await Promise.all([listTeamMembers(), getRateCard()]);
  const owners = team.map((m) => ({ id: m.id, name: teamMemberName(m)! }));
  if (!owners.some((o) => o.id === user.id)) owners.unshift({ id: user.id, name: user.name });

  const rateHint = rateCard
    ? `Rate card defaults: half day ${formatMoney(rateCard.half_day, rateCard.currency)}, full day ${formatMoney(rateCard.full_day, rateCard.currency)}, international travel day ${formatMoney(rateCard.travel_day, rateCard.currency)}.`
    : null;

  return <NewJobForm owners={owners} defaultOwnerId={user.id} rateHint={rateHint} />;
}
