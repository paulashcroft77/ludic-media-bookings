import { createHmac } from "node:crypto";
import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { TEAM_STATE } from "./global-setup";

const admin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });

test("the job tracker is only for signed-in team members", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin/);
  await expect(page.getByRole("button", { name: "Sign in with Microsoft" })).toBeVisible();
});

test.describe("signed in as a team member", () => {
  test.use({ storageState: TEAM_STATE });

  test("create a job, then send the booking link", async ({ page }) => {
    const event = `Leadership Offsite ${Date.now()}`;

    await page.goto("/admin");
    await page.getByRole("link", { name: "+ New job" }).click();
    await expect(page.getByRole("heading", { name: "New scribing job" })).toBeVisible();

    await page.getByLabel("Organisation").fill("Barilla");
    await page.getByLabel("Primary contact").fill("Luca Ferrari");
    await page.getByLabel("Email").fill("luca.ferrari@barilla.example");
    await page.getByLabel("Event name").fill(event);
    await page.getByLabel("Type of scribing").selectOption("Sketchnotes");
    await page.getByLabel("Venue").fill("Parma, Italy");
    await page.getByLabel("Purpose").fill("Capture the strategy conversations across two days.");

    await page.getByLabel("Session 1 date").fill("2027-02-04");
    await page.getByLabel("Session 1 start").fill("09:00");
    await page.getByLabel("Session 1 end").fill("17:00");
    await page.getByLabel("Session 1 description").fill("Day 1 plenary");
    await page.getByRole("button", { name: "+ Add session" }).click();
    await page.getByLabel("Session 2 date").fill("2027-02-05");
    await page.getByLabel("Session 2 description").fill("Day 2 closing");

    await page.getByLabel("Fee line 1 item").fill("Digital scribing, full day");
    await page.getByLabel("Fee line 1 unit").selectOption("day");
    await page.getByLabel("Fee line 1 rate").fill("1800");
    await page.getByRole("button", { name: "+ Add fee line" }).click();
    await page.getByLabel("Fee line 2 item").fill("Digital scribing, half day");
    await page.getByLabel("Fee line 2 rate").fill("1000");
    await page.getByLabel("Currency").selectOption("EUR");

    await page.getByRole("button", { name: "Create job as draft" }).click();

    // Job ref is issued by the database trigger.
    await expect(page).toHaveURL(/\/admin\/jobs\/[0-9a-f-]{36}\?created=1$/);
    const ref = (await page.getByTestId("job-ref").textContent())!;
    expect(ref).toMatch(new RegExp(`^LMS-${new Date().getFullYear()}-\\d{4}$`));
    await expect(page.getByText(`Job ${ref} created as draft.`)).toBeVisible();
    await expect(page.getByTestId("job-status")).toHaveText("Draft");
    await expect(page.getByTestId("fee-total")).toHaveText("€2,800");
    await expect(page.getByTestId("activity")).toContainText("Job created");

    await page.getByRole("button", { name: "Send booking link" }).click();

    const link = page.getByTestId("booking-link");
    await expect(link).toHaveValue(/^http:\/\/localhost:3100\/book\/[A-Za-z0-9_-]{43}$/);
    await expect(page.getByTestId("job-status")).toHaveText("Awaiting client");
    await expect(page.getByTestId("activity")).toContainText(
      "Booking link sent to Luca Ferrari (luca.ferrari@barilla.example)",
    );
    await expect(page.getByRole("button", { name: "Send booking link" })).toHaveCount(0);

    // Only the HMAC of the token is stored, and the transition is in the audit log.
    const token = (await link.inputValue()).split("/book/")[1];
    const hash = createHmac("sha256", process.env.TOKEN_SIGNING_SECRET!).update(token).digest("hex");
    const db = admin();
    const { data: job } = await db.from("jobs").select("id, status").eq("job_ref", ref).single();
    expect(job?.status).toBe("awaiting_client");
    const { data: tokens } = await db.from("tokens").select("token_hash, party, revoked_at, expires_at").eq("job_id", job!.id);
    expect(tokens).toHaveLength(1);
    expect(tokens![0]).toMatchObject({ token_hash: hash, party: "client", revoked_at: null });
    const { data: events } = await db
      .from("job_events")
      .select("from_status, to_status, actor_type")
      .eq("job_id", job!.id)
      .order("id");
    expect(events).toEqual([
      { from_status: null, to_status: "draft", actor_type: "team" },
      { from_status: "draft", to_status: "awaiting_client", actor_type: "team" },
    ]);

    // The job shows on the list under its new status.
    await page.getByRole("link", { name: "Jobs", exact: true }).click();
    const row = page.getByRole("row", { name: new RegExp(ref) });
    await expect(row).toContainText(event);
    await expect(row).toContainText("Awaiting client");
  });
});
