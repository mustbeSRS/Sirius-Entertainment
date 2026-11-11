import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { currentAdmin, contacts, audit, adminCookie } from "@/lib/identity";
import { sql, local } from "@/lib/store";
import { assertOrigin, tokenHash } from "@/lib/security";
function cell(value: unknown) {
  let text = Array.isArray(value) ? value.join("; ") : String(value ?? "");
  if (/^[=+@\-\t\r]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
export async function POST(request: Request) {
  try {
    assertOrigin(request);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const admin = await currentAdmin();
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const raw = await request.text();
  if (raw.length > 2048)
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  let data: { action?: string };
  try {
    data = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (data.action === "logout") {
    const token = (await cookies()).get(adminCookie)?.value;
    if (token) {
      if (sql)
        await sql`delete from admin_sessions where token_hash=${tokenHash(token)}`;
      else
        await local((s) => {
          s.adminSessions = s.adminSessions?.filter(
            (x) => x.hash !== tokenHash(token),
          );
        });
    }
    const r = NextResponse.json({ ok: true });
    r.cookies.delete(adminCookie);
    return r;
  }
  if (data.action !== "export")
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  const rows = (await contacts(admin)).filter(
    (a) => a.marketing_consent && a.email_verified_at,
  );
  await audit(
    admin,
    `Exported ${rows.length} verified marketing-consented contact records`,
  );
  const fields = [
    "full_name",
    "email",
    "phone",
    "city",
    "country",
    "discipline",
    "consent_at",
    "privacy_version",
  ];
  const csv = [
    fields.map(cell).join(","),
    ...rows.map((a) =>
      fields.map((f) => cell((a as Record<string, unknown>)[f])).join(","),
    ),
  ].join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv;charset=utf-8",
      "Content-Disposition":
        'attachment; filename="sirius-consented-contacts.csv"',
      "Cache-Control": "no-store",
    },
  });
}
