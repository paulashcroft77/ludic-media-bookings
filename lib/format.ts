import type { Database } from "@/lib/database.types";

export type JobStatus = Database["public"]["Enums"]["job_status"];

export const STAGES: JobStatus[] = [
  "draft",
  "awaiting_client",
  "booked",
  "sourcing",
  "scribe_assigned",
  "confirmed",
  "delivered",
  "closed",
];

export const STATUS_LABEL: Record<JobStatus, string> = {
  draft: "Draft",
  awaiting_client: "Awaiting client",
  booked: "Booked",
  sourcing: "Sourcing scribe",
  scribe_assigned: "Scribe assigned",
  confirmed: "Confirmed",
  delivered: "Delivered",
  closed: "Closed",
  cancelled: "Cancelled",
};

export function humanise(value: string): string {
  const s = value.replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatMoney(amountMinor: number, currency: string): string {
  const major = amountMinor / 100;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: Number.isInteger(major) ? 0 : 2,
  }).format(major);
}

export function feeTotalMinor(lines: { qty: number; unit_rate_minor: number }[]): number {
  return Math.round(lines.reduce((sum, l) => sum + Number(l.qty) * l.unit_rate_minor, 0));
}

// Session dates are calendar dates in the venue's timezone; format them without shifting.
// "Sun 29 Nov 2026", as in the prototype (en-GB would otherwise put a comma after the weekday).
export function formatDate(isoDate: string, withYear = true): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  })
    .formatToParts(new Date(Date.UTC(y, m - 1, d)))
    .filter((p) => p.type !== "literal")
    .map((p) => p.value)
    .join(" ");
}

export function formatDateRange(dates: string[]): string {
  const sorted = [...dates].sort();
  if (sorted.length === 0) return "Dates tbc";
  if (sorted.length === 1 || sorted[0] === sorted.at(-1)) return formatDate(sorted[0]);
  return `${formatDate(sorted[0], false)} – ${formatDate(sorted.at(-1)!)}`;
}

export function formatTime(t: string | null): string {
  return t ? t.slice(0, 5) : "";
}

export function formatTimestamp(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  }).format(new Date(iso));
}

export function formatDay(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/London",
  }).format(new Date(iso));
}
