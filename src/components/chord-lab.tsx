"use client";
import { useEffect, useRef, useState } from "react";
import {
  Play,
  Square,
  Plus,
  Trash2,
  Save,
  ArrowUp,
  ArrowDown,
  Music2,
} from "lucide-react";
import {
  notes,
  scale,
  roman,
  label,
  tones,
  suggest,
  patterns,
  possibleKeys,
  type Chord,
  type Quality,
} from "@/lib/music";
import { GrandPiano } from "@/lib/piano";
import { base, download } from "@/lib/client";
import type { Progression, Project } from "@/lib/models";
import { Field, Empty } from "./ui";
const fifths = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];
export function ChordLab({
  artistId,
  progressions,
  projects,
  onSave,
  onDelete,
}: {
  artistId: string;
  progressions: Progression[];
  projects: Project[];
  onSave: (p: Progression) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [key, setKey] = useState(0),
    [mode, setMode] = useState<"major" | "minor">("major"),
    [quality, setQuality] = useState<Quality>("major"),
    [root, setRoot] = useState(0),
    [chords, setChords] = useState<Chord[]>([]),
    [genre, setGenre] = useState("All"),
    [mood, setMood] = useState("All"),
    [bpm, setBpm] = useState(80),
    [sustain, setSustain] = useState(3),
    [pedal, setPedal] = useState(false),
    [volume, setVolume] = useState(0.65),
    [playing, setPlaying] = useState(-1),
    [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [title, setTitle] = useState("Untitled progression"),
    [savedId, setSavedId] = useState<string | null>(null),
    [project, setProject] = useState("");
  const piano = useRef<GrandPiano | null>(null);
  useEffect(() => {
    piano.current = new GrandPiano();
    return () => piano.current?.dispose();
  }, []);
  const diatonic = scale(key, mode);
  const last = chords.at(-1);
  const recommendations = suggest(key, mode, last);
  const availablePatterns = patterns.filter(
    (p) =>
      (genre === "All" || p.genre === genre) &&
      (mood === "All" || p.mood === mood),
  );
  async function play(chord: Chord) {
    setBusy(true);
    try {
      const generation = piano.current!.generationId;
      await piano.current!.prepare();
      if (generation !== piano.current!.generationId) return;
      setReady(true);
      piano.current!.play(chord, sustain, volume, pedal);
      setMessage(
        `${label(chord)} · ${tones(chord)
          .map((n) => notes[n])
          .join(" – ")}`,
      );
    } catch (e) {
      setMessage((e as Error).message);
    }
    setBusy(false);
  }
  function add(chord: Chord) {
    if (chords.length >= 64) {
      setMessage("A progression can contain up to 64 chords.");
      return;
    }
    setChords([...chords, chord]);
  }
  function transpose(amount: number) {
    piano.current?.stop();
    setPlaying(-1);
    setKey((key + amount + 12) % 12);
    setChords(chords.map((c) => ({ ...c, root: (c.root + amount + 12) % 12 })));
  }
  async function sequence() {
    if (!chords.length) return;
    setBusy(true);
    try {
      await piano.current!.prepare();
      setReady(true);
      setBusy(false);
      await piano.current!.sequence(
        chords,
        bpm,
        sustain,
        volume,
        pedal,
        setPlaying,
      );
    } catch (e) {
      setMessage((e as Error).message);
      setPlaying(-1);
    }
    setBusy(false);
  }
  return (
    <>
      <div className="page-title-row">
        <div>
          <div className="eyebrow">FIND THE HARMONY UNDER YOUR WORDS</div>
          <h1>Chord Lab</h1>
          <p>Follow a key. Trust your ear. Build a progression.</p>
        </div>
        <span className="tag">SAMPLED GRAND PIANO</span>
      </div>
      <div className="chord-layout">
        <section className="chord-main">
          <div className="chord-start">
            <Field label="Song key">
              <select
                value={key}
                onChange={(e) => setKey(Number(e.target.value))}
              >
                {notes.map((n, i) => (
                  <option value={i} key={n}>
                    {n}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Mode">
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as "major" | "minor")}
              >
                <option value="major">Major</option>
                <option value="minor">Natural minor</option>
              </select>
            </Field>
            <Field label="Starting chord">
              <select
                value={root}
                onChange={(e) => setRoot(Number(e.target.value))}
              >
                {notes.map((n, i) => (
                  <option value={i} key={n}>
                    {n}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Chord quality">
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value as Quality)}
              >
                {[
                  "major",
                  "minor",
                  "dim",
                  "7",
                  "maj7",
                  "m7",
                  "sus2",
                  "sus4",
                ].map((q) => (
                  <option key={q}>{q}</option>
                ))}
              </select>
            </Field>
            <button
              className="secondary"
              onClick={() => add({ root, quality })}
            >
              Add starting chord
            </button>
          </div>
          <details>
            <summary>Find keys that contain my starting chord</summary>
            <div className="word-results">
              {possibleKeys({ root, quality }).map((k) => (
                <button
                  key={`${k.root}-${k.mode}`}
                  className="secondary"
                  onClick={() => {
                    setKey(k.root);
                    setMode(k.mode as "major" | "minor");
                  }}
                >
                  {notes[k.root]} {k.mode}
                </button>
              ))}
            </div>
          </details>
          <div
            className="chord-wheel"
            role="group"
            aria-label="Circle of fifths chord wheel"
          >
            <div className="wheel-rings" aria-hidden="true" />
            <div className="wheel-center">
              <Music2 size={27} />
              <strong>{notes[key]}</strong>
              <span>{mode}</span>
              <small>Circle of fifths</small>
            </div>
            {fifths.map((note, i) => {
              const angle = ((i * 30 - 90) * Math.PI) / 180;
              const index = diatonic.findIndex((c) => c.root === note);
              const chord =
                index >= 0
                  ? diatonic[index]
                  : { root: note, quality: "major" as Quality };
              return (
                <button
                  key={note}
                  style={{
                    left: `${50 + 40 * Math.cos(angle)}%`,
                    top: `${50 + 40 * Math.sin(angle)}%`,
                  }}
                  className={`wheel-chord ${index >= 0 ? "in-key" : ""} ${note === key ? "tonic" : ""}`}
                  aria-label={`Play ${label(chord)}${index >= 0 ? `, ${roman(index, mode)}` : ", outside key"}`}
                  onClick={() => void play(chord)}
                  onDoubleClick={() => add(chord)}
                >
                  <strong>{label(chord)}</strong>
                  <small>{index >= 0 ? roman(index, mode) : "color"}</small>
                </button>
              );
            })}
          </div>
          <p className="wheel-hint">
            Tap a chord to hear it. Double-tap to add it. Violet chords belong
            to your key; “color” chords are outside it.
          </p>
          <section className="suggestions-section">
            <div className="section-title">
              <h2>{last ? "What could come next?" : "Chords in your key"}</h2>
              <span>HARMONY SUGGESTIONS</span>
            </div>
            <div className="suggested-chords">
              {recommendations.map((s) => (
                <article key={s.degree}>
                  <button
                    className="chord-play"
                    onClick={() => void play(s.chord)}
                  >
                    <span>{s.degree}</span>
                    <strong>{label(s.chord)}</strong>
                    <Play size={13} />
                  </button>
                  <p>{s.reason}</p>
                  <button className="text-button" onClick={() => add(s.chord)}>
                    <Plus size={13} />
                    Add
                  </button>
                </article>
              ))}
            </div>
          </section>
          <section className="patterns-section">
            <div className="section-title">
              <h2>Progression patterns</h2>
              <span>COMMON MUSICAL STARTING POINTS</span>
            </div>
            <div className="controls">
              <Field label="Genre">
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                >
                  {["All", ...new Set(patterns.map((p) => p.genre))].map(
                    (g) => (
                      <option key={g}>{g}</option>
                    ),
                  )}
                </select>
              </Field>
              <Field label="Mood">
                <select value={mood} onChange={(e) => setMood(e.target.value)}>
                  {["All", ...new Set(patterns.map((p) => p.mood))].map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </Field>
            </div>
            <p>
              These are common harmonic patterns, not excerpts from specific
              songs. Genre and mood are starting points, not rules.
            </p>
            <div className="pattern-grid">
              {availablePatterns.map((p) => {
                const keyChords = scale(key, p.mode);
                const pattern = p.degrees.map((d) => keyChords[d]);
                return (
                  <article className="prompt-card" key={p.name}>
                    <div className="row between">
                      <h3>{p.name}</h3>
                      <span className="tag">{p.genre}</span>
                    </div>
                    <strong>{pattern.map(label).join(" → ")}</strong>
                    <p>{p.description}</p>
                    <div className="row">
                      <button
                        className="secondary"
                        onClick={() => {
                          if (
                            chords.length &&
                            !confirm(
                              "Replace the current progression? Save it first if you want to keep it.",
                            )
                          )
                            return;
                          setMode(p.mode as "major" | "minor");
                          setChords(pattern);
                          setTitle(p.name);
                          setSavedId(null);
                        }}
                      >
                        Use pattern
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Preview ${p.name}`}
                        onClick={async () => {
                          try {
                            await piano.current!.prepare();
                            setReady(true);
                            await piano.current!.sequence(
                              pattern,
                              bpm,
                              sustain,
                              volume,
                              pedal,
                              () => {},
                            );
                          } catch (e) {
                            setMessage((e as Error).message);
                          }
                        }}
                      >
                        <Play size={16} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
            {!availablePatterns.length && (
              <Empty
                title="Try a broader combination."
                body="Choose All for genre or mood to discover more patterns."
              />
            )}
          </section>
        </section>
        <aside className="progression-panel">
          <div className="eyebrow">YOUR HARMONIC SKETCH</div>
          <Field label="Progression title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
          </Field>
          <div className="progression-chain">
            {chords.map((c, i) => (
              <div
                key={i}
                className={playing === i ? "chord-step playing" : "chord-step"}
              >
                <span>{i + 1}</span>
                <button className="title-button" onClick={() => void play(c)}>
                  {label(c)}
                </button>
                <button
                  className="icon-button"
                  aria-label={`Move chord ${i + 1} up`}
                  disabled={i === 0}
                  onClick={() => {
                    const next = [...chords];
                    [next[i - 1], next[i]] = [next[i], next[i - 1]];
                    setChords(next);
                  }}
                >
                  <ArrowUp size={12} />
                </button>
                <button
                  className="icon-button"
                  aria-label={`Move chord ${i + 1} down`}
                  disabled={i === chords.length - 1}
                  onClick={() => {
                    const next = [...chords];
                    [next[i + 1], next[i]] = [next[i], next[i + 1]];
                    setChords(next);
                  }}
                >
                  <ArrowDown size={12} />
                </button>
                <button
                  className="icon-button"
                  aria-label={`Remove chord ${i + 1}`}
                  onClick={() => setChords(chords.filter((_, n) => n !== i))}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
          {!chords.length && (
            <p>
              Add a starting chord, a recommendation, or a complete pattern.
            </p>
          )}
          <div className="row">
            <button
              className="primary compact"
              disabled={!chords.length || busy || playing >= 0}
              onClick={() => void sequence()}
            >
              <Play size={16} />
              {busy ? "Loading piano…" : "Play progression"}
            </button>
            <button
              className="secondary"
              aria-label="Stop piano"
              onClick={() => {
                piano.current?.stop();
                setPlaying(-1);
              }}
            >
              <Square size={15} />
            </button>
          </div>
          <div className="form-grid">
            <Field label="Tempo (BPM)">
              <input
                type="number"
                min={30}
                max={240}
                value={bpm}
                onChange={(e) =>
                  setBpm(
                    Math.max(30, Math.min(240, Number(e.target.value) || 80)),
                  )
                }
              />
            </Field>
            <Field label="Sustain (seconds)">
              <input
                type="number"
                min={0.3}
                max={10}
                step={0.1}
                value={sustain}
                onChange={(e) =>
                  setSustain(
                    Math.max(0.3, Math.min(10, Number(e.target.value) || 3)),
                  )
                }
              />
            </Field>
          </div>
          <Field label={`Volume · ${Math.round(volume * 100)}%`}>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
            />
          </Field>
          <label className="check">
            <input
              type="checkbox"
              checked={pedal}
              onChange={(e) => setPedal(e.target.checked)}
            />
            <span>
              Sustain pedal · let notes ring naturally (up to 10 seconds)
            </span>
          </label>
          <small>
            Four beats per chord. Samples decay naturally; sustain controls the
            release, not an endless loop.
          </small>
          <div className="row form-actions">
            <button className="secondary" onClick={() => transpose(-1)}>
              Transpose −
            </button>
            <button className="secondary" onClick={() => transpose(1)}>
              Transpose +
            </button>
          </div>
          <Field label="Link to project">
            <select
              value={project}
              onChange={(e) => setProject(e.target.value)}
            >
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </Field>
          <button
            className="primary"
            disabled={!chords.length}
            onClick={async () => {
              try {
                const old = progressions.find((p) => p.id === savedId);
                const p: Progression = {
                  ...(old || base(artistId)),
                  title: title || "Untitled progression",
                  key: notes[key],
                  mode,
                  chords,
                  genre,
                  mood,
                  bpm,
                  sustain,
                  project_id: project || null,
                };
                await onSave(p);
                setSavedId(p.id);
                setMessage("Progression saved to your workspace.");
              } catch (e) {
                setMessage((e as Error).message);
              }
            }}
          >
            <Save size={15} />
            Save progression
          </button>
          <button
            className="secondary form-actions"
            disabled={!chords.length}
            onClick={() =>
              download(
                `${title || "progression"}.txt`,
                `${title}\nKey: ${notes[key]} ${mode}\n${chords.map(label).join(" | ")}\n${bpm} BPM · 4 beats per chord`,
              )
            }
          >
            Export progression
          </button>
          <p role="status">{message}</p>
          <small>
            {ready
              ? "Grand piano ready."
              : "Piano samples load after your first play gesture."}
          </small>
          <h3 className="form-actions">Saved progressions</h3>
          {progressions.map((p) => (
            <div className="list-row" key={p.id}>
              <button
                className="title-button"
                onClick={() => {
                  piano.current?.stop();
                  setPlaying(-1);
                  setSavedId(p.id);
                  setTitle(p.title);
                  setKey(Math.max(0, notes.indexOf(p.key)));
                  setMode(p.mode);
                  setChords(p.chords);
                  setBpm(p.bpm);
                  setSustain(p.sustain);
                  setProject(p.project_id || "");
                }}
              >
                {p.title}
              </button>
              <button
                className="icon-button"
                aria-label={`Delete progression ${p.title}`}
                onClick={() => {
                  if (confirm("Delete this saved progression?"))
                    void onDelete(p.id);
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          <p className="sample-credit">
            Piano: <a href="/audio/piano/README">Salamander Grand Piano</a>,
            Yamaha C5, by Alexander Holm ·{" "}
            <a href="https://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a>
            . MP3 samples distributed by Tone.js. Notes are transposed from
            sampled C octaves; this is not a full multi-velocity piano
            instrument.
          </p>
        </aside>
      </div>
    </>
  );
}
