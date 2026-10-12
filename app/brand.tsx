import Link from "next/link";

export function Brand({ href = "/admin" }: { href?: string }) {
  return (
    <Link href={href} className="brand">
      <span className="face" aria-hidden="true">
        <i />
      </span>
      Ludic Media Studio
    </Link>
  );
}
