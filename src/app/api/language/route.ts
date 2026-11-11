import { NextResponse } from "next/server";
import { authorize, failure } from "@/lib/http";
import { pronunciation, rhymes, syllables } from "@/lib/language";
import { lookup } from "@/lib/dictionary";
export async function GET(request: Request) {
  try {
    await authorize(request, false);
    const params = new URL(request.url).searchParams;
    const word = params.get("word")?.trim().toLowerCase() || "";
    if (!/^[a-z][a-z' -]{0,69}$/.test(word))
      return NextResponse.json(
        { error: "Enter an English word or short phrase." },
        { status: 400 },
      );
    const tool = params.get("tool") || "rhymes";
    const type = params.get("type") || "perfect";
    const count = Number(params.get("syllables") || 0);
    if (tool === "definitions" || tool === "synonyms")
      return NextResponse.json({
        source: "Princeton WordNet 3.1 · dictionary data, not AI",
        senses: await lookup(word),
        pronunciation: pronunciation(word),
        syllables: syllables(word),
      });
    return NextResponse.json({
      source: "CMU Pronouncing Dictionary · American English",
      words: rhymes(
        word,
        tool === "alliteration" ? "alliteration" : type,
        count,
      ),
      pronunciation: pronunciation(word),
      syllables: syllables(word),
      approximate: type === "near",
      notice: !pronunciation(word)
        ? "No pronunciation found for this word. Try its base form."
        : undefined,
    });
  } catch (e) {
    return failure(e);
  }
}
