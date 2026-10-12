import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

// Client Components. Only ever holds the team member's own session; never used for client or scribe links.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
