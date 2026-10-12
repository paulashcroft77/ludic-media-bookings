import { STATUS_LABEL, type JobStatus } from "@/lib/format";

const TONE: Record<JobStatus, string> = {
  draft: "",
  awaiting_client: "warn",
  booked: "info",
  sourcing: "info",
  scribe_assigned: "info",
  confirmed: "info",
  delivered: "go",
  closed: "go",
  cancelled: "",
};

export function StatusPill({ status }: { status: JobStatus }) {
  return <span className={`pill ${TONE[status]}`}>{STATUS_LABEL[status]}</span>;
}
