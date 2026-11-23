"use client";
import { useState } from "react";

export default function Login({ configured }: { configured: boolean }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr("");
    const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok) window.location.reload();
    else { setErr(data.error || "Could not log in."); setBusy(false); }
  };

  return (
    <div className="db-login">
      <form className="db-login-card" onSubmit={submit}>
        <span className="db-mono db-mono-lg" style={{ WebkitMaskImage: 'url("/monogram/monogram-web.png")', maskImage: 'url("/monogram/monogram-web.png")' }} />
        <h1>Invitation Dashboard</h1>
        <p>Edit the wedding website and upload photos.</p>
        {configured ? (
          <>
            <input type="password" autoFocus autoComplete="current-password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} />
            {err && <small className="db-err">{err}</small>}
            <button className="db-btn db-btn-primary" disabled={busy || !pw}>{busy ? "Checking…" : "Log in"}</button>
          </>
        ) : (
          <p className="db-err">Set <code>DASHBOARD_PASSWORD</code> in the server&apos;s environment variables, then restart.</p>
        )}
      </form>
    </div>
  );
}
