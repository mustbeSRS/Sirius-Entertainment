"use client";
import { useState } from "react";
import { Search, Star, Plus, RefreshCw } from "lucide-react";
import { senses, prompts } from "@/lib/prompts";
import { analyze } from "@/lib/language";
import type { SavedWord } from "@/lib/models";
import { base } from "@/lib/client";
import { Field } from "./ui";
type Sense = {
  partOfSpeech: string;
  definition: string;
  examples: string[];
  synonyms: string[];
  antonyms: string[];
};
type Result = {
  source: string;
  words?: string[];
  senses?: Sense[];
  pronunciation?: string;
  notice?: string;
  approximate?: boolean;
  syllables?: { count: number; approximate: boolean };
};
export function Toolkit({
  artistId,
  selected = "",
  onInsert,
  onFavorite,
  onCapture,
  compact = false,
}: {
  artistId: string;
  selected?: string;
  onInsert?: (text: string) => void;
  onFavorite: (w: SavedWord) => Promise<void>;
  onCapture?: (text: string) => void;
  compact?: boolean;
}) {
  const [tool, setTool] = useState("Rhymes"),
    [word, setWord] = useState(selected),
    [type, setType] = useState("perfect"),
    [count, setCount] = useState("0"),
    [result, setResult] = useState<Result | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [theme, setTheme] = useState("belonging"),
    [mood, setMood] = useState("Reflective"),
    [sense, setSense] = useState("Sight"),
    [variation, setVariation] = useState(0),
    [text, setText] = useState(""),
    [feedback, setFeedback] = useState("");
  const lexical = [
    "Rhymes",
    "Synonyms",
    "Definitions",
    "Alliteration",
  ].includes(tool);
  const suggestions = prompts(tool, theme, mood, sense, variation);
  const analysis = tool === "Rhythm" ? analyze(text) : null;
  async function search(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const params = new URLSearchParams({
        word,
        tool: tool.toLowerCase(),
        type,
        syllables: count,
      });
      const r = await fetch("/api/language?" + params);
      const data = await r.json();
      if (!r.ok) throw Error(data.error);
      setResult(data);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }
  async function favorite(w: string) {
    try {
      await onFavorite({
        ...base(artistId),
        word: w,
        note: "",
        source: result?.source || "Creative prompt",
      });
      setFeedback(`Saved “${w}” to your word library.`);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function wordButton(w: string) {
    return (
      <span className="word-chip" key={w}>
        <button
          onClick={() => (onInsert ? onInsert(w) : setWord(w))}
          title={onInsert ? "Insert at selected cursor" : "Use as search word"}
        >
          {w}
        </button>
        <button aria-label={`Save word ${w}`} onClick={() => void favorite(w)}>
          <Star size={12} />
        </button>
      </span>
    );
  }
  return (
    <section className={compact ? "toolkit compact-toolkit" : "toolkit"}>
      {!compact && (
        <div className="dashboard-heading">
          <div className="eyebrow">FIND YOUR NEXT WAY IN</div>
          <h1>Creative Toolkit</h1>
          <p>Language, imagery, and structure. Your voice leads.</p>
        </div>
      )}
      <div className="tool-tabs">
        {[
          "Rhymes",
          "Synonyms",
          "Definitions",
          "Alliteration",
          "Metaphors",
          "Similes",
          "Imagery",
          "Topics",
          "Structure",
          "Rhythm",
          "AI Coach",
        ].map((t) => (
          <button
            className={tool === t ? "active" : ""}
            key={t}
            onClick={() => {
              setTool(t);
              setResult(null);
              setError("");
            }}
          >
            {t}
          </button>
        ))}
      </div>
      {selected && (
        <button className="text-button" onClick={() => setWord(selected)}>
          Use selected text: {selected.slice(0, 40)}
        </button>
      )}
      {lexical ? (
        <>
          <form onSubmit={search}>
            <Field label="Explore a word">
              <div className="row">
                <input
                  required
                  value={word}
                  maxLength={70}
                  onChange={(e) => setWord(e.target.value)}
                  placeholder="e.g. light"
                />
                <button
                  className="secondary"
                  disabled={busy}
                  aria-label="Search language tools"
                >
                  <Search size={17} />
                </button>
              </div>
            </Field>
            {tool === "Rhymes" && (
              <div className="form-grid">
                <Field label="Match">
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="perfect">Perfect rhymes</option>
                    <option value="near">Near / slant (approximate)</option>
                  </select>
                </Field>
                <Field label="Syllables">
                  <select
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                  >
                    <option value="0">Any</option>
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                </Field>
              </div>
            )}
          </form>
          {busy && <p role="status">Exploring the dictionary…</p>}
          {result && (
            <div className="tool-results">
              <small>{result.source}</small>
              {result.pronunciation && (
                <p className="pronunciation">
                  /{result.pronunciation}/ · {result.syllables?.count}{" "}
                  syllable(s)
                </p>
              )}
              {result.approximate && (
                <p>
                  Approximate near rhymes share a stressed vowel; endings may
                  differ.
                </p>
              )}
              {result.notice && <p>{result.notice}</p>}
              <div className="word-results">
                {result.words?.map(wordButton)}
              </div>
              {result.words?.length === 0 && !result.notice && (
                <p>No matches for these filters.</p>
              )}
              {result.senses?.map((s, i) => (
                <article key={i} className="dictionary-sense">
                  <span className="tag">{s.partOfSpeech}</span>
                  <p>{s.definition}</p>
                  {tool === "Synonyms" && (
                    <>
                      <div className="word-results">
                        {s.synonyms.filter((w) => w !== word).map(wordButton)}
                      </div>
                      {s.antonyms.length > 0 && (
                        <>
                          <small>Antonyms</small>
                          <div className="word-results">
                            {s.antonyms.map(wordButton)}
                          </div>
                        </>
                      )}
                    </>
                  )}
                  {s.examples?.map((e, i) => (
                    <blockquote key={i}>{e}</blockquote>
                  ))}
                </article>
              ))}
              {result.senses?.length === 0 && (
                <p>No dictionary entry found. Try a base form.</p>
              )}
              {tool === "Alliteration" && result.words && (
                <div>
                  <h3>Sound-based phrase starters</h3>
                  <p>
                    Word combinations, not dictionary phrases. Edit for meaning.
                  </p>
                  {result.words.slice(0, 6).map((w, i) => (
                    <p key={w}>
                      {[word, w, result.words?.[i + 6]]
                        .filter(Boolean)
                        .join(" ")}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      ) : tool === "AI Coach" ? (
        <div className="notice">
          <h3>AI stays optional.</h3>
          <p>
            No AI provider is enabled. The writing studio and linguistic tools
            work independently. A provider adapter, request limits, and explicit
            text-sharing consent are prepared; enabling a paid API requires
            founder approval.
          </p>
        </div>
      ) : tool === "Rhythm" ? (
        <>
          <Field label="Analyze your lines">
            <textarea
              rows={8}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste a verse or poem…"
            />
          </Field>
          <small>
            Syllables use CMU pronunciations where known; ~ marks estimates.
            Rhyme labels are pronunciation-based suggestions, not a poetic
            judgment.
          </small>
          {analysis?.lines.map((l, i) => (
            <div className="analysis-line" key={i}>
              <span>{l.text || "—"}</span>
              <strong>
                {l.approximate ? "~" : ""}
                {l.syllables}
              </strong>
              <span className="tag">{l.scheme}</span>
              {l.internal.length > 0 && (
                <small>Possible internal rhyme: {l.internal.join(", ")}</small>
              )}
            </div>
          ))}
          {analysis && analysis.repeated.length > 0 && (
            <p>
              Repeated words:{" "}
              {analysis.repeated.map(([w, n]) => `${w} (${n})`).join(", ")}
            </p>
          )}
        </>
      ) : (
        <>
          <div className="notice">
            <strong>Guided writing prompts · not AI-generated</strong>
            <p>
              Use these creative questions as starting points. Make the language
              your own.
            </p>
          </div>
          <Field label="Theme or topic">
            <input
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              maxLength={100}
            />
          </Field>
          <div className="form-grid">
            <Field label="Mood">
              <select value={mood} onChange={(e) => setMood(e.target.value)}>
                {[
                  "Reflective",
                  "Hopeful",
                  "Melancholic",
                  "Defiant",
                  "Intimate",
                  "Playful",
                  "Tense",
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
            <Field label="Imagery">
              <select value={sense} onChange={(e) => setSense(e.target.value)}>
                {senses.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
          </div>
          {suggestions.map((p, i) => (
            <article className="prompt-card" key={i}>
              <p>{p}</p>
              <div className="row">
                {onInsert && (
                  <button className="text-button" onClick={() => onInsert(p)}>
                    <Plus size={13} />
                    Insert
                  </button>
                )}
                {onCapture && (
                  <button className="text-button" onClick={() => onCapture(p)}>
                    Save idea
                  </button>
                )}
              </div>
            </article>
          ))}
          <button
            className="secondary"
            onClick={() => setVariation(variation + 1)}
          >
            <RefreshCw size={14} />
            Explore another angle
          </button>
        </>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {feedback && <p role="status">{feedback}</p>}
    </section>
  );
}
