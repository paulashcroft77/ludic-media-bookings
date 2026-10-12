import { z } from "zod";

export const CURRENCIES = ["GBP", "EUR", "USD", "CHF"] as const;
export const SCRIBING_TYPES = [
  "Digital live scribing",
  "Analogue wall / knowledge wall",
  "Sketchnotes",
  "Remote (online event)",
] as const;
export const EXPENSES_POLICIES = [
  "Billed at cost on final invoice",
  "Capped at £500",
  "Included in fee",
] as const;
export const FEE_UNITS = { half_day: "Half day", day: "Day", item: "Item" } as const;
export const JOB_SOURCES = { call: "Scoping call", hubspot: "HubSpot deal", web: "Website enquiry" } as const;

const optionalText = (max = 2000) =>
  z.string().trim().max(max).optional().transform((v) => v || undefined);
const optionalTime = z
  .string()
  .regex(/^(\d{2}:\d{2})?$/, "Use HH:MM")
  .optional()
  .transform((v) => v || undefined);

export const SessionSchema = z
  .object({
    date: z.iso.date("Pick a date"),
    start: optionalTime,
    end: optionalTime,
    session_type: optionalText(200),
  })
  .refine((s) => !s.start || !s.end || s.end > s.start, {
    message: "End time must be after the start",
    path: ["end"],
  });

export const FeeLineSchema = z
  .object({
    description: z.string().trim().min(1, "Describe the line").max(200),
    unit: z.enum(Object.keys(FEE_UNITS) as [keyof typeof FEE_UNITS, ...(keyof typeof FEE_UNITS)[]]),
    qty: z.coerce.number("Enter a quantity").positive("Quantity must be above zero").max(999),
    // Entered in major units (pounds); stored as integer minor units.
    unit_rate: z.coerce.number("Enter a rate").min(0, "Rate can't be negative").max(1_000_000),
  })
  .transform(({ unit_rate, ...line }) => ({ ...line, unit_rate_minor: Math.round(unit_rate * 100) }));

export const NewJobSchema = z.object({
  source: z.enum(Object.keys(JOB_SOURCES) as [keyof typeof JOB_SOURCES, ...(keyof typeof JOB_SOURCES)[]]),
  client_name: z.string().trim().min(1, "Add the organisation").max(200),
  contact_name: z.string().trim().min(1, "Add the primary contact").max(200),
  contact_email: z.email("Enter a valid email").trim().toLowerCase(),
  contact_phone: optionalText(50),
  event_name: z.string().trim().min(1, "Add the event name").max(200),
  scribing_type: z.enum(SCRIBING_TYPES),
  venue: optionalText(300),
  group_size: optionalText(100),
  purpose: optionalText(),
  capture: optionalText(),
  sessions: z.array(SessionSchema).max(30),
  fee_lines: z.array(FeeLineSchema).min(1, "Add at least one fee line").max(30),
  currency: z.enum(CURRENCIES),
  expenses_policy: z.enum(EXPENSES_POLICIES),
  output_spec: optionalText(),
  output_due: z.union([z.iso.date(), z.literal("")]).optional().transform((v) => v || undefined),
  owner_id: z.uuid().optional().or(z.literal("").transform(() => undefined)),
});

export type NewJob = z.infer<typeof NewJobSchema>;
