import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { path } from "wordnet-db";
type Entry = {
  partOfSpeech: string;
  definition: string;
  examples: string[];
  synonyms: string[];
  antonyms: string[];
};
type Dataset = { index: Map<string, number[]>; data: Buffer };
const cache = new Map<string, Promise<Dataset>>();
function dataset(kind: string) {
  if (!cache.has(kind))
    cache.set(
      kind,
      (async () => {
        const [index, data] = await Promise.all([
          readFile(join(path, `index.${kind}`), "utf8"),
          readFile(join(path, `data.${kind}`)),
        ]);
        const entries = new Map<string, number[]>();
        for (const line of index.split("\n")) {
          if (!line || line.startsWith(" ")) continue;
          const parts = line.trim().split(/\s+/),
            count = Number(parts[2]);
          if (Number.isFinite(count) && count > 0)
            entries.set(parts[0], parts.slice(-count).map(Number));
        }
        return { index: entries, data };
      })(),
    );
  return cache.get(kind)!;
}
function synset(buffer: Buffer, offset: number) {
  const end = buffer.indexOf(10, offset);
  const line = buffer
    .subarray(offset, end < 0 ? undefined : end)
    .toString("utf8");
  const [head, gloss = ""] = line.split("|");
  const fields = head.trim().split(/\s+/);
  const count = parseInt(fields[3], 16);
  const words = [];
  for (let i = 0; i < count; i++)
    words.push(
      fields[4 + i * 2].replaceAll("_", " ").replace(/\([aps]\)$/, ""),
    );
  let pos = 4 + count * 2;
  const pointerCount = Number(fields[pos++]);
  const antonyms: { offset: number; pos: string }[] = [];
  for (let i = 0; i < pointerCount; i++, pos += 4)
    if (fields[pos] === "!")
      antonyms.push({ offset: Number(fields[pos + 1]), pos: fields[pos + 2] });
  return {
    words,
    definition: gloss.split('; "')[0].trim(),
    examples: [...gloss.matchAll(/"([^"]+)"/g)].map((m) => m[1]),
    antonyms,
  };
}
export async function lookup(word: string): Promise<Entry[]> {
  const clean = word.toLowerCase().replaceAll(" ", "_");
  const candidates = [
    clean,
    clean.replace(/ies$/, "y"),
    clean.replace(/s$/, ""),
    clean.replace(/ing$/, ""),
    clean.replace(/ed$/, ""),
  ];
  const result: Entry[] = [];
  for (const kind of ["noun", "verb", "adj", "adv"]) {
    const d = await dataset(kind);
    const form = candidates.find((w) => d.index.has(w));
    if (!form) continue;
    for (const offset of d.index.get(form)!.slice(0, 5)) {
      const sense = synset(d.data, offset);
      const antonyms = [];
      for (const pointer of sense.antonyms.slice(0, 3)) {
        const related = await dataset(
          (
            { n: "noun", v: "verb", a: "adj", s: "adj", r: "adv" } as Record<
              string,
              string
            >
          )[pointer.pos] || kind,
        );
        antonyms.push(...synset(related.data, pointer.offset).words);
      }
      result.push({
        partOfSpeech: (
          {
            noun: "noun",
            verb: "verb",
            adj: "adjective",
            adv: "adverb",
          } as Record<string, string>
        )[kind],
        definition: sense.definition,
        examples: sense.examples,
        synonyms: sense.words,
        antonyms,
      });
    }
  }
  return result.slice(0, 12);
}
