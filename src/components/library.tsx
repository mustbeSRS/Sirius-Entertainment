"use client";
import { useState } from "react";
import { Feather, Plus, Copy, Trash2, Star, Archive } from "lucide-react";
import {
  type WorkspaceData,
  type Piece,
  type Project,
  type Idea,
  stageLabels,
  stages,
} from "@/lib/models";
import { base } from "@/lib/client";
import { Empty } from "./ui";
export function LibraryPanel({
  artistId,
  data,
  onOpen,
  onCreate,
  onSave,
  onDelete,
  onUnarchive,
  onIdea,
}: {
  artistId: string;
  data: WorkspaceData;
  onOpen: (p: Piece) => void;
  onCreate: () => void;
  onSave: (p: Piece) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUnarchive: (p: Project) => Promise<void>;
  onIdea: (i: Idea) => Promise<void>;
}) {
  const [query, setQuery] = useState(""),
    [type, setType] = useState("all"),
    [archive, setArchive] = useState(false);
  const pieces = data.writing_pieces.filter(
    (p) =>
      p.archived === archive &&
      (type === "all" ||
        p.kind === type ||
        (type === "completed" && p.status === "completed")) &&
      `${p.title} ${p.sections.map((s) => s.content).join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="page-title-row">
        <div>
          <div className="eyebrow">YOUR WORDS, GATHERED TOGETHER</div>
          <h1>Library</h1>
          <p>Return to a draft. Find a favorite. Finish something.</p>
        </div>
        <button className="primary compact" onClick={onCreate}>
          <Plus size={15} />
          New writing
        </button>
      </div>
      <div className="controls">
        <input
          aria-label="Search library"
          placeholder="Search titles and writing…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label="Filter library"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="all">All writing</option>
          <option value="song">Songs</option>
          <option value="poem">Poems</option>
          <option value="completed">Completed</option>
        </select>
        <button className="secondary" onClick={() => setArchive(!archive)}>
          <Archive size={14} />
          {archive ? "Show active" : "Show archive"}
        </button>
      </div>
      <div className="writing-grid">
        {pieces
          .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
          .map((p) => (
            <article className="writing-card" key={p.id}>
              <div className="row between">
                <span className="tag">
                  {p.kind} · {stageLabels[stages.indexOf(p.status)]}
                </span>
                <button
                  className="icon-button"
                  aria-label={`Pin ${p.title}`}
                  onClick={() => void onSave({ ...p, pinned: !p.pinned })}
                >
                  <Star size={15} fill={p.pinned ? "currentColor" : "none"} />
                </button>
              </div>
              <button className="title-button" onClick={() => onOpen(p)}>
                {p.title}
              </button>
              <p className="writing-excerpt">
                {p.sections
                  .map((s) => s.content)
                  .join(" ")
                  .slice(0, 160) || "Your next words belong here."}
              </p>
              <div className="row between">
                <small>
                  {p.sections.length} section(s) · v{p.revision}
                </small>
                <div className="row">
                  <button
                    className="icon-button"
                    aria-label={`Duplicate ${p.title}`}
                    onClick={() =>
                      void onSave({
                        ...p,
                        ...base(artistId),
                        title: p.title + " (copy)",
                        revision: 0,
                        sections: p.sections.map((s) => ({
                          ...s,
                          id: crypto.randomUUID(),
                        })),
                      })
                    }
                  >
                    <Copy size={15} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={`${p.archived ? "Restore" : "Archive"} ${p.title}`}
                    onClick={() => void onSave({ ...p, archived: !p.archived })}
                  >
                    <Archive size={15} />
                  </button>
                  <button
                    className="icon-button danger"
                    aria-label={`Delete ${p.title}`}
                    onClick={() => {
                      if (
                        confirm(
                          "Permanently delete this writing and its snapshots?",
                        )
                      )
                        void onDelete(p.id);
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </article>
          ))}
      </div>
      {!pieces.length && (
        <Empty
          title="A blank page is a beginning."
          body="Create a song or poem, or convert a fragment from your Idea Vault."
        />
      )}
      <section className="task-section">
        <h2>{archive ? "Archived ideas" : "Saved ideas"}</h2>
        {data.ideas
          .filter(
            (i) =>
              i.archived === archive &&
              `${i.title} ${i.body}`
                .toLowerCase()
                .includes(query.toLowerCase()),
          )
          .map((i) => (
            <div className="list-row" key={i.id}>
              <div>
                <strong>{i.title || i.body.slice(0, 50)}</strong>
                <p className="preserve-lines">{i.body.slice(0, 200)}</p>
              </div>
              <span className="tag">{i.type}</span>
              {archive && (
                <button
                  className="secondary"
                  onClick={() => void onIdea({ ...i, archived: false })}
                >
                  Restore idea
                </button>
              )}
            </div>
          ))}
      </section>
      <section className="task-section">
        <h2>Favorite words</h2>
        <div className="word-results">
          {data.saved_words
            .filter((w) =>
              `${w.word} ${w.note}`.toLowerCase().includes(query.toLowerCase()),
            )
            .map((w) => (
              <span className="word-chip" key={w.id}>
                <span title={w.source}>{w.word}</span>
                <button
                  aria-label={`Delete saved word ${w.word}`}
                  onClick={() => void onDelete("word:" + w.id)}
                >
                  ×
                </button>
              </span>
            ))}
        </div>
        {!data.saved_words.length && (
          <p>Save vocabulary discoveries from the Creative Toolkit.</p>
        )}
      </section>
      {archive && (
        <>
          <h2>Archived projects</h2>
          {data.projects
            .filter((p) => p.archived)
            .map((p) => (
              <div className="list-row" key={p.id}>
                <strong>{p.title}</strong>
                <button
                  className="secondary"
                  onClick={() => void onUnarchive({ ...p, archived: false })}
                >
                  Restore project
                </button>
              </div>
            ))}
        </>
      )}
    </>
  );
}
