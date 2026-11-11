"use client";
import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  LayoutDashboard,
  FolderOpen,
  Feather,
  WandSparkles,
  Lightbulb,
  Library,
  Settings,
  PanelLeftClose,
  Plus,
  Sun,
  Moon,
  Music2,
  Search,
  ArrowRight,
} from "lucide-react";
import type { Artist } from "@/lib/store";
import {
  emptyRecords,
  templates,
  type WorkspaceData,
  type Piece,
  type Project,
  type Idea,
  type Task,
  type SavedWord,
  type Progression,
  type Resource,
} from "@/lib/models";
import { base, save, api } from "@/lib/client";
import { Brand } from "./brand";
import { Modal, Field, Empty } from "./ui";
import { Projects } from "./projects";
import { Ideas } from "./ideas";
import { LibraryPanel } from "./library";
const WritingEditor = dynamic(
  () => import("./writing-editor").then((m) => m.WritingEditor),
  { loading: () => <p role="status">Loading creative tools…</p> },
);
const Toolkit = dynamic(() => import("./toolkit").then((m) => m.Toolkit), {
  loading: () => <p role="status">Loading creative tools…</p>,
});
import { SettingsPanel } from "./settings";
const ChordLab = dynamic(() => import("./chord-lab").then((m) => m.ChordLab), {
  loading: () => <p role="status">Loading creative tools…</p>,
});
const navigation = [
  ["Dashboard", LayoutDashboard],
  ["My Projects", FolderOpen],
  ["Writing Studio", Feather],
  ["Creative Toolkit", WandSparkles],
  ["Chord Lab", Music2],
  ["Idea Vault", Lightbulb],
  ["Library", Library],
  ["Settings", Settings],
] as const;
export function Workspace({
  artist,
  demo,
  initialView = "Dashboard",
}: {
  artist: Artist;
  demo: boolean;
  initialView?: string;
}) {
  const [active, setActive] = useState(initialView),
    [data, setData] = useState<WorkspaceData>({
      ...emptyRecords(),
      preferences: { theme: "dark", collapsed: false },
    }),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [editing, setEditing] = useState<Piece | null>(null),
    [create, setCreate] = useState<"song" | "poem" | null>(null),
    [template, setTemplate] = useState("Verse / Chorus"),
    [title, setTitle] = useState(""),
    [newProject, setNewProject] = useState(""),
    [query, setQuery] = useState(""),
    [projectIntent, setProjectIntent] = useState(false),
    [ideaIntent, setIdeaIntent] = useState(false);
  const name = artist.preferred_name || artist.full_name.split(" ")[0];
  const reload = useCallback(async () => {
    try {
      const r = await fetch("/api/workspace", { cache: "no-store" });
      const result = await r.json();
      if (!r.ok) throw Error(result.error);
      setData(result);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void reload();
  }, [reload]);
  async function put<T extends { id: string }>(resource: Resource, value: T) {
    try {
      const result = await save(resource, value);
      setData((d) => ({
        ...d,
        [resource]: [
          ...(d[resource] as { id: string }[]).filter(
            (x) => x.id !== result.id,
          ),
          result,
        ],
      }));
      return result;
    } catch (e) {
      setError((e as Error).message);
      throw e;
    }
  }
  async function remove(resource: Resource, id: string) {
    try {
      await api({ action: "delete", resource, id });
      await reload();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function prefs(value: WorkspaceData["preferences"]) {
    setData((d) => ({ ...d, preferences: value }));
    try {
      await api({ action: "preferences", ...value });
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function navigate(label: string) {
    if (
      editing &&
      !confirm(
        "Leave the editor? Unsaved text has a local recovery copy; wait for Saved before leaving.",
      )
    )
      return;
    if (label === "Chord Lab" && initialView !== "Chord Lab") {
      window.location.assign("/studio/chords");
      return;
    }
    if (initialView === "Chord Lab" && label !== "Chord Lab") {
      window.location.assign("/studio?view=" + encodeURIComponent(label));
      return;
    }
    setActive(label);
    setEditing(null);
    setQuery("");
    setProjectIntent(false);
    setIdeaIntent(false);
  }
  function newWriting(kind: "song" | "poem") {
    setCreate(kind);
    setTemplate(kind === "song" ? "Verse / Chorus" : "Free verse");
    setTitle("");
  }
  async function makePiece(
    kind: "song" | "poem",
    title: string,
    names: string[],
    content = "",
    project: string | null = null,
  ) {
    const piece: Piece = {
      ...base(artist.id),
      title: title || "Untitled " + kind,
      kind,
      project_id: project,
      status: "ideas",
      sections: names.map((name, i) => ({
        id: crypto.randomUUID(),
        name,
        content: i === 0 ? content : "",
      })),
      revision: 0,
      pinned: false,
      archived: false,
    };
    const saved = await put("writing_pieces", piece);
    setEditing(saved);
    setActive("Writing Studio");
    setCreate(null);
  }
  async function capture(text: string) {
    const idea: Idea = {
      ...base(artist.id),
      title: "Writing prompt",
      body: text,
      type: "Personal note",
      tags: [],
      collection: "Creative Toolkit",
      project_id: null,
      favorite: false,
      archived: false,
    };
    await put("ideas", idea);
    setError("Idea saved to your vault.");
  }
  const foundPieces = data.writing_pieces.filter((p) =>
    `${p.title} ${p.sections.map((s) => s.content).join(" ")}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const foundIdeas = data.ideas.filter((i) =>
    `${i.title} ${i.body} ${i.tags.join(" ")}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const foundProjects = data.projects.filter((p) =>
    `${p.title} ${p.description}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div
      className={`app-shell ${data.preferences.theme === "light" ? "light" : ""} ${data.preferences.collapsed ? "collapsed" : ""} ${editing ? "has-editor" : ""}`}
    >
      <aside className="sidebar">
        <Brand href="/studio" />
        <button
          className="sidebar-toggle icon-button"
          onClick={() =>
            void prefs({
              ...data.preferences,
              collapsed: !data.preferences.collapsed,
            })
          }
          aria-label="Toggle navigation"
        >
          <PanelLeftClose size={18} />
        </button>
        <div className="workspace-label">YOUR WORKSPACE</div>
        <nav>
          {navigation.map(([label, Icon]) => (
            <button
              key={label}
              title={label}
              onClick={() => navigate(label)}
              className={active === label ? "nav-item selected" : "nav-item"}
            >
              <Icon size={19} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <p>
            A free creative tool by
            <br />
            <strong>SIRIUS Entertainment</strong>
          </p>
          <div className="profile">
            <span className="avatar">{name.slice(0, 1).toUpperCase()}</span>
            <span>
              {name}
              <small>Artist workspace</small>
            </span>
          </div>
        </div>
      </aside>
      <main className="workspace-main">
        <header className="app-header">
          <span>
            MY STUDIO <span className="slash">/</span> {active}
          </span>
          <div>
            <span className="free-pill">FREE FOR ARTISTS</span>
            <button
              className="icon-button"
              onClick={() =>
                void prefs({
                  ...data.preferences,
                  theme: data.preferences.theme === "dark" ? "light" : "dark",
                })
              }
              aria-label="Toggle light mode"
            >
              {data.preferences.theme === "light" ? (
                <Moon size={18} />
              ) : (
                <Sun size={18} />
              )}
            </button>
          </div>
        </header>
        {demo && (
          <div className="demo-banner">
            LOCAL DEVELOPMENT · Data saved on this server · Use test contact
            details
          </div>
        )}
        <div className="page-content">
          {!editing && (
            <div className="global-search">
              <Search size={15} />
              <input
                aria-label="Search entire workspace"
                placeholder="Search your whole studio…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button
                  className="icon-button"
                  aria-label="Clear search"
                  onClick={() => setQuery("")}
                >
                  ×
                </button>
              )}
            </div>
          )}
          {error && (
            <div className="notice" role="status">
              {error}
              <button
                className="icon-button"
                onClick={() => setError("")}
                aria-label="Dismiss message"
              >
                ×
              </button>
            </div>
          )}
          {loading ? (
            <p role="status">Opening your studio…</p>
          ) : query ? (
            <section>
              <h1>Search results</h1>
              {foundProjects.map((p) => (
                <button
                  className="list-row"
                  key={p.id}
                  onClick={() => {
                    setQuery("");
                    setActive("My Projects");
                  }}
                >
                  <span className="tag">Project</span>
                  {p.title}
                </button>
              ))}
              {foundPieces.map((p) => (
                <button
                  className="list-row"
                  key={p.id}
                  onClick={() => {
                    setQuery("");
                    setEditing(p);
                    setActive("Writing Studio");
                  }}
                >
                  <span className="tag">{p.kind}</span>
                  {p.title}
                </button>
              ))}
              {foundIdeas.map((i) => (
                <button
                  className="list-row"
                  key={i.id}
                  onClick={() => {
                    setQuery("");
                    setActive("Idea Vault");
                  }}
                >
                  <span className="tag">Idea</span>
                  {i.title || i.body.slice(0, 70)}
                </button>
              ))}
              {!foundProjects.length &&
                !foundPieces.length &&
                !foundIdeas.length && (
                  <Empty
                    title="No matches yet."
                    body="Try another word or phrase."
                  />
                )}
            </section>
          ) : editing ? (
            <WritingEditor
              key={editing.id}
              piece={editing}
              artistId={artist.id}
              projects={data.projects}
              versions={data.draft_versions}
              onSaved={(p) =>
                setData((d) => ({
                  ...d,
                  writing_pieces: [
                    ...d.writing_pieces.filter((x) => x.id !== p.id),
                    p,
                  ],
                }))
              }
              onReload={reload}
              onBack={() => {
                setEditing(null);
                setActive("Library");
                void reload();
              }}
              onFavorite={async (w) => {
                await put("saved_words", w);
              }}
              onCapture={(text) => void capture(text)}
            />
          ) : active === "Dashboard" ? (
            <>
              <div className="dashboard-heading">
                <div className="eyebrow">
                  A LITTLE SPACE. A WORLD OF POSSIBILITIES.
                </div>
                <h1>
                  Welcome back, <i>{name}.</i>
                </h1>
                <p>Your next great idea has a place here.</p>
              </div>
              <section className="studio-hero">
                <div>
                  <span className="eyebrow">YOUR WORDS. YOUR OWN WAY.</span>
                  <h2>
                    There’s something
                    <br />
                    only you can write.
                  </h2>
                  <p>
                    Gather the fragments. Find the connections.
                    <br />
                    Bring your work to life.
                  </p>
                  <button
                    className="text-button"
                    onClick={() => newWriting("song")}
                  >
                    Start writing <ArrowRight size={16} />
                  </button>
                </div>
                <div className="hero-art" aria-hidden="true">
                  <div className="orbit one" />
                  <div className="orbit two" />
                  <Feather size={72} strokeWidth={0.8} />
                  <span>BEGIN ANYWHERE.</span>
                </div>
              </section>
              <div className="quick-actions">
                <button
                  className="secondary"
                  onClick={() => newWriting("song")}
                >
                  <Plus size={15} />
                  New song
                </button>
                <button
                  className="secondary"
                  onClick={() => newWriting("poem")}
                >
                  New poem
                </button>
                <button
                  className="secondary"
                  onClick={() => {
                    setProjectIntent(true);
                    setActive("My Projects");
                  }}
                >
                  New project
                </button>
                <button
                  className="secondary"
                  onClick={() => {
                    setIdeaIntent(true);
                    setActive("Idea Vault");
                  }}
                >
                  Capture idea
                </button>
                <button
                  className="secondary"
                  onClick={() => navigate("Chord Lab")}
                >
                  <Music2 size={15} />
                  Chord Lab
                </button>
              </div>
              <div className="stats-grid">
                {[
                  [
                    "Active projects",
                    data.projects.filter(
                      (p) => !p.archived && p.status !== "completed",
                    ).length,
                  ],
                  [
                    "Writing pieces",
                    data.writing_pieces.filter((p) => !p.archived).length,
                  ],
                  ["Saved ideas", data.ideas.filter((i) => !i.archived).length],
                  [
                    "Completed projects",
                    data.projects.filter((p) => p.status === "completed")
                      .length,
                  ],
                ].map(([label, value]) => (
                  <div className="stat-card" key={String(label)}>
                    <strong>{value}</strong>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              <div className="dashboard-lower">
                <section className="empty-card">
                  <div className="section-title">
                    <h2>Recently edited writing</h2>
                    <Feather size={18} />
                  </div>
                  {data.writing_pieces
                    .filter((p) => !p.archived)
                    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
                    .slice(0, 5)
                    .map((p) => (
                      <button
                        className="list-row"
                        key={p.id}
                        onClick={() => {
                          setEditing(p);
                          setActive("Writing Studio");
                        }}
                      >
                        <strong>{p.title}</strong>
                        <span className="tag">{p.kind}</span>
                        {p.pinned && <span>✧</span>}
                      </button>
                    ))}
                  {!data.writing_pieces.length && (
                    <Empty
                      title="A blank page is a beginning."
                      body="Start a song or poem. Your saved writing will appear here."
                    />
                  )}
                </section>
                <section className="empty-card">
                  <div className="section-title">
                    <h2>On your horizon</h2>
                    <span className="tag">TASKS</span>
                  </div>
                  {data.tasks
                    .filter((t) => !t.completed)
                    .sort((a, b) =>
                      (a.due_date || "z").localeCompare(b.due_date || "z"),
                    )
                    .slice(0, 5)
                    .map((t) => (
                      <div className="task-row" key={t.id}>
                        <input
                          type="checkbox"
                          aria-label={`Complete ${t.title}`}
                          checked={false}
                          onChange={() =>
                            void put("tasks", { ...t, completed: true })
                          }
                        />
                        <span>{t.title}</span>
                        <small>{t.due_date}</small>
                      </div>
                    ))}
                  {!data.tasks.some((t) => !t.completed) && (
                    <Empty
                      title="Make your next step a small one."
                      body="Create a task in My Projects to plan your next session."
                    />
                  )}
                </section>
              </div>
              {data.writing_pieces.some((p) => p.pinned && !p.archived) && (
                <section className="task-section">
                  <h2>Pinned drafts</h2>
                  <div className="tag-row">
                    {data.writing_pieces
                      .filter((p) => p.pinned && !p.archived)
                      .map((p) => (
                        <button
                          className="secondary"
                          key={p.id}
                          onClick={() => {
                            setEditing(p);
                            setActive("Writing Studio");
                          }}
                        >
                          {p.title}
                        </button>
                      ))}
                  </div>
                </section>
              )}
            </>
          ) : active === "My Projects" ? (
            <Projects
              initialCreate={projectIntent}
              artistId={artist.id}
              projects={data.projects}
              tasks={data.tasks}
              onSave={async (p) => {
                await put("projects", p);
              }}
              onDelete={(id) => remove("projects", id)}
              onTask={async (t) => {
                await put("tasks", t);
              }}
              onTaskDelete={(id) => remove("tasks", id)}
            />
          ) : active === "Idea Vault" ? (
            <Ideas
              initialCreate={ideaIntent}
              artistId={artist.id}
              ideas={data.ideas}
              projects={data.projects}
              onSave={async (i) => {
                await put("ideas", i);
              }}
              onDelete={(id) => remove("ideas", id)}
              onConvert={(i, kind) =>
                makePiece(
                  kind,
                  i.title || i.body.slice(0, 60),
                  [kind === "song" ? "Verse 1" : "Stanza 1"],
                  i.body,
                  i.project_id,
                )
              }
            />
          ) : active === "Creative Toolkit" ? (
            <Toolkit
              artistId={artist.id}
              onFavorite={async (w) => {
                await put("saved_words", w);
              }}
              onCapture={(text) => void capture(text)}
            />
          ) : active === "Chord Lab" ? (
            <ChordLab
              artistId={artist.id}
              progressions={data.chord_progressions}
              projects={data.projects}
              onSave={async (p) => {
                await put("chord_progressions", p);
              }}
              onDelete={(id) => remove("chord_progressions", id)}
            />
          ) : active === "Settings" ? (
            <SettingsPanel
              artist={artist}
              onUpdated={() => window.location.reload()}
            />
          ) : (
            <LibraryPanel
              artistId={artist.id}
              data={data}
              onOpen={(p) => {
                setEditing(p);
                setActive("Writing Studio");
              }}
              onCreate={() => newWriting("song")}
              onSave={async (p) => {
                await put("writing_pieces", p);
              }}
              onDelete={(id) =>
                id.startsWith("word:")
                  ? remove("saved_words", id.slice(5))
                  : remove("writing_pieces", id)
              }
              onUnarchive={async (p) => {
                await put("projects", p);
              }}
              onIdea={async (i) => {
                await put("ideas", i);
              }}
            />
          )}
          <footer className="studio-footer">
            <span>YOUR WORDS. YOUR VISION. YOUR CREATIVE PROCESS.</span>
            <span>SIRIUS Writers Studio</span>
          </footer>
        </div>
      </main>
      {create && (
        <Modal title={`New ${create}`} onClose={() => setCreate(null)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await makePiece(
                  create,
                  title,
                  templates[template],
                  "",
                  newProject || null,
                );
              } catch {}
            }}
          >
            <Field label="Writing title">
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
              />
            </Field>
            <div className="segmented">
              <button
                type="button"
                className={create === "song" ? "active" : ""}
                onClick={() => {
                  setCreate("song");
                  setTemplate("Verse / Chorus");
                }}
              >
                Song
              </button>
              <button
                type="button"
                className={create === "poem" ? "active" : ""}
                onClick={() => {
                  setCreate("poem");
                  setTemplate("Free verse");
                }}
              >
                Poem
              </button>
            </div>
            <Field label="Template">
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
              >
                {Object.keys(templates)
                  .filter((t) =>
                    create === "song"
                      ? [
                          "Verse / Chorus",
                          "Full song",
                          "Rap & hook",
                          "Storytelling",
                          "Freeform song",
                          "Custom",
                        ].includes(t)
                      : [
                          "Free verse",
                          "Sonnet",
                          "Haiku",
                          "Spoken word",
                          "Narrative poetry",
                          "Custom",
                        ].includes(t),
                  )
                  .map((t) => (
                    <option key={t}>{t}</option>
                  ))}
              </select>
            </Field>
            <Field label="Project">
              <select
                value={newProject}
                onChange={(e) => setNewProject(e.target.value)}
              >
                <option value="">No project</option>
                {data.projects
                  .filter((p) => !p.archived)
                  .map((p) => (
                    <option value={p.id} key={p.id}>
                      {p.title}
                    </option>
                  ))}
              </select>
            </Field>
            <button className="primary">Open writing canvas</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
