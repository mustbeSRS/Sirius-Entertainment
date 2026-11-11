"use client";
import { useState, useEffect } from "react";
import { Plus, Star, Feather, Trash2 } from "lucide-react";
import type { Idea, Project } from "@/lib/models";
import { base } from "@/lib/client";
import { Modal, Field, Empty, tags } from "./ui";
export function Ideas({
  initialCreate = false,
  artistId,
  ideas,
  projects,
  onSave,
  onDelete,
  onConvert,
}: {
  initialCreate?: boolean;
  artistId: string;
  ideas: Idea[];
  projects: Project[];
  onSave: (i: Idea) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onConvert: (i: Idea, kind: "song" | "poem") => Promise<void>;
}) {
  const [query, setQuery] = useState(""),
    [view, setView] = useState("cards"),
    [favorite, setFavorite] = useState(false),
    [editing, setEditing] = useState<Idea | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    if (initialCreate)
      setEditing({
        ...base(artistId),
        title: "",
        body: "",
        type: "Lyric fragment",
        tags: [],
        collection: "",
        project_id: null,
        favorite: false,
        archived: false,
      });
  }, []);
  const filtered = ideas.filter(
    (i) =>
      !i.archived &&
      (!favorite || i.favorite) &&
      `${i.title} ${i.body} ${i.type} ${i.tags.join(" ")} ${i.collection}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="page-title-row">
        <div>
          <div className="eyebrow">DON’T LET THE SPARK DISAPPEAR</div>
          <h1>Idea Vault</h1>
          <p>Words, fragments, images, possibilities.</p>
        </div>
        <button
          className="primary compact"
          onClick={() =>
            setEditing({
              ...base(artistId),
              title: "",
              body: "",
              type: "Lyric fragment",
              tags: [],
              collection: "",
              project_id: null,
              favorite: false,
              archived: false,
            })
          }
        >
          <Plus size={16} />
          Capture idea
        </button>
      </div>
      <div className="controls">
        <input
          placeholder="Search words, tags, collections…"
          aria-label="Search ideas"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          className={`secondary ${favorite ? "accent" : ""}`}
          onClick={() => setFavorite(!favorite)}
        >
          <Star size={14} />
          Favorites
        </button>
        <button
          className="secondary"
          onClick={() => setView(view === "cards" ? "list" : "cards")}
        >
          {view === "cards" ? "List view" : "Card view"}
        </button>
      </div>
      <div className={view === "cards" ? "idea-grid" : "content-list"}>
        {filtered.map((i) => (
          <article className="idea-card" key={i.id}>
            <div className="row between">
              <span className="tag">{i.type}</span>
              <button
                className="icon-button"
                aria-label={`Favorite ${i.title || "idea"}`}
                onClick={() => void onSave({ ...i, favorite: !i.favorite })}
              >
                <Star size={17} fill={i.favorite ? "currentColor" : "none"} />
              </button>
            </div>
            <button className="title-button" onClick={() => setEditing(i)}>
              {i.title || i.body.slice(0, 45)}
            </button>
            <p className="preserve-lines">{i.body}</p>
            <div className="tag-row">
              {i.collection && <span className="tag">{i.collection}</span>}
              {i.tags.map((t) => (
                <button key={t} className="tag" onClick={() => setQuery(t)}>
                  {t}
                </button>
              ))}
            </div>
            <div className="row form-actions">
              <button
                className="text-button"
                onClick={() => void onConvert(i, "song")}
              >
                <Feather size={13} />
                Make song
              </button>
              <button
                className="text-button"
                onClick={() => void onConvert(i, "poem")}
              >
                Make poem
              </button>
            </div>
          </article>
        ))}
      </div>
      {!filtered.length && (
        <Empty
          title="Every fragment belongs somewhere."
          body="Capture a passing line, a vivid image, or a title. You can turn it into a draft later."
        />
      )}
      {editing && (
        <Modal title="Capture a spark" onClose={() => setEditing(null)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await onSave(editing);
                setEditing(null);
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            <Field label="Idea title (optional)">
              <input
                value={editing.title}
                maxLength={200}
                onChange={(e) =>
                  setEditing({ ...editing, title: e.target.value })
                }
              />
            </Field>
            <Field label="Your idea">
              <textarea
                required
                rows={6}
                value={editing.body}
                onChange={(e) =>
                  setEditing({ ...editing, body: e.target.value })
                }
              />
            </Field>
            <div className="form-grid">
              <Field label="Idea type">
                <select
                  value={editing.type}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      type: e.target.value as Idea["type"],
                    })
                  }
                >
                  {[
                    "Word",
                    "Phrase",
                    "Lyric fragment",
                    "Theme",
                    "Metaphor",
                    "Simile",
                    "Imagery",
                    "Song concept",
                    "Poem concept",
                    "Personal note",
                  ].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <Field label="Collection">
                <input
                  value={editing.collection}
                  onChange={(e) =>
                    setEditing({ ...editing, collection: e.target.value })
                  }
                />
              </Field>
            </div>
            <Field label="Tags (comma separated)">
              <input
                defaultValue={editing.tags.join(", ")}
                onChange={(e) =>
                  setEditing({ ...editing, tags: tags(e.target.value) })
                }
              />
            </Field>
            <Field label="Linked project">
              <select
                value={editing.project_id || ""}
                onChange={(e) =>
                  setEditing({ ...editing, project_id: e.target.value || null })
                }
              >
                <option value="">No project</option>
                {projects.map((p) => (
                  <option value={p.id} key={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </Field>
            <div className="row between">
              <button className="primary compact">Save idea</button>
              {ideas.some((i) => i.id === editing.id) && (
                <div className="row">
                  <button
                    type="button"
                    className="secondary"
                    onClick={async () => {
                      await onSave({ ...editing, archived: true });
                      setEditing(null);
                    }}
                  >
                    Archive
                  </button>
                  <button
                    type="button"
                    className="icon-button danger"
                    aria-label="Delete idea"
                    onClick={async () => {
                      if (confirm("Permanently delete this idea?")) {
                        await onDelete(editing.id);
                        setEditing(null);
                      }
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
          </form>
        </Modal>
      )}
    </>
  );
}
