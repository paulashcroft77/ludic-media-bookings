import { Suspense } from "react";
import { signOut } from "@/app/actions/auth";
import { Brand } from "@/app/brand";
import { requireTeamUser } from "@/lib/auth";
import { AdminNav } from "./nav";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="wrap">
      <header className="top">
        <Brand />
        <AdminNav />
        <Suspense fallback={null}>
          <UserMenu />
        </Suspense>
      </header>
      {children}
    </div>
  );
}

async function UserMenu() {
  const user = await requireTeamUser();
  return (
    <form action={signOut} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: ".85rem" }}>
      <span className="muted" title={user.email}>
        {user.name}
      </span>
      <button type="submit" className="btn small secondary">
        Sign out
      </button>
    </form>
  );
}
