import type { Metadata } from "next";
import { Suspense } from "react";
import { Brand } from "@/app/brand";
import { SignInButton } from "./sign-in-button";

export const metadata: Metadata = { title: "Sign in" };

const ERRORS: Record<string, string> = {
  not_team: "That account isn't on the ludicgroup.com tenant. Sign in with your Ludic Microsoft 365 account.",
  auth_failed: "Microsoft sign-in didn't complete. Please try again.",
};

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <div className="wrap">
      <header className="top">
        <Brand />
      </header>
      <main className="hero" style={{ maxWidth: 480, paddingTop: 48 }}>
        <p className="eyebrow">Job tracker</p>
        <h1>Sign in to bookings</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          For the Ludic Media Studio team. Use your ludicgroup.com Microsoft 365 account.
        </p>
        <div className="card" style={{ marginTop: 20 }}>
          <Suspense fallback={<SignInButton next="/admin" />}>
            <SignInPanel searchParams={searchParams} />
          </Suspense>
        </div>
        <p className="muted" style={{ fontSize: ".85rem", marginTop: 12 }}>
          Clients and scribes don&apos;t sign in here; they use the link in their email.
        </p>
      </main>
    </div>
  );
}

async function SignInPanel({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? ERRORS[params.error] : undefined;
  const next = typeof params.next === "string" ? params.next : "/admin";
  return (
    <>
      {error && (
        <p className="notice danger" role="alert" style={{ marginBottom: 16 }}>
          {error}
        </p>
      )}
      <SignInButton next={next} />
    </>
  );
}
