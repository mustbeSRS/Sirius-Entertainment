import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { assertOrigin, tokenHash } from "@/lib/security";
import { revoke } from "@/lib/store";
import { cookieName } from "@/lib/session";
export async function DELETE(request: Request) {
  try {
    assertOrigin(request);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const token = (await cookies()).get(cookieName)?.value;
  if (token) await revoke(tokenHash(token));
  const r = NextResponse.json({ ok: true });
  r.cookies.delete(cookieName);
  return r;
}
