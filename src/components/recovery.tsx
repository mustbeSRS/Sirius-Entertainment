"use client";
import { useState } from "react";
import { Brand } from "./brand";
export function Recovery({
  admin = false,
  token = null,
}: {
  admin?: boolean;
  token?: string | null;
}) {
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const data = new FormData(e.currentTarget);
    const search = new URLSearchParams(window.location.search);
    try {
      const r = await fetch("/api/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: search.get("token") ? "consume" : "request",
          email: data.get("email") || undefined,
          token: search.get("token") || undefined,
          purpose:
            admin || search.get("purpose") === "admin" ? "admin" : "artist",
        }),
      });
      const result = await r.json();
      if (!r.ok) throw Error(result.error);
      if (search.get("token"))
        window.location.assign(
          admin || search.get("purpose") === "admin" ? "/admin" : "/studio",
        );
      else setMessage(result.message);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Try again.");
    }
    setBusy(false);
  }
  return (
    <main className="recovery-page">
      <Brand />
      <form onSubmit={submit} className="settings-card">
        <div className="eyebrow">
          {admin
            ? "RESTRICTED SIRIUS ADMINISTRATION"
            : "YOUR WORKSPACE, SAFELY RETURNED"}
        </div>
        <h1>{token ? "Verify access" : "Recover access"}</h1>
        <p>
          {token
            ? "Use this one-time link to verify your email. Previous artist sessions are revoked when you recover access."
            : "We’ll send a one-time email link. You never need a password."}
        </p>
        {!token && (
          <label>
            Email address
            <input type="email" name="email" required autoComplete="email" />
          </label>
        )}
        <button className="primary" disabled={busy}>
          {busy
            ? "Please wait…"
            : token
              ? "Verify and continue"
              : "Send secure link"}
        </button>
        <p role="status">{message}</p>
        <a href="/">Back to welcome</a>
      </form>
    </main>
  );
}
