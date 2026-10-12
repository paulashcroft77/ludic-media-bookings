import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { JobStatus } from "@/lib/format";

// Read paths for the job tracker. Every query runs as the signed-in team member, so RLS applies.

export async function listTeamMembers() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("team_members").select("id, email, full_name").order("full_name");
  if (error) throw error;
  return data;
}

export function teamMemberName(m: { email: string; full_name: string | null } | undefined) {
  if (!m) return null;
  return m.full_name ?? m.email.split("@")[0];
}

export async function listJobs(status?: JobStatus) {
  const supabase = await createClient();
  let query = supabase
    .from("jobs")
    .select(
      "id, job_ref, status, event_name, currency, owner_id, created_at, clients(name), job_sessions(session_date), job_fee_lines(qty, unit_rate_minor)",
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function countJobsByStatus() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("jobs").select("status");
  if (error) throw error;
  const counts = new Map<JobStatus, number>();
  for (const { status } of data) counts.set(status, (counts.get(status) ?? 0) + 1);
  return counts;
}

export async function getJob(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select(
      `*,
       clients(name, billing_entity),
       contacts(name, email, phone, role),
       job_sessions(id, session_date, start_time, end_time, session_type, location, sort),
       job_fee_lines(id, description, unit, qty, unit_rate_minor, sort),
       job_events(id, at, actor_type, actor_id, from_status, to_status, note)`,
    )
    .eq("id", id)
    .order("sort", { referencedTable: "job_sessions" })
    .order("sort", { referencedTable: "job_fee_lines" })
    .order("at", { referencedTable: "job_events", ascending: false })
    .maybeSingle();
  if (error) throw error;
  return data;
}

// The current client link, without its hash: the raw link is shown once, when it is created.
export async function getActiveClientLink(jobId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tokens")
    .select("created_at, expires_at, last_used_at")
    .eq("job_id", jobId)
    .eq("party", "client")
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getRateCard() {
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("value").eq("key", "rate_card").maybeSingle();
  return (data?.value ?? null) as { currency: string; half_day: number; full_day: number; travel_day: number } | null;
}
