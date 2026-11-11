import { redirect } from "next/navigation";
import { currentArtist } from "@/lib/session";
import { demoMode } from "@/lib/store";
import { Workspace } from "@/components/workspace";
export default async function Studio({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const artist = await currentArtist();
  if (!artist) redirect("/");
  const params = await searchParams;
  const views = [
    "Dashboard",
    "My Projects",
    "Writing Studio",
    "Creative Toolkit",
    "Idea Vault",
    "Library",
    "Settings",
  ];
  return (
    <Workspace
      artist={artist}
      demo={demoMode}
      initialView={
        views.includes(params.view || "") ? params.view : "Dashboard"
      }
    />
  );
}
