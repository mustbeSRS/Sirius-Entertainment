import { NextResponse } from "next/server";
import { currentArtist } from "./session";
import { assertOrigin } from "./security";
import { ConflictError, MissingError } from "./workspace-store";
export async function authorize(request: Request, mutation = true) {
  if (mutation) assertOrigin(request);
  const artist = await currentArtist();
  if (!artist) throw new Error("Unauthorized");
  return artist;
}
export async function jsonBody(request: Request) {
  const text = await request.text();
  if (text.length > 500000) throw new Error("Request too large");
  return JSON.parse(text);
}
export function failure(error: unknown) {
  const message = error instanceof Error ? error.message : "Request failed";
  if (message === "Unauthorized")
    return NextResponse.json(
      { error: "Your session expired. Local recovery drafts are preserved." },
      { status: 401 },
    );
  if (error instanceof ConflictError)
    return NextResponse.json({ error: message }, { status: 409 });
  if (error instanceof MissingError)
    return NextResponse.json({ error: "Record not found" }, { status: 404 });
  if (message.includes("origin"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (message === "Request too large")
    return NextResponse.json({ error: message }, { status: 413 });
  console.error(
    "Studio request failed:",
    error instanceof Error ? error.name : "unknown",
  );
  return NextResponse.json(
    {
      error: "Unable to complete this request. Check your input and try again.",
    },
    { status: 400 },
  );
}
