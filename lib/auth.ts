import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isTeamEmail } from "@/lib/team";

export type TeamUser = { id: string; email: string; name: string };

// The Data Access Layer check for every admin page and action. The proxy redirects too, but
// actions are reachable by direct POST, so each one re-verifies here.
export async function requireTeamUser(): Promise<TeamUser> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const email = claims?.email as string | undefined;

  if (!claims || !isTeamEmail(email)) {
    redirect(claims ? "/login?error=not_team" : "/login");
  }

  const meta = (claims.user_metadata ?? {}) as Record<string, unknown>;
  const name = (meta.full_name ?? meta.name ?? email) as string;
  return { id: claims.sub, email: email!.toLowerCase(), name };
}
