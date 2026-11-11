export const notes = [
  "C",
  "C♯",
  "D",
  "E♭",
  "E",
  "F",
  "F♯",
  "G",
  "A♭",
  "A",
  "B♭",
  "B",
];
export type Quality =
  "major" | "minor" | "dim" | "7" | "maj7" | "m7" | "sus2" | "sus4";
export type Chord = { root: number; quality: Quality };
export const intervals: Record<Quality, number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  dim: [0, 3, 6],
  "7": [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
};
export function label(chord: Chord) {
  return (
    notes[chord.root] +
    {
      major: "",
      minor: "m",
      dim: "°",
      "7": "7",
      maj7: "maj7",
      m7: "m7",
      sus2: "sus2",
      sus4: "sus4",
    }[chord.quality]
  );
}
export function tones(chord: Chord) {
  return intervals[chord.quality].map((n) => (n + chord.root) % 12);
}
export function scale(key: number, mode: string): Chord[] {
  const offsets =
    mode === "minor" ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
  const qualities: Quality[] =
    mode === "minor"
      ? ["minor", "dim", "major", "minor", "minor", "major", "major"]
      : ["major", "minor", "minor", "major", "major", "minor", "dim"];
  return offsets.map((n, i) => ({
    root: (key + n) % 12,
    quality: qualities[i],
  }));
}
export function roman(index: number, mode: string) {
  return (
    mode === "minor"
      ? ["i", "ii°", "III", "iv", "v", "VI", "VII"]
      : ["I", "ii", "iii", "IV", "V", "vi", "vii°"]
  )[index];
}
export const patterns = [
  {
    name: "Open-road pop",
    degrees: [0, 4, 5, 3],
    mode: "major",
    genre: "Pop",
    mood: "Hopeful",
    description: "I–V–vi–IV · familiar lift, tension, and return.",
  },
  {
    name: "Classic turnaround",
    degrees: [0, 5, 3, 4],
    mode: "major",
    genre: "Pop",
    mood: "Romantic",
    description: "I–vi–IV–V · a warm repeating turnaround.",
  },
  {
    name: "Soulful circle",
    degrees: [1, 4, 0, 5],
    mode: "major",
    genre: "R&B / Soul",
    mood: "Reflective",
    description: "ii–V–I–vi · try sevenths for a softer color.",
  },
  {
    name: "Jazz resolution",
    degrees: [1, 4, 0],
    mode: "major",
    genre: "Jazz",
    mood: "Intimate",
    description: "ii–V–I · a strong return home; add seventh colors.",
  },
  {
    name: "Folk horizon",
    degrees: [0, 3, 0, 4],
    mode: "major",
    genre: "Folk",
    mood: "Hopeful",
    description: "I–IV–I–V · room for a story and a returning melody.",
  },
  {
    name: "Rock foundation",
    degrees: [0, 3, 4, 3],
    mode: "major",
    genre: "Rock",
    mood: "Energetic",
    description: "I–IV–V–IV · direct, driving harmonic motion.",
  },
  {
    name: "Minor current",
    degrees: [0, 5, 2, 6],
    mode: "minor",
    genre: "Hip-hop",
    mood: "Melancholic",
    description: "i–VI–III–VII · a minor loop with an open ending.",
  },
  {
    name: "Late-night loop",
    degrees: [0, 3, 6, 2],
    mode: "minor",
    genre: "R&B / Soul",
    mood: "Intimate",
    description: "i–iv–VII–III · darker motion with a brighter arrival.",
  },
  {
    name: "Cinematic rise",
    degrees: [0, 5, 3, 6],
    mode: "minor",
    genre: "Cinematic",
    mood: "Dramatic",
    description: "i–VI–iv–VII · a developing, unresolved arc.",
  },
  {
    name: "Minor descent",
    degrees: [0, 6, 5, 4],
    mode: "minor",
    genre: "Rock",
    mood: "Defiant",
    description: "i–VII–VI–v · a descending natural-minor pattern.",
  },
];
export function suggest(key: number, mode: string, previous?: Chord) {
  return scale(key, mode)
    .map((chord, i) => {
      const common = previous
        ? tones(chord).filter((n) => tones(previous).includes(n)).length
        : 0;
      const same = previous && previous.root === chord.root;
      const score =
        (i === 0 ? 3 : i === 4 ? 2 : i === 3 ? 1 : 0) +
        common -
        (same ? 8 : 0) +
        (previous && previous.root === (key + 7) % 12 && i === 0 ? 4 : 0);
      return {
        chord,
        degree: roman(i, mode),
        score,
        reason: common
          ? `${common} shared tone${common > 1 ? "s" : ""} for a smooth connection`
          : i === 0
            ? "Return to the tonal center"
            : i === 4
              ? "Add tension before a return"
              : "Explore a diatonic contrast",
      };
    })
    .sort((a, b) => b.score - a.score);
}
export function possibleKeys(first: Chord) {
  const keys: { root: number; mode: string }[] = [];
  for (let root = 0; root < 12; root++)
    for (const mode of ["major", "minor"])
      if (
        scale(root, mode).some(
          (c) =>
            c.root === first.root &&
            (c.quality === first.quality ||
              (first.quality === "7" && c.quality === "major") ||
              (first.quality === "m7" && c.quality === "minor") ||
              (first.quality === "maj7" && c.quality === "major")),
        )
      )
        keys.push({ root, mode });
  return keys;
}
