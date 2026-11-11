import { NextResponse } from "next/server";
import { currentArtist } from "@/lib/session";
import { consent } from "@/lib/store";
import { assertOrigin } from "@/lib/security";
export async function POST(request: Request) {
  try {
    assertOrigin(request);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const artist = await currentArtist();
  if (!artist)
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  const data = await request.json();
  if (typeof data.marketing !== "boolean")
    return NextResponse.json({ error: "Invalid consent" }, { status: 400 });
  await consent(artist.id, data.marketing);
  return NextResponse.json({ ok: true });
}
