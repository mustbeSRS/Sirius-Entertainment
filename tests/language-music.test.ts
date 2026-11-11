import { describe, it, expect } from "vitest";
import { rhymes, syllables, analyze } from "../src/lib/language";
import {
  scale,
  tones,
  label,
  suggest,
  possibleKeys,
  patterns,
} from "../src/lib/music";
describe("Pronunciation-backed tools", () => {
  it("matches sounds rather than spelling and filters syllables", () => {
    expect(rhymes("light")).toContain("night");
    expect(
      rhymes("light", "perfect", 1).every((w) => syllables(w).count === 1),
    ).toBe(true);
    expect(rhymes("orangeunknown")).toEqual([]);
  });
  it("labels unknown syllables and detects rhyme schemes", () => {
    expect(syllables("beautiful").count).toBe(3);
    expect(syllables("zzzz").approximate).toBe(true);
    const a = analyze("A light\nThe night\nA day");
    expect(a.lines.map((l) => l.scheme)).toEqual(["A", "A", "B"]);
  });
});
describe("Chord theory", () => {
  it("builds correct C-major and A-minor diatonic harmony", () => {
    expect(scale(0, "major").map(label)).toEqual([
      "C",
      "Dm",
      "Em",
      "F",
      "G",
      "Am",
      "B°",
    ]);
    expect(scale(9, "minor").map(label)).toEqual([
      "Am",
      "B°",
      "C",
      "Dm",
      "Em",
      "F",
      "G",
    ]);
  });
  it("expands seventh chords and recommends tonal connections", () => {
    expect(tones({ root: 7, quality: "7" })).toEqual([7, 11, 2, 5]);
    expect(suggest(0, "major", { root: 7, quality: "7" })[0].chord.root).toBe(
      0,
    );
    expect(possibleKeys({ root: 9, quality: "minor" })).toContainEqual({
      root: 0,
      mode: "major",
    });
  });
  it("keeps curated degree patterns within scale bounds", () => {
    for (const p of patterns)
      expect(p.degrees.every((d) => d >= 0 && d < 7)).toBe(true);
  });
});
