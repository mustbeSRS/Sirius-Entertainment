import "server-only";
import { cookies } from "next/headers";
import { mkdir, writeFile } from "node:fs/promises";
import nodemailer from "nodemailer";
import { local, sql, demoMode, type Artist } from "./store";
import { newToken, tokenHash } from "./security";
export const adminCookie = "sirius_admin";
export const mailReady = () =>
  !!process.env.SMTP_HOST &&
  !!process.env.MAIL_FROM &&
  !!process.env.APP_ORIGIN;
export async function requestRecovery(
  email: string,
  purpose: "artist" | "admin",
) {
  const normalized = email.trim().toLowerCase();
  const token = newToken();
  const expires = new Date(Date.now() + 15 * 60000).toISOString();
  let eligible = false;
  if (sql) {
    if (purpose === "admin")
      eligible =
        (await sql`select email from admin_users where email=${normalized}`)
          .length > 0;
    else
      eligible =
        (
          await sql`select id from artist_profiles where email=${normalized} and account_status='active'`
        ).length > 0;
    if (eligible)
      await sql`insert into recovery_tokens(token_hash,email,purpose,expires_at) values (${tokenHash(token)},${normalized},${purpose},${expires})`;
  } else
    await local((s) => {
      eligible =
        purpose === "admin"
          ? (process.env.ADMIN_EMAILS || "")
              .split(",")
              .map((s) => s.trim().toLowerCase())
              .includes(normalized)
          : s.artists.some((a) => a.email === normalized);
      if (eligible) {
        s.recovery ??= [];
        s.recovery.push({
          hash: tokenHash(token),
          email: normalized,
          purpose,
          expires_at: expires,
          used: false,
        });
      }
    });
  if (!eligible) return;
  const url = new URL(
    "/recover",
    process.env.APP_ORIGIN || "http://localhost:3000",
  );
  url.searchParams.set("token", token);
  url.searchParams.set("purpose", purpose);
  if (demoMode) {
    await mkdir(process.env.LOCAL_DATA_DIR || ".data", { recursive: true });
    await writeFile(
      `${process.env.LOCAL_DATA_DIR || ".data"}/mailbox.json`,
      JSON.stringify({ to: normalized, url: url.toString(), expires }),
      { mode: 0o600 },
    );
    return;
  }
  if (!mailReady()) throw Error("Email delivery is not configured");
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_PORT === "465",
    requireTLS: process.env.SMTP_PORT !== "465",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: normalized,
    subject:
      purpose === "admin"
        ? "SIRIUS administration access"
        : "Recover your SIRIUS workspace",
    text: `Open this one-time link to verify your email and ${purpose === "admin" ? "open administration" : "recover access"}. It expires in 15 minutes.\n\n${url}\n\nIf you did not request this link, ignore this message.`,
  });
}
export async function consumeRecovery(
  token: string,
  purpose: "artist" | "admin",
) {
  const hash = tokenHash(token),
    session = newToken(),
    sessionHash = tokenHash(session),
    expires = new Date(
      Date.now() + (purpose === "admin" ? 8 * 3600000 : 30 * 86400000),
    ).toISOString();
  if (sql)
    await sql.begin(async (tx) => {
      const rows =
        await tx`update recovery_tokens set used_at=now() where token_hash=${hash} and purpose=${purpose} and expires_at>now() and used_at is null returning email`;
      const email = rows[0]?.email;
      if (!email)
        throw Error("This link is invalid, expired, or already used.");
      if (purpose === "admin") {
        if (
          !(await tx`select email from admin_users where email=${email}`).length
        )
          throw Error("Not authorized");
        await tx`insert into admin_sessions(token_hash,email,expires_at) values(${sessionHash},${email},${expires})`;
        await tx`insert into admin_audit(email,action) values(${email},'Verified admin session')`;
      } else {
        const artist = (
          await tx`select id from artist_profiles where email=${email} and account_status='active'`
        )[0];
        if (!artist) throw Error("Not found");
        await tx`update artist_sessions set revoked_at=now() where artist_id=${artist.id}`;
        await tx`update artist_profiles set email_verified_at=now() where id=${artist.id}`;
        await tx`insert into artist_sessions(token_hash,artist_id,expires_at) values(${sessionHash},${artist.id},${expires})`;
      }
    });
  else
    await local((s) => {
      const item = s.recovery?.find(
        (r) =>
          r.hash === hash &&
          r.purpose === purpose &&
          !r.used &&
          Date.parse(r.expires_at) > Date.now(),
      );
      if (!item) throw Error("This link is invalid, expired, or already used.");
      if (purpose === "admin") {
        if (!(process.env.ADMIN_EMAILS || "").split(",").includes(item.email))
          throw Error("Not authorized");
        s.adminSessions ??= [];
        s.adminSessions.push({
          hash: sessionHash,
          email: item.email,
          expires_at: expires,
        });
        s.audit ??= [];
        s.audit.push({
          email: item.email,
          action: "Verified admin session",
          at: new Date().toISOString(),
        });
      } else {
        const a = s.artists.find((a) => a.email === item.email);
        if (!a) throw Error("Not found");
        a.email_verified_at = new Date().toISOString();
        s.sessions = s.sessions.filter((x) => x.artist_id !== a.id);
        s.sessions.push({
          token_hash: sessionHash,
          artist_id: a.id,
          expires_at: expires,
        });
      }
      item.used = true;
    });
  return {
    token: session,
    maxAge: purpose === "admin" ? 8 * 3600 : 30 * 86400,
  };
}
export async function currentAdmin() {
  const token = (await cookies()).get(adminCookie)?.value;
  if (!token) return null;
  const hash = tokenHash(token);
  if (sql) {
    const rows =
      await sql`select s.email from admin_sessions s join admin_users a on a.email=s.email where s.token_hash=${hash} and s.expires_at>now()`;
    return (rows[0]?.email as string) || null;
  }
  return local((s) => {
    const session = s.adminSessions?.find(
      (s) => s.hash === hash && Date.parse(s.expires_at) > Date.now(),
    );
    if (!session) return null;
    return (process.env.ADMIN_EMAILS || "").split(",").includes(session.email)
      ? session.email
      : null;
  });
}
export async function contacts(admin: string) {
  if (sql) {
    await sql`insert into admin_audit(email,action) values(${admin},'Viewed contact directory')`;
    return await sql`select id,full_name,preferred_name,email,email_verified_at,phone,calling_code,city,country,discipline,creative_interests,created_at,last_active_at,return_count,marketing_consent,consent_at,privacy_version,account_status from artist_profiles order by created_at desc`;
  }
  return local((s) => {
    s.audit ??= [];
    s.audit.push({
      email: admin,
      action: "Viewed contact directory",
      at: new Date().toISOString(),
    });
    return s.artists.map((a) => ({ ...a }));
  });
}
export async function audit(admin: string, action: string) {
  if (sql)
    await sql`insert into admin_audit(email,action) values(${admin},${action})`;
  else
    await local((s) => {
      s.audit ??= [];
      s.audit.push({ email: admin, action, at: new Date().toISOString() });
    });
}
export async function deleteArtist(id: string) {
  if (sql)
    await sql.begin(async (tx) => {
      const a = (await tx`select email from artist_profiles where id=${id}`)[0];
      if (a)
        await tx`delete from recovery_tokens where email=${a.email} and purpose='artist'`;
      await tx`delete from artist_profiles where id=${id}`;
    });
  else
    await local((s) => {
      const removed = s.artists.find((a) => a.id === id);
      s.recovery = s.recovery?.filter(
        (x) => x.email !== removed?.email || x.purpose !== "artist",
      );
      s.artists = s.artists.filter((a) => a.id !== id);
      s.sessions = s.sessions.filter((x) => x.artist_id !== id);
      s.events = s.events.filter((x) => x.artist_id !== id);
      for (const k of Object.keys(s.records || {}) as (keyof NonNullable<
        typeof s.records
      >)[])
        if (s.records)
          s.records[k] = s.records[k].filter(
            (x) => x.artist_id !== id,
          ) as never;
      if (s.preferences) delete s.preferences[id];
    });
}
export async function updateProfile(
  id: string,
  fields: {
    preferred_name: string;
    city: string;
    country: string;
    discipline: string;
    creative_interests: string[];
  },
) {
  if (sql) await sql`update artist_profiles set ${sql(fields)} where id=${id}`;
  else
    await local((s) => {
      const a = s.artists.find((a) => a.id === id);
      if (a) Object.assign(a, fields);
    });
}
