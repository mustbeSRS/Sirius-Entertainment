import { redirect } from "next/navigation";
import { currentArtist } from "@/lib/session";
import { demoMode } from "@/lib/store";
import { Workspace } from "@/components/workspace";
export default async function Page() {
  const artist = await currentArtist();
  if (!artist) redirect("/");
  return <Workspace artist={artist} demo={demoMode} initialView="Chord Lab" />;
}
