import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "dash_session";

// The cookie holds an HMAC derived from DASHBOARD_PASSWORD, so changing the password logs everyone out.
function token() {
  const pw = process.env.DASHBOARD_PASSWORD;
  if (!pw) return null;
  return createHmac("sha256", pw).update("wedding-dashboard-v1").digest("hex");
}

const same = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export const passwordConfigured = () => Boolean(process.env.DASHBOARD_PASSWORD);
export const checkPassword = (pw: string) => passwordConfigured() && same(pw, process.env.DASHBOARD_PASSWORD!);
export const sessionToken = () => token();

export async function isAuthed() {
  const t = token();
  if (!t) return false;
  const c = (await cookies()).get(SESSION_COOKIE)?.value;
  return Boolean(c && same(c, t));
}
