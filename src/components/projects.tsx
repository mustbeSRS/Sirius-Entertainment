"use client";
import { useState, useEffect } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  FolderOpen,
  Plus,
  GripVertical,
  Trash2,
  CalendarDays,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { stageLabels, stages, type Project, type Task } from "@/lib/models";
import { base } from "@/lib/client";
import { Modal, Field, Empty, tags } from "./ui";
import { CreativeCalendar } from "./calendar";
type Props = {
  initialCreate?: boolean;
  artistId: string;
  projects: Project[];
  tasks: Task[];
  onSave: (p: Project) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onTask: (task: Task) => Promise<void>;
  onTaskDelete: (id: string) => Promise<void>;
};
function Card({
  project,
  onEdit,
  onSave,
  onMove,
}: {
  project: Project;
  onEdit: () => void;
  onSave: (p: Project) => Promise<void>;
  onMove: (direction: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: project.id,
  });
  return (
    <article
      ref={setNodeRef}
      style={{
        transform: transform
          ? `translate3d(${transform.x}px,${transform.y}px,0)`
          : undefined,
        borderTopColor: project.color,
      }}
      className="project-card"
    >
      <div className="row between">
        <span className="tag">{project.type}</span>
        <button
          {...attributes}
          {...listeners}
          className="icon-button drag-handle"
          aria-label={`Move ${project.title}`}
        >
          <GripVertical size={16} />
        </button>
      </div>
      <button className="title-button" onClick={onEdit}>
        {project.title}
      </button>
      <p>{project.description || "A space for what comes next."}</p>
      <div className="tag-row">
        {project.tags.map((t) => (
          <span className="tag" key={t}>
            {t}
          </span>
        ))}
      </div>
      {project.deadline && (
        <small>
          <CalendarDays size={12} /> {project.deadline}
        </small>
      )}
      <label className="sr-only" htmlFor={`status-${project.id}`}>
        Status for {project.title}
      </label>
      <div className="row">
        <button
          className="icon-button"
          aria-label={`Move ${project.title} earlier`}
          onClick={() => onMove(-1)}
        >
          <ChevronUp size={14} />
        </button>
        <button
          className="icon-button"
          aria-label={`Move ${project.title} later`}
          onClick={() => onMove(1)}
        >
          <ChevronDown size={14} />
        </button>
      </div>
      <select
        id={`status-${project.id}`}
        value={project.status}
        onChange={(e) =>
          void onSave({
            ...project,
            status: e.target.value as Project["status"],
          })
        }
      >
        {stages.map((s, i) => (
          <option key={s} value={s}>
            {stageLabels[i]}
          </option>
        ))}
      </select>
    </article>
  );
}
function Column({
  stage,
  children,
}: {
  stage: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <div
      ref={setNodeRef}
      className={`kanban-column ${isOver ? "drop-over" : ""}`}
    >
      <h3>{stageLabels[stages.indexOf(stage as Project["status"])]}</h3>
      {children}
    </div>
  );
}
export function Projects({
  initialCreate = false,
  artistId,
  projects,
  tasks,
  onSave,
  onDelete,
  onTask,
  onTaskDelete,
}: Props) {
  const [view, setView] = useState<"board" | "list" | "calendar">("board"),
    [query, setQuery] = useState(""),
    [editing, setEditing] = useState<Project | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [filter, setFilter] = useState("all"),
    [sort, setSort] = useState("updated");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );
  const filtered = projects
    .filter(
      (p) =>
        !p.archived &&
        `${p.title} ${p.tags.join(" ")} ${p.description}`
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (filter === "all" || p.status === filter),
    )
    .sort((a, b) =>
      sort === "title"
        ? a.title.localeCompare(b.title)
        : b.updated_at.localeCompare(a.updated_at),
    );
  function create() {
    setEditing({
      ...base(artistId),
      title: "",
      description: "",
      type: "Song",
      status: "ideas",
      position: projects.length,
      color: "#9b36df",
      tags: [],
      deadline: "",
      archived: false,
    });
  }
  useEffect(() => {
    if (initialCreate) create();
  }, []);
  async function drop(e: DragEndEvent) {
    if (!e.over) return;
    const p = projects.find((p) => p.id === e.active.id);
    const target = String(e.over.id);
    if (p && stages.includes(target as Project["status"]))
      try {
        await onSave({
          ...p,
          status: target as Project["status"],
          position: Date.now(),
        });
      } catch (e) {
        setError((e as Error).message);
      }
  }
  return (
    <>
      <div className="page-title-row">
        <div>
          <div className="eyebrow">GIVE YOUR IDEAS A DIRECTION</div>
          <h1>My Projects</h1>
          <p>From the first spark to the final release.</p>
        </div>
        <button className="primary compact" onClick={create}>
          <Plus size={16} />
          New project
        </button>
      </div>
      <div className="controls">
        <input
          aria-label="Search projects"
          placeholder="Search projects…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label="Filter project status"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All stages</option>
          {stages.map((s, i) => (
            <option value={s} key={s}>
              {stageLabels[i]}
            </option>
          ))}
        </select>
        <select
          aria-label="Sort projects"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="updated">Recently edited</option>
          <option value="title">Title</option>
        </select>
        <div className="segmented">
          {(["board", "list", "calendar"] as const).map((v) => (
            <button
              key={v}
              className={view === v ? "active" : ""}
              onClick={() => setView(v)}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {view === "board" ? (
        <DndContext sensors={sensors} onDragEnd={drop}>
          <div className="kanban">
            {stages.map((stage) => (
              <Column stage={stage} key={stage}>
                {filtered
                  .filter((p) => p.status === stage)
                  .sort((a, b) => a.position - b.position)
                  .map((p) => (
                    <Card
                      key={p.id}
                      project={p}
                      onSave={onSave}
                      onMove={(direction) => {
                        void (async () => {
                          const rows = projects
                            .filter((x) => x.status === p.status)
                            .sort((a, b) => a.position - b.position);
                          const from = rows.findIndex((x) => x.id === p.id),
                            to = from + direction;
                          if (to < 0 || to >= rows.length) return;
                          [rows[from], rows[to]] = [rows[to], rows[from]];
                          for (const [position, row] of rows.entries())
                            await onSave({ ...row, position });
                        })();
                      }}
                      onEdit={() => setEditing(p)}
                    />
                  ))}
              </Column>
            ))}
          </div>
        </DndContext>
      ) : view === "list" ? (
        <div className="content-list">
          {filtered.map((p) => (
            <button
              className="list-row"
              onClick={() => setEditing(p)}
              key={p.id}
            >
              <FolderOpen size={18} />
              <strong>{p.title}</strong>
              <span>{p.type}</span>
              <span>{stageLabels[stages.indexOf(p.status)]}</span>
              <span>{p.deadline || "No deadline"}</span>
            </button>
          ))}
        </div>
      ) : (
        <CreativeCalendar
          events={[
            ...filtered
              .filter((p) => p.deadline)
              .map((p) => ({
                date: p.deadline,
                title: p.title,
                id: p.id,
                type: "project",
              })),
            ...tasks
              .filter((t) => t.due_date && !t.completed)
              .map((t) => ({
                date: t.due_date,
                title: t.title,
                id: t.id,
                type: "task",
              })),
          ]}
        />
      )}
      {!filtered.length && view !== "calendar" && (
        <Empty
          title="Start with a possibility."
          body="Create a song, EP, album, poetry collection, or another writing project."
        />
      )}
      <TaskList
        artistId={artistId}
        tasks={tasks}
        projects={projects}
        onSave={onTask}
        onDelete={onTaskDelete}
      />
      {editing && (
        <Modal
          title={editing.title ? "Edit project" : "New project"}
          onClose={() => setEditing(null)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                await onSave(editing);
                setEditing(null);
              } catch (e) {
                setError((e as Error).message);
              }
              setBusy(false);
            }}
          >
            <Field label="Project title">
              <input
                required
                value={editing.title}
                maxLength={200}
                onChange={(e) =>
                  setEditing({ ...editing, title: e.target.value })
                }
              />
            </Field>
            <Field label="Description">
              <textarea
                value={editing.description}
                onChange={(e) =>
                  setEditing({ ...editing, description: e.target.value })
                }
              />
            </Field>
            <div className="form-grid">
              <Field label="Project type">
                <select
                  value={editing.type}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      type: e.target.value as Project["type"],
                    })
                  }
                >
                  {[
                    "Song",
                    "EP",
                    "Album",
                    "Poetry collection",
                    "Spoken word",
                    "Writing collection",
                  ].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Field>
              <Field label="Deadline">
                <input
                  type="date"
                  value={editing.deadline}
                  onChange={(e) =>
                    setEditing({ ...editing, deadline: e.target.value })
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
            <Field label="Project color">
              <input
                type="color"
                value={editing.color}
                onChange={(e) =>
                  setEditing({ ...editing, color: e.target.value })
                }
              />
            </Field>
            <div className="row between">
              <button className="primary compact" disabled={busy}>
                Save project
              </button>
              {projects.some((p) => p.id === editing.id) && (
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
                    className="danger icon-button"
                    aria-label="Delete project"
                    onClick={async () => {
                      if (
                        confirm(
                          "Delete this project? Writing, ideas, and tasks will remain, without a project association.",
                        )
                      ) {
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
          </form>
        </Modal>
      )}
    </>
  );
}
export function TaskList({
  artistId,
  tasks,
  projects,
  onSave,
  onDelete,
}: {
  artistId: string;
  tasks: Task[];
  projects: Project[];
  onSave: (t: Task) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState<Task | null>(null),
    [error, setError] = useState("");
  return (
    <section className="task-section">
      <div className="section-title">
        <h2>Your next steps</h2>
        <button
          className="secondary"
          onClick={() =>
            setEditing({
              ...base(artistId),
              title: "",
              project_id: null,
              due_date: "",
              priority: "medium",
              completed: false,
              checklist: [],
            })
          }
        >
          <Plus size={14} />
          Task
        </button>
      </div>
      {tasks.map((t) => (
        <div className="task-row" key={t.id}>
          <input
            type="checkbox"
            aria-label={`Complete ${t.title}`}
            checked={t.completed}
            onChange={(e) => void onSave({ ...t, completed: e.target.checked })}
          />
          <button
            className={`title-button ${t.completed ? "done" : ""}`}
            onClick={() => setEditing(t)}
          >
            {t.title}
          </button>
          <span className="tag">{t.priority}</span>
          <span>{t.due_date}</span>
          <small>
            {t.checklist.length
              ? `${t.checklist.filter((c) => c.done).length}/${t.checklist.length}`
              : ""}
          </small>
        </div>
      ))}
      {!tasks.length && (
        <p>
          No tasks yet. Give your next creative session a small, achievable
          goal.
        </p>
      )}
      {editing && (
        <Modal title="Task details" onClose={() => setEditing(null)}>
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
            <Field label="Task title">
              <input
                value={editing.title}
                required
                onChange={(e) =>
                  setEditing({ ...editing, title: e.target.value })
                }
              />
            </Field>
            <div className="form-grid">
              <Field label="Due date">
                <input
                  type="date"
                  value={editing.due_date}
                  onChange={(e) =>
                    setEditing({ ...editing, due_date: e.target.value })
                  }
                />
              </Field>
              <Field label="Priority">
                <select
                  value={editing.priority}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      priority: e.target.value as Task["priority"],
                    })
                  }
                >
                  {["low", "medium", "high"].map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Project">
              <select
                value={editing.project_id || ""}
                onChange={(e) =>
                  setEditing({ ...editing, project_id: e.target.value || null })
                }
              >
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </Field>
            <h3>Checklist</h3>
            {editing.checklist.map((c) => (
              <div className="row" key={c.id}>
                <input
                  type="checkbox"
                  checked={c.done}
                  aria-label={`Complete ${c.text}`}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      checklist: editing.checklist.map((x) =>
                        x.id === c.id ? { ...x, done: e.target.checked } : x,
                      ),
                    })
                  }
                />
                <input
                  aria-label="Checklist item"
                  value={c.text}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      checklist: editing.checklist.map((x) =>
                        x.id === c.id ? { ...x, text: e.target.value } : x,
                      ),
                    })
                  }
                />
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Remove checklist item"
                  onClick={() =>
                    setEditing({
                      ...editing,
                      checklist: editing.checklist.filter((x) => x.id !== c.id),
                    })
                  }
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              className="secondary"
              onClick={() =>
                setEditing({
                  ...editing,
                  checklist: [
                    ...editing.checklist,
                    { id: crypto.randomUUID(), text: "New step", done: false },
                  ],
                })
              }
            >
              Add checklist item
            </button>
            <div className="row between form-actions">
              <button className="primary compact">Save task</button>
              {onDelete && tasks.some((t) => t.id === editing.id) && (
                <button
                  type="button"
                  className="danger secondary"
                  onClick={async () => {
                    if (confirm("Delete this task?")) {
                      await onDelete(editing.id);
                      setEditing(null);
                    }
                  }}
                >
                  Delete task
                </button>
              )}
            </div>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
          </form>
        </Modal>
      )}
    </section>
  );
}
