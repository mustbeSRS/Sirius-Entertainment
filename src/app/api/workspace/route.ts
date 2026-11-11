import { NextResponse } from "next/server";
import { z } from "zod";
import { authorize, jsonBody, failure } from "@/lib/http";
import {
  workspace,
  saveRecord,
  removeRecord,
  snapshot,
  restore,
  preferences,
} from "@/lib/workspace-store";
const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("save"),
    resource: z.enum([
      "projects",
      "writing_pieces",
      "ideas",
      "tasks",
      "saved_words",
      "chord_progressions",
    ]),
    data: z.unknown(),
  }),
  z.object({
    action: z.literal("delete"),
    resource: z.enum([
      "projects",
      "writing_pieces",
      "ideas",
      "tasks",
      "saved_words",
      "chord_progressions",
    ]),
    id: z.uuid(),
  }),
  z.object({
    action: z.literal("snapshot"),
    pieceId: z.uuid(),
    name: z.string().trim().min(1).max(100),
  }),
  z.object({ action: z.literal("restore"), versionId: z.uuid() }),
  z.object({
    action: z.literal("preferences"),
    theme: z.enum(["dark", "light"]),
    collapsed: z.boolean(),
  }),
]);
export async function GET(request: Request) {
  try {
    const artist = await authorize(request, false);
    return NextResponse.json(await workspace(artist.id), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    const artist = await authorize(request);
    const input = actionSchema.parse(await jsonBody(request));
    let result: unknown;
    switch (input.action) {
      case "save":
        result = await saveRecord(artist.id, input.resource, input.data);
        break;
      case "delete":
        await removeRecord(artist.id, input.resource, input.id);
        break;
      case "snapshot":
        result = await snapshot(artist.id, input.pieceId, input.name);
        break;
      case "restore":
        result = await restore(artist.id, input.versionId);
        break;
      case "preferences":
        await preferences(artist.id, input);
        break;
    }
    return NextResponse.json({ result });
  } catch (e) {
    return failure(e);
  }
}
