import { currentArtist } from "@/lib/session";
import { workspace } from "@/lib/workspace-store";
export async function GET() {
  const artist = await currentArtist();
  if (!artist) return new Response("Unauthorized", { status: 401 });
  return new Response(
    JSON.stringify(
      { profile: artist, ...(await workspace(artist.id)) },
      null,
      2,
    ),
    {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="sirius-workspace.json"',
        "Cache-Control": "no-store",
      },
    },
  );
}
