import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { randomBytes } from "node:crypto";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { FullConfig } from "@playwright/test";

export const TEAM_STATE = "e2e/.auth/team.json";
export const TEAM_EMAIL = "e2e.tester@ludicgroup.com";

// Microsoft sign-in can't run headless, so the test signs a team member in with a password against
// a local Supabase (`npx supabase start`). The resulting cookies are exactly what @supabase/ssr
// writes after the Microsoft callback.
export default async function globalSetup(config: FullConfig) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceKey) {
    throw new Error("Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY (see README).");
  }
  const host = new URL(url).hostname;
  if (!["127.0.0.1", "localhost"].includes(host) && process.env.E2E_ALLOW_REMOTE_SUPABASE !== "1") {
    throw new Error(`Refusing to create test users on ${host}. Point the tests at a local Supabase.`);
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const password = randomBytes(24).toString("base64url");
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existing = list?.users.find((u) => u.email === TEAM_EMAIL);
  const { error } = existing
    ? await admin.auth.admin.updateUserById(existing.id, { password })
    : await admin.auth.admin.createUser({
        email: TEAM_EMAIL,
        password,
        email_confirm: true,
        user_metadata: { full_name: "E2E Tester" },
      });
  if (error) throw error;

  const jar = new Map<string, string>();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (cookies) => cookies.forEach(({ name, value }) => (value ? jar.set(name, value) : jar.delete(name))),
    },
  });
  const { error: signInError } = await supabase.auth.signInWithPassword({ email: TEAM_EMAIL, password });
  if (signInError) throw signInError;

  const { hostname } = new URL(config.projects[0].use.baseURL!);
  const state = {
    cookies: [...jar].map(([name, value]) => ({
      name,
      value,
      domain: hostname,
      path: "/",
      expires: -1,
      httpOnly: false,
      secure: false,
      sameSite: "Lax" as const,
    })),
    origins: [],
  };
  mkdirSync(dirname(TEAM_STATE), { recursive: true });
  writeFileSync(TEAM_STATE, JSON.stringify(state));
}
