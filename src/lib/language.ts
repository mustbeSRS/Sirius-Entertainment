import { dictionary } from "cmu-pronouncing-dictionary";
export function pronunciation(word: string) {
  return dictionary[word.toLowerCase()]?.split("#")[0].trim() || null;
}
const tokens = (p: string) => p.split(/\s+/);
export function syllables(word: string) {
  const p = pronunciation(word);
  if (p)
    return {
      count: tokens(p).filter((t) => /\d/.test(t)).length,
      approximate: false,
    };
  const clean = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!clean) return { count: 0, approximate: true };
  return {
    count: Math.max(
      1,
      (
        clean
          .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
          .match(/[aeiouy]+/g) || []
      ).length,
    ),
    approximate: true,
  };
}
export function rhymeKey(word: string) {
  const p = pronunciation(word);
  if (!p) return null;
  const t = tokens(p);
  let last = -1;
  for (let i = t.length - 1; i >= 0; i--)
    if (/[12]/.test(t[i])) {
      last = i;
      break;
    }
  if (last < 0) last = t.findLastIndex((x) => /\d/.test(x));
  return last < 0
    ? null
    : t
        .slice(last)
        .map((t) => t.replace(/\d/g, ""))
        .join(" ");
}
export function rhymes(word: string, type = "perfect", count = 0) {
  const key = rhymeKey(word);
  if (!key) return [];
  const p = pronunciation(word)!;
  const first = p.split(" ")[0];
  return Object.keys(dictionary)
    .filter(
      (w) =>
        /^[a-z]+$/.test(w) &&
        w !== word.toLowerCase() &&
        (!count || syllables(w).count === count),
    )
    .filter((w) => {
      const k = rhymeKey(w);
      if (!k) return false;
      if (type === "alliteration")
        return pronunciation(w)?.split(" ")[0] === first;
      if (type === "near")
        return k.split(" ")[0] === key.split(" ")[0] && k !== key;
      return k === key;
    })
    .sort((a, b) => a.length - b.length || a.localeCompare(b))
    .slice(0, 70);
}
export function analyze(text: string) {
  const lines = text.split("\n");
  const words = text.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) || [];
  const counts: Record<string, number> = {};
  for (const w of words) counts[w] = (counts[w] || 0) + 1;
  const keys: string[] = [];
  return {
    lines: lines.map((line) => {
      const ws = line.match(/[a-z]+(?:'[a-z]+)?/gi) || [];
      const last = ws.at(-1) || "";
      const key = rhymeKey(last);
      if (key && !keys.includes(key)) keys.push(key);
      const groups = ws.map(syllables);
      const internal = ws.filter((w, i) =>
        ws.some(
          (other, j) =>
            j > i &&
            other.toLowerCase() !== w.toLowerCase() &&
            rhymeKey(w) &&
            rhymeKey(w) === rhymeKey(other),
        ),
      );
      return {
        text: line,
        syllables: groups.reduce((n, g) => n + g.count, 0),
        approximate: groups.some((g) => g.approximate),
        scheme: key ? String.fromCharCode(65 + keys.indexOf(key)) : "—",
        internal,
      };
    }),
    repeated: Object.entries(counts)
      .filter(([w, n]) => n > 2 && w.length > 2)
      .sort((a, b) => b[1] - a[1]),
  };
}
