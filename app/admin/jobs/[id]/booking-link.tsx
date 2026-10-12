"use client";

import { useState, useTransition } from "react";
import { sendBookingLink, type SendLinkResult } from "@/app/actions/jobs";
import { formatDay, type JobStatus } from "@/lib/format";

type Props = {
  jobId: string;
  status: JobStatus;
  contactName: string;
  contactEmail: string;
  activeLink: { expires_at: string; last_used_at: string | null } | null;
};

export function BookingLinkPanel({ jobId, status, contactName, contactEmail, activeLink }: Props) {
  const [result, setResult] = useState<SendLinkResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  function send(reissue: boolean) {
    if (reissue && !window.confirm(`Issue a new link for ${contactName}? The current link will stop working.`)) return;
    setCopied(false);
    startTransition(async () => setResult(await sendBookingLink(jobId)));
  }

  async function copy(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(true);
  }

  return (
    <div className="stack" style={{ gap: 12, marginTop: 16 }}>
      {result?.ok && (
        <div className="ok" role="status" style={{ fontWeight: 400 }}>
          <b>Booking link ready for {contactName}.</b> Expires {formatDay(result.expiresAt)}.
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <input
              className="input mono"
              readOnly
              value={result.url}
              aria-label="Booking link"
              data-testid="booking-link"
              onFocus={(e) => e.currentTarget.select()}
              style={{ fontSize: ".8rem" }}
            />
            <button type="button" className="btn small secondary" onClick={() => copy(result.url)}>
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p style={{ fontSize: ".85rem", marginTop: 8, color: "var(--ink)" }}>
            Copy it now: only a fingerprint of the link is stored, so it can&apos;t be shown again. The booking email
            to {contactEmail} arrives with the stage emails; until then, send the link yourself.
          </p>
        </div>
      )}

      {result && !result.ok && (
        <p className="notice danger" role="alert">
          {result.error}
        </p>
      )}

      {status === "draft" && (
        <>
          <div className="notice">
            Draft. Check the scope and fee, then send the booking link to {contactName} ({contactEmail}). Nothing
            reaches the client until you do.
          </div>
          <div className="actions" style={{ marginTop: 0 }}>
            <button type="button" className="btn marker" onClick={() => send(false)} disabled={pending}>
              {pending ? "Sending…" : "Send booking link"}
            </button>
          </div>
        </>
      )}

      {status === "awaiting_client" && (
        <div className="notice">
          Booking link sent to {contactName}
          {activeLink && (
            <>
              {" "}
              · expires {formatDay(activeLink.expires_at)} ·{" "}
              {activeLink.last_used_at ? `last opened ${formatDay(activeLink.last_used_at)}` : "not opened yet"}
            </>
          )}
          .{" "}
          <button type="button" className="btn small secondary" onClick={() => send(true)} disabled={pending}>
            {pending ? "Issuing…" : "Re-issue link"}
          </button>
        </div>
      )}
    </div>
  );
}
