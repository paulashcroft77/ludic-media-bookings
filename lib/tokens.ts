import "server-only";
import { createHmac, randomBytes } from "node:crypto";

// Client and scribe links carry a random token; the database only ever stores its HMAC.
export function newLinkToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashLinkToken(token) };
}

export function hashLinkToken(token: string): string {
  const secret = process.env.TOKEN_SIGNING_SECRET;
  if (!secret) throw new Error("TOKEN_SIGNING_SECRET is not set");
  return createHmac("sha256", secret).update(token).digest("hex");
}

export function bookingUrl(token: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  return `${base}/book/${token}`;
}
