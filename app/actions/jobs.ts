"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireTeamUser } from "@/lib/auth";
import { NewJobSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";
import { bookingUrl, newLinkToken } from "@/lib/tokens";

export type CreateJobState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

// Row fields arrive as repeated session_date, session_start, ... values; zip them back into objects
// and drop rows the user left blank (select fields always carry a value, so they don't count).
function rows(formData: FormData, prefix: string, keys: string[], selects: string[] = []) {
  const columns = keys.map((k) => formData.getAll(`${prefix}_${k}`).map(String));
  const count = Math.max(0, ...columns.map((c) => c.length));
  return Array.from({ length: count }, (_, i) =>
    Object.fromEntries(keys.map((k, j) => [k, columns[j][i] ?? ""])),
  ).filter((row) => keys.some((k) => !selects.includes(k) && row[k].trim() !== ""));
}

export async function createJob(_prev: CreateJobState, formData: FormData): Promise<CreateJobState> {
  await requireTeamUser();

  const raw = {
    ...Object.fromEntries(
      [
        "source",
        "client_name",
        "contact_name",
        "contact_email",
        "contact_phone",
        "event_name",
        "scribing_type",
        "venue",
        "group_size",
        "purpose",
        "capture",
        "currency",
        "expenses_policy",
        "output_spec",
        "output_due",
        "owner_id",
      ].map((k) => [k, formData.get(k) ?? undefined]),
    ),
    sessions: rows(formData, "session", ["date", "start", "end", "session_type"]),
    fee_lines: rows(formData, "fee", ["description", "unit", "qty", "unit_rate"], ["unit"]),
  };

  const parsed = NewJobSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      fieldErrors[key] ??= issue.message;
    }
    return { error: "Check the highlighted fields.", fieldErrors };
  }

  const supabase = await createClient();
  const { data: job, error } = await supabase.rpc("create_job", { payload: parsed.data });
  if (error || !job) {
    console.error("create_job failed", error);
    return { error: "The job couldn't be saved. Please try again." };
  }

  redirect(`/admin/jobs/${job.id}?created=1`);
}

export type SendLinkResult = { ok: true; url: string; expiresAt: string } | { ok: false; error: string };

export async function sendBookingLink(jobId: string): Promise<SendLinkResult> {
  await requireTeamUser();
  if (!z.uuid().safeParse(jobId).success) return { ok: false, error: "Unknown job." };

  const { token, hash } = newLinkToken();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("send_booking_link", { p_job_id: jobId, p_token_hash: hash });

  if (error || !data) {
    console.error("send_booking_link failed", error);
    const message =
      error?.code === "22023"
        ? "This job has moved past the booking stage, so a booking link can't be sent."
        : "The booking link couldn't be created. Please try again.";
    return { ok: false, error: message };
  }

  refresh();
  return { ok: true, url: bookingUrl(token), expiresAt: data.expires_at };
}
