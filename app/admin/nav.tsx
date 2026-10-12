"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

// The pathname is only known at request time, so the static shell renders the links unhighlighted.
export function AdminNav() {
  return (
    <Suspense fallback={<NavLinks isNew={null} />}>
      <CurrentNav />
    </Suspense>
  );
}

function CurrentNav() {
  return <NavLinks isNew={usePathname() === "/admin/jobs/new"} />;
}

function NavLinks({ isNew }: { isNew: boolean | null }) {
  return (
    <nav className="nav" aria-label="Job tracker">
      <Link href="/admin" aria-current={isNew === false ? "page" : undefined}>
        Jobs
      </Link>
      <Link href="/admin/jobs/new" aria-current={isNew ? "page" : undefined}>
        New job
      </Link>
    </nav>
  );
}
