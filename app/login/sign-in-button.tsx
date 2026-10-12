"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function SignInButton({ next }: { next: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setPending(true);
    setError(null);
    const redirectTo = new URL("/auth/callback", window.location.origin);
    redirectTo.searchParams.set("next", next);
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "azure",
      options: { scopes: "email", redirectTo: redirectTo.toString() },
    });
    // On success the browser is already on its way to Microsoft.
    if (error) {
      setError(error.message);
      setPending(false);
    }
  }

  return (
    <>
      <button type="button" className="btn" onClick={signIn} disabled={pending} style={{ width: "100%", justifyContent: "center" }}>
        <svg width="16" height="16" viewBox="0 0 21 21" aria-hidden="true">
          <rect x="1" y="1" width="9" height="9" fill="#f25022" />
          <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
          <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
          <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
        </svg>
        {pending ? "Redirecting to Microsoft…" : "Sign in with Microsoft"}
      </button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
