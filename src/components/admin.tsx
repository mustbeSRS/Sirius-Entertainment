"use client";
import { useState } from "react";
import { Brand } from "./brand";
import { download } from "@/lib/client";
type Contact = {
  id: string;
  full_name: string;
  preferred_name?: string;
  email_verified_at?: string;
  email: string;
  phone: string;
  city?: string;
  country?: string;
  discipline?: string;
  marketing_consent: boolean;
  created_at: string;
  last_active_at?: string;
  return_count?: number;
};
export function AdminPanel({
  admin,
  artists,
}: {
  admin: string;
  artists: Contact[];
}) {
  const [query, setQuery] = useState(""),
    [discipline, setDiscipline] = useState("All"),
    [city, setCity] = useState("All"),
    [country, setCountry] = useState("All"),
    [consent, setConsent] = useState("All"),
    [error, setError] = useState("");
  const filtered = artists.filter(
    (a) =>
      `${a.full_name} ${a.email} ${a.phone}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (discipline === "All" || a.discipline === discipline) &&
      (city === "All" || a.city === city) &&
      (country === "All" || a.country === country) &&
      (consent === "All" || a.marketing_consent === (consent === "Subscribed")),
  );
  const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString();
  const months = [...new Set(artists.map((a) => a.created_at.slice(0, 7)))]
    .sort()
    .slice(-12);
  return (
    <main className="admin-page">
      <header className="welcome-header">
        <Brand href="/admin" />
        <span className="tag">PRIVATE · CONTACT ADMINISTRATION</span>
        <button
          className="secondary"
          onClick={async () => {
            const r = await fetch("/api/admin", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "logout" }),
            });
            if (r.ok) window.location.reload();
            else setError("Could not sign out");
          }}
        >
          Sign out
        </button>
      </header>
      <div className="dashboard-heading">
        <div className="eyebrow">SIRIUS COMMUNITY</div>
        <h1>Artist directory</h1>
        <p>
          Verified administrator: {admin}. Private writing is excluded from this
          interface.
        </p>
      </div>
      <div className="stats-grid">
        {[
          ["Registered artists", artists.length],
          [
            "New this week",
            artists.filter((a) => a.created_at >= lastWeek).length,
          ],
          [
            "Active this week",
            artists.filter((a) => (a.last_active_at || "") >= lastWeek).length,
          ],
          [
            "Returning artists",
            artists.filter((a) => (a.return_count || 0) > 0).length,
          ],
        ].map(([k, v]) => (
          <div className="stat-card" key={String(k)}>
            <strong>{v}</strong>
            <span>{k}</span>
          </div>
        ))}
      </div>
      <div className="controls">
        <input
          aria-label="Search artists"
          placeholder="Search name, email, phone…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {[
          {
            name: "Discipline",
            value: discipline,
            set: setDiscipline,
            options: artists.map((a) => a.discipline),
          },
          {
            name: "City",
            value: city,
            set: setCity,
            options: artists.map((a) => a.city),
          },
          {
            name: "Country",
            value: country,
            set: setCountry,
            options: artists.map((a) => a.country),
          },
        ].map((f) => (
          <select
            aria-label={f.name}
            key={f.name}
            value={f.value}
            onChange={(e) => f.set(e.target.value)}
          >
            <option value="All">All {f.name.toLowerCase()}</option>
            {[...new Set(f.options.filter(Boolean))].sort().map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        ))}
        <select
          aria-label="Marketing consent"
          value={consent}
          onChange={(e) => setConsent(e.target.value)}
        >
          {["All", "Subscribed", "Not subscribed"].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </div>
      <button
        className="secondary"
        onClick={async () => {
          try {
            const r = await fetch("/api/admin", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "export" }),
            });
            if (!r.ok) throw Error("Export failed");
            download("sirius-consented-contacts.csv", await r.blob());
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        Export verified, opted-in contacts (CSV)
      </button>
      <p>
        Export always includes only email-verified, currently opted-in artists,
        across the directory. Filter controls below affect viewing only. Views
        and exports are audited.
      </p>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {[
                "Artist",
                "Email",
                "Mobile",
                "Discipline",
                "City / country",
                "Email verified",
                "Consent",
                "Registered",
              ].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id}>
                <td>{a.preferred_name || a.full_name}</td>
                <td>{a.email}</td>
                <td>{a.phone}</td>
                <td>{a.discipline || "—"}</td>
                <td>{[a.city, a.country].filter(Boolean).join(", ") || "—"}</td>
                <td>{a.email_verified_at ? "Verified" : "Unverified"}</td>
                <td>{a.marketing_consent ? "Subscribed" : "Not subscribed"}</td>
                <td>{a.created_at.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 className="form-actions">Registration trends</h2>
      {months.map((m) => (
        <div className="trend-row" key={m}>
          <span>{m}</span>
          <progress
            max={Math.max(1, artists.length)}
            value={artists.filter((a) => a.created_at.startsWith(m)).length}
          />
          <strong>
            {artists.filter((a) => a.created_at.startsWith(m)).length}
          </strong>
        </div>
      ))}
      <a href="/studio">Return to artist studio</a>
    </main>
  );
}
