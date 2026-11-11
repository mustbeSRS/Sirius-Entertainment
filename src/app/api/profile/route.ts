import { NextResponse } from "next/server";
import { z } from "zod";
import { authorize, jsonBody, failure } from "@/lib/http";
import { updateProfile, deleteArtist } from "@/lib/identity";
import { cookieName } from "@/lib/session";
const schema = z.object({
  preferred_name: z.string().trim().max(100),
  city: z.string().trim().max(100),
  country: z.string().trim().max(100),
  discipline: z.string().max(100),
  creative_interests: z.array(z.string().max(100)).max(20),
});
export async function POST(request: Request) {
  try {
    const a = await authorize(request);
    await updateProfile(a.id, schema.parse(await jsonBody(request)));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(request: Request) {
  try {
    const a = await authorize(request);
    const body = await jsonBody(request);
    if (body.confirm !== "DELETE")
      return NextResponse.json(
        { error: "Type DELETE to confirm." },
        { status: 400 },
      );
    await deleteArtist(a.id);
    const response = NextResponse.json({ ok: true });
    response.cookies.delete(cookieName);
    return response;
  } catch (e) {
    return failure(e);
  }
}
