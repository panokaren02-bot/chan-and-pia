// Server-only helper for the Google Apps Script web app (google-apps-script/Code.gs).
// Never import this from a client component: it uses the shared secret.

export const appsScriptConfigured = () => Boolean(process.env.APPS_SCRIPT_URL);

type Res = { ok: boolean; error?: string; [k: string]: unknown };

export async function scriptGet(action: string, init?: RequestInit & { next?: { revalidate?: number; tags?: string[] } }): Promise<Res> {
  const url = process.env.APPS_SCRIPT_URL;
  if (!url) return { ok: false, error: "APPS_SCRIPT_URL is not set" };
  const res = await fetch(`${url}?action=${encodeURIComponent(action)}`, { redirect: "follow", ...init });
  return parse(res);
}

// Admin actions carry the shared secret; "rsvp" is the only public action.
export async function scriptPost(action: string, payload: Record<string, unknown> = {}): Promise<Res> {
  const url = process.env.APPS_SCRIPT_URL;
  if (!url) return { ok: false, error: "APPS_SCRIPT_URL is not set" };
  const res = await fetch(url, {
    method: "POST",
    redirect: "follow",
    cache: "no-store",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ ...payload, action, secret: process.env.APPS_SCRIPT_SECRET ?? "" }),
  });
  return parse(res);
}

async function parse(res: Response): Promise<Res> {
  const text = await res.text();
  try {
    return JSON.parse(text) as Res;
  } catch {
    // Apps Script returns an HTML page when the deployment is wrong (e.g. not "Anyone" access)
    return { ok: false, error: `Apps Script returned ${res.status} (not JSON). Check the deployment URL and access settings.` };
  }
}
