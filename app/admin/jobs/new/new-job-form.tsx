"use client";

import Link from "next/link";
import { startTransition, useActionState, useId, useState, type ReactNode } from "react";
import { createJob, type CreateJobState } from "@/app/actions/jobs";
import { CURRENCIES, EXPENSES_POLICIES, FEE_UNITS, JOB_SOURCES, SCRIBING_TYPES } from "@/lib/schemas";

type Props = {
  owners: { id: string; name: string }[];
  defaultOwnerId: string;
  rateHint: string | null;
};

const SOURCE_HINT: Record<keyof typeof JOB_SOURCES, string> = {
  call: "Typed in now",
  hubspot: "From an existing deal",
  web: "From a website enquiry",
};

let rowSeq = 0;
const newRow = () => ++rowSeq;

export function NewJobForm({ owners, defaultOwnerId, rateHint }: Props) {
  const [state, formAction, pending] = useActionState<CreateJobState, FormData>(createJob, {});
  const [sessions, setSessions] = useState(() => [newRow()]);
  const [fees, setFees] = useState(() => [newRow()]);
  const errors = state.fieldErrors ?? {};

  return (
    <form
      className="grid side"
      noValidate
      onSubmit={(e) => {
        // Submit without React's automatic form reset, so a validation error keeps what was typed.
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
    >
      <div className="stack">
        {state.error && (
          <p className="notice danger" role="alert">
            {state.error}
          </p>
        )}

        <section className="card">
          <h2>Where did it come from?</h2>
          <div className="choice" style={{ marginTop: 12 }}>
            {(Object.keys(JOB_SOURCES) as (keyof typeof JOB_SOURCES)[]).map((key) => (
              <label key={key}>
                <input type="radio" name="source" value={key} defaultChecked={key === "call"} />
                <b>{JOB_SOURCES[key]}</b>
                <br />
                <span className="muted">{SOURCE_HINT[key]}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="card">
          <h2>Client</h2>
          <div className="grid g2" style={{ marginTop: 12, gap: "0 20px" }}>
            <Field label="Organisation" name="client_name" error={errors.client_name} required />
            <Field label="Primary contact" name="contact_name" error={errors.contact_name} required />
            <Field label="Email" name="contact_email" type="email" error={errors.contact_email} required />
            <Field label="Phone" name="contact_phone" type="tel" error={errors.contact_phone} />
          </div>
          <p className="muted" style={{ fontSize: ".85rem" }}>
            An existing organisation or contact (matched on name and email) is reused rather than duplicated.
          </p>
        </section>

        <section className="card">
          <h2>Event</h2>
          <div className="grid g2" style={{ marginTop: 12, gap: "0 20px" }}>
            <Field label="Event name" name="event_name" error={errors.event_name} required />
            <Field label="Type of scribing" name="scribing_type" error={errors.scribing_type}>
              {(props) => (
                <select {...props}>
                  {SCRIBING_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Venue" name="venue" error={errors.venue} />
            <Field label="Size of group" name="group_size" error={errors.group_size} placeholder="c. 60 leaders" />
          </div>
          <Field label="Purpose" name="purpose" error={errors.purpose}>
            {(props) => <textarea {...props} rows={2} />}
          </Field>
          <Field label="What is being captured" name="capture" error={errors.capture} />

          <h3 style={{ margin: "14px 0 8px" }}>Sessions</h3>
          <div className="tbl">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Session</th>
                  <th>
                    <span className="sr-only">Remove</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((key, i) => (
                  <tr key={key}>
                    <td>
                      <RowInput name="session_date" type="date" label={`Session ${i + 1} date`} error={errors[`sessions.${i}.date`]} />
                    </td>
                    <td>
                      <RowInput name="session_start" type="time" label={`Session ${i + 1} start`} error={errors[`sessions.${i}.start`]} />
                    </td>
                    <td>
                      <RowInput name="session_end" type="time" label={`Session ${i + 1} end`} error={errors[`sessions.${i}.end`]} />
                    </td>
                    <td>
                      <RowInput name="session_session_type" label={`Session ${i + 1} description`} placeholder="Opening keynote" />
                    </td>
                    <td>
                      <RemoveButton label={`Remove session ${i + 1}`} onClick={() => setSessions((r) => r.filter((k) => k !== key))} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="actions" style={{ marginTop: 8 }}>
            <button type="button" className="btn small secondary" onClick={() => setSessions((r) => [...r, newRow()])}>
              + Add session
            </button>
            <span className="muted" style={{ fontSize: ".85rem" }}>
              Leave empty if the dates are still tbc.
            </span>
          </div>
        </section>

        <section className="card">
          <h2>Fee and outputs</h2>
          <p className="muted" style={{ margin: "4px 0 10px", fontSize: ".9rem" }}>
            Quoted per job; never published.{rateHint && ` ${rateHint}`}
          </p>
          <div className="tbl">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Unit</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>
                    <span className="sr-only">Remove</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {fees.map((key, i) => (
                  <tr key={key}>
                    <td>
                      <RowInput name="fee_description" label={`Fee line ${i + 1} item`} placeholder="Digital scribing, half day" error={errors[`fee_lines.${i}.description`]} />
                    </td>
                    <td>
                      <select name="fee_unit" className="input" aria-label={`Fee line ${i + 1} unit`} defaultValue="half_day">
                        {Object.entries(FEE_UNITS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ width: 80 }}>
                      <RowInput name="fee_qty" type="number" label={`Fee line ${i + 1} quantity`} defaultValue="1" min="0" step="0.5" error={errors[`fee_lines.${i}.qty`]} />
                    </td>
                    <td style={{ width: 120 }}>
                      <RowInput name="fee_unit_rate" type="number" label={`Fee line ${i + 1} rate`} placeholder="1000" min="0" step="0.01" error={errors[`fee_lines.${i}.unit_rate`]} />
                    </td>
                    <td>
                      <RemoveButton label={`Remove fee line ${i + 1}`} onClick={() => setFees((r) => r.filter((k) => k !== key))} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {errors.fee_lines && <p className="error">{errors.fee_lines}</p>}
          <div className="actions" style={{ marginTop: 8 }}>
            <button type="button" className="btn small secondary" onClick={() => setFees((r) => [...r, newRow()])}>
              + Add fee line
            </button>
          </div>

          <div className="grid g2" style={{ marginTop: 16, gap: "0 20px" }}>
            <Field label="Expenses" name="expenses_policy" error={errors.expenses_policy}>
              {(props) => (
                <select {...props}>
                  {EXPENSES_POLICIES.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Currency" name="currency" error={errors.currency}>
              {(props) => (
                <select {...props}>
                  {CURRENCIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              )}
            </Field>
          </div>
          <Field label="Output spec" name="output_spec" error={errors.output_spec} placeholder="One A1 digital visual per day, PNG + editable source" />
          <div className="grid g2" style={{ gap: "0 20px" }}>
            <Field label="Output delivery date" name="output_due" type="date" error={errors.output_due} />
            <Field label="Studio owner" name="owner_id" error={errors.owner_id}>
              {(props) => (
                <select {...props} defaultValue={defaultOwnerId}>
                  {owners.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </div>
        </section>

        <div className="actions" style={{ marginTop: 0 }}>
          <button type="submit" className="btn marker" disabled={pending}>
            {pending ? "Creating…" : "Create job as draft"}
          </button>
          <Link href="/admin" className="btn secondary">
            Cancel
          </Link>
        </div>
      </div>

      <aside className="stack">
        <div className="card">
          <p className="eyebrow">What saving does</p>
          <ol style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: ".92rem", display: "grid", gap: 6, listStyle: "decimal" }}>
            <li>Issues the next job ID</li>
            <li>Lands the job in Draft on the tracker</li>
            <li>Nothing is sent to the client until you click Send booking link</li>
          </ol>
        </div>
      </aside>
    </form>
  );
}

type ControlProps = {
  id: string;
  name: string;
  className: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

function Field({
  label,
  name,
  error,
  type = "text",
  required,
  placeholder,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  children?: (props: ControlProps) => ReactNode;
}) {
  const id = useId();
  const props: ControlProps = {
    id,
    name,
    className: "input",
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
  };
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {required && <span className="muted"> *</span>}
      </label>
      {children ? children(props) : <input {...props} type={type} required={required} placeholder={placeholder} />}
      {error && (
        <p className="error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

function RowInput({
  label,
  error,
  ...input
}: { label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <>
      <input {...input} className="input" aria-label={label} aria-invalid={error ? true : undefined} />
      {error && <p className="error">{error}</p>}
    </>
  );
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="btn small secondary" aria-label={label} title={label} onClick={onClick}>
      ×
    </button>
  );
}
