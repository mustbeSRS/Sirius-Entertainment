"use client";
import { useState } from "react";
import type { Artist } from "@/lib/store";
import { Field } from "./ui";
export function SettingsPanel({
  artist,
  onUpdated,
}: {
  artist: Artist;
  onUpdated: () => void;
}) {
  const [marketing, setMarketing] = useState(artist.marketing_consent),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function consent() {
    setBusy(true);
    try {
      const r = await fetch("/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketing: !marketing }),
      });
      if (!r.ok) throw Error("Could not update consent");
      setMarketing(!marketing);
      setMessage("Your communication preference has been saved.");
    } catch (e) {
      setMessage((e as Error).message);
    }
    setBusy(false);
  }
  return (
    <>
      <div className="dashboard-heading">
        <div className="eyebrow">YOUR SPACE, YOUR CHOICES</div>
        <h1>Studio settings</h1>
        <p>Personalize your studio and control your information.</p>
      </div>
      <div className="settings-grid">
        <section className="settings-card">
          <h2>Artist profile</h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              setBusy(true);
              try {
                const r = await fetch("/api/profile", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    preferred_name: f.get("preferred_name"),
                    city: f.get("city"),
                    country: f.get("country"),
                    discipline: f.get("discipline"),
                    creative_interests: String(
                      f.get("creative_interests") || "",
                    )
                      .split(",")
                      .map((x) => x.trim())
                      .filter(Boolean),
                  }),
                });
                if (!r.ok) throw Error("Could not save profile");
                setMessage("Profile saved.");
                onUpdated();
              } catch (e) {
                setMessage((e as Error).message);
              }
              setBusy(false);
            }}
          >
            <Field label="Preferred name">
              <input
                name="preferred_name"
                defaultValue={artist.preferred_name || ""}
                maxLength={100}
              />
            </Field>
            <div className="form-grid">
              <Field label="City">
                <input name="city" defaultValue={artist.city || ""} />
              </Field>
              <Field label="Country">
                <input name="country" defaultValue={artist.country || ""} />
              </Field>
            </div>
            <Field label="Creative discipline">
              <select name="discipline" defaultValue={artist.discipline || ""}>
                <option value="">Choose a discipline (optional)</option>
                {[
                  "Songwriter",
                  "Singer",
                  "Rapper",
                  "Poet",
                  "Music producer",
                  "Spoken-word artist",
                  "Other",
                ].map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </Field>
            <Field label="Creative interests (comma separated)">
              <input
                name="creative_interests"
                defaultValue={(artist.creative_interests || []).join(", ")}
              />
            </Field>
            <button className="primary compact" disabled={busy}>
              Save profile
            </button>
          </form>
          <p>
            Registered as {artist.full_name}. Email: {artist.email}. Contact
            changes require verified support; entering a contact never proves
            identity.
          </p>
        </section>
        <section className="settings-card">
          <h2>Community updates</h2>
          <p>
            Optional artist opportunities, collaborations, events, and offers
            from SIRIUS Entertainment. Tool access never depends on this choice.
          </p>
          <button
            className="secondary"
            disabled={busy}
            onClick={() => void consent()}
          >
            {marketing
              ? "Withdraw marketing consent"
              : "Opt in to community updates"}
          </button>
          <p>
            Current preference:{" "}
            <strong>{marketing ? "Opted in" : "Not subscribed"}</strong>
          </p>
          <hr />
          <h2>Your data</h2>
          <p>
            Export all projects, writing, ideas, snapshots, saved words, tasks,
            progressions, and profile information.
          </p>
          <a className="secondary" href="/api/export">
            Export my workspace
          </a>
          <div className="legal-links form-actions">
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Use</a>
          </div>
          <hr />
          <h2>Browser access</h2>
          <p>
            Sessions last 30 days. Use a verified email link to recover access
            on another device. Recovery revokes previous artist sessions.
          </p>
          <a className="secondary" href="/recover">
            Verify email / recover access
          </a>
          <button
            className="secondary form-actions"
            onClick={async () => {
              if (
                !confirm(
                  "End this browser session? You will need verified email recovery to return.",
                )
              )
                return;
              const r = await fetch("/api/session", { method: "DELETE" });
              if (r.ok) window.location.assign("/");
              else setMessage("Could not end the session. Try again.");
            }}
          >
            End this browser session
          </button>
          <hr />
          <h2>Delete account</h2>
          <p>
            Permanently removes your contacts and creative workspace. Export
            your work first. This cannot be undone.
          </p>
          <button
            className="secondary danger"
            onClick={async () => {
              const confirm = prompt(
                "Type DELETE to permanently remove your account and writing.",
              );
              if (confirm !== "DELETE") return;
              const r = await fetch("/api/profile", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ confirm }),
              });
              if (r.ok) {
                for (const key of Object.keys(localStorage))
                  if (key.startsWith(`sirius-recovery:${artist.id}:`))
                    localStorage.removeItem(key);
                window.location.assign("/");
              } else
                setMessage("Deletion failed. Your data has not been removed.");
            }}
          >
            Permanently delete my account
          </button>
        </section>
      </div>
      <p role="status">{message}</p>
    </>
  );
}
