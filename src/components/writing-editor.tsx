"use client";
import { useEffect, useRef, useState } from "react";
import {
  useEditor,
  EditorContent,
  type Editor,
  type JSONContent,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Bold,
  Italic,
  Undo2,
  Redo2,
  Plus,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Trash2,
  PanelRightClose,
  Maximize,
  Minimize,
  Download,
  History,
  Save,
  Copy,
  ArrowLeft,
} from "lucide-react";
import { api, base, save, download } from "@/lib/client";
import {
  pieceText,
  stages,
  stageLabels,
  type Piece,
  type Section,
  type Project,
  type SavedWord,
  type Version,
} from "@/lib/models";
import { Toolkit } from "./toolkit";
import { Modal, Field } from "./ui";
function paragraphs(text: string) {
  return {
    type: "doc",
    content: text.split("\n").map((line) => ({
      type: "paragraph",
      content: line ? [{ type: "text", text: line }] : [],
    })),
  };
}
function SectionEditor({
  section,
  onChange,
  onActive,
  onSelect,
  move,
  remove,
}: {
  section: Section;
  onChange: (s: Section) => void;
  onActive: (e: Editor) => void;
  onSelect: (t: string) => void;
  move: (direction: number) => void;
  remove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: section.id });
  const current = useRef(section);
  current.current = section;
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Let the words find their way…" }),
    ],
    content: (section.richtext as JSONContent) || paragraphs(section.content),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": `Writing section ${section.name}`,
        class: "lyric-prose",
      },
    },
    onUpdate: ({ editor }) =>
      onChange({
        ...current.current,
        content: editor.getText({ blockSeparator: "\n" }),
        richtext: JSON.parse(JSON.stringify(editor.getJSON())),
      }),
    onFocus: ({ editor }) => onActive(editor),
    onSelectionUpdate: ({ editor }) => {
      onActive(editor);
      const { from, to } = editor.state.selection;
      if (from !== to) onSelect(editor.state.doc.textBetween(from, to, " "));
    },
  });
  useEffect(() => {
    if (
      editor &&
      (editor.getText({ blockSeparator: "\n" }) !== section.content ||
        (section.richtext &&
          JSON.stringify(editor.getJSON()) !==
            JSON.stringify(section.richtext)))
    )
      editor.commands.setContent(
        (section.richtext as JSONContent) || paragraphs(section.content),
        { emitUpdate: false },
      );
  }, [section.content, section.richtext, editor]);
  return (
    <section
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="writing-section"
    >
      <div className="section-controls">
        <button
          className="icon-button drag-handle"
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${section.name}`}
        >
          <GripVertical size={15} />
        </button>
        <input
          className="section-name"
          aria-label="Section name"
          value={section.name}
          onChange={(e) =>
            onChange({ ...section, name: e.target.value || "Untitled section" })
          }
        />
        <button
          className="icon-button"
          aria-label={`Move ${section.name} up`}
          onClick={() => move(-1)}
        >
          <ChevronUp size={14} />
        </button>
        <button
          className="icon-button"
          aria-label={`Move ${section.name} down`}
          onClick={() => move(1)}
        >
          <ChevronDown size={14} />
        </button>
        <button
          className="icon-button"
          aria-label={`Delete ${section.name}`}
          onClick={remove}
        >
          <Trash2 size={14} />
        </button>
      </div>
      <EditorContent editor={editor} />
    </section>
  );
}
export function WritingEditor({
  piece,
  artistId,
  projects,
  versions,
  onSaved,
  onReload,
  onBack,
  onFavorite,
  onCapture,
}: {
  piece: Piece;
  artistId: string;
  projects: Project[];
  versions: Version[];
  onSaved: (p: Piece) => void;
  onReload: () => Promise<void>;
  onBack: () => void;
  onFavorite: (w: SavedWord) => Promise<void>;
  onCapture: (text: string) => void;
}) {
  const [doc, setDoc] = useState(piece),
    [status, setStatus] = useState("Saved"),
    [dirty, setDirty] = useState(false),
    [tick, setTick] = useState(0),
    [focus, setFocus] = useState(false),
    [tools, setTools] = useState(true),
    [selected, setSelected] = useState(""),
    [history, setHistory] = useState(false),
    [snapshotName, setSnapshotName] = useState(""),
    [preview, setPreview] = useState<Version | null>(null),
    [recovery, setRecovery] = useState<Piece | null>(null),
    [search, setSearch] = useState(""),
    [error, setError] = useState("");
  const latest = useRef(doc),
    revision = useRef(piece.revision),
    lastPersisted = useRef(JSON.stringify(piece)),
    inFlight = useRef<Promise<boolean> | null>(null),
    active = useRef<Editor | null>(null),
    mounted = useRef(true),
    blocked = useRef(false);
  latest.current = doc;
  const recoveryKey = `sirius-recovery:${artistId}:${piece.id}`;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  useEffect(() => {
    mounted.current = true;
    if (window.matchMedia("(max-width:760px)").matches) setTools(false);
    try {
      const saved = localStorage.getItem(recoveryKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed.title !== piece.title ||
          JSON.stringify(parsed.sections) !== JSON.stringify(piece.sections)
        )
          setRecovery(parsed);
      }
    } catch {}
    return () => {
      mounted.current = false;
    };
  }, [recoveryKey, piece.id]);
  function change(next: Piece) {
    latest.current = next;
    setDoc(next);
    setDirty(true);
    blocked.current = false;
    try {
      localStorage.setItem(recoveryKey, JSON.stringify(next));
    } catch {
      setError(
        "Local recovery storage is unavailable. Keep this tab open until the server save succeeds.",
      );
    }
  }
  async function persist(): Promise<boolean> {
    if (inFlight.current) return inFlight.current;
    const current = latest.current;
    const serial = JSON.stringify(current);
    setStatus("Saving…");
    const task = (async () => {
      try {
        const result = await save("writing_pieces", {
          ...current,
          revision: revision.current,
        });
        revision.current = result.revision;
        lastPersisted.current = serial;
        onSaved(result);
        if (mounted.current) {
          if (JSON.stringify(latest.current) === serial) {
            setDirty(false);
            setStatus("Saved");
            try {
              localStorage.removeItem(recoveryKey);
            } catch {}
          } else {
            setStatus("Unsaved changes");
            setTick((t) => t + 1);
          }
        }
        return true;
      } catch (e) {
        blocked.current = true;
        if (mounted.current) {
          setStatus(
            (e as { status?: number }).status === 409
              ? "Conflict · local copy kept"
              : "Offline / save failed · local copy kept",
          );
          setError((e as Error).message);
        }
        return false;
      } finally {
        inFlight.current = null;
      }
    })();
    inFlight.current = task;
    return task;
  }
  useEffect(() => {
    if (!dirty || blocked.current) return;
    const timer = setTimeout(() => void persist(), 800);
    return () => clearTimeout(timer);
  }, [doc, dirty, tick]);
  useEffect(() => {
    const before = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", before);
    return () => window.removeEventListener("beforeunload", before);
  }, [dirty]);
  async function flushAll(): Promise<boolean> {
    while (lastPersisted.current !== JSON.stringify(latest.current)) {
      if (!(await persist())) return false;
    }
    return true;
  }
  async function back() {
    if (dirty && !(await flushAll())) {
      if (
        !confirm(
          "The server has not saved your changes. A recovery copy is stored in this browser. Leave the editor?",
        )
      )
        return;
    }
    onBack();
  }
  function updateSection(section: Section) {
    change({
      ...latest.current,
      sections: latest.current.sections.map((s) =>
        s.id === section.id ? section : s,
      ),
    });
  }
  function move(id: string, direction: number) {
    const current = latest.current;
    const index = current.sections.findIndex((s) => s.id === id),
      target = index + direction;
    if (target < 0 || target >= current.sections.length) return;
    change({
      ...current,
      sections: arrayMove(current.sections, index, target),
    });
  }
  function insert(text: string) {
    if (active.current && !active.current.isDestroyed) {
      active.current
        .chain()
        .focus()
        .insertContent({ type: "text", text })
        .run();
    } else {
      const first = latest.current.sections[0];
      updateSection({ ...first, content: first.content + text });
    }
  }
  async function duplicate() {
    const fresh = {
      ...latest.current,
      ...base(artistId),
      title: latest.current.title + " (copy)",
      revision: 0,
      sections: latest.current.sections.map((s) => ({
        ...s,
        id: crypto.randomUUID(),
      })),
    };
    const result = await save("writing_pieces", fresh);
    onSaved(result);
    setError("A separate copy was saved to your library.");
  }
  async function exportPiece(format: "txt" | "md" | "pdf") {
    const title =
      doc.title.replace(/[^a-z0-9 -]/gi, "").slice(0, 100) || "writing";
    if (format !== "pdf") {
      download(`${title}.${format}`, pieceText(doc, format === "md"));
      return;
    }
    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.TimesRoman);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    let page = pdf.addPage(),
      y = page.getHeight() - 60;
    const plain = (text: string) =>
      text
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, "'")
        .replace(/[—–]/g, "-")
        .replace(/[^\x20-\x7E\n]/g, "?");
    function line(text: string, size: number, isTitle = false) {
      const clean = plain(text);
      const words = clean.split(" ");
      let row = "";
      function draw(value: string) {
        if (y < 55) {
          page = pdf.addPage();
          y = page.getHeight() - 60;
        }
        page.drawText(value, {
          x: 50,
          y,
          size,
          font: isTitle ? bold : font,
          color: rgb(0.08, 0.04, 0.12),
        });
        y -= size * 1.5;
      }
      for (const word of words) {
        if (
          (isTitle ? bold : font).widthOfTextAtSize(
            (row + " " + word).trim(),
            size,
          ) > 490 &&
          row
        ) {
          draw(row);
          row = word;
        } else row = (row + " " + word).trim();
      }
      draw(row);
    }
    line(doc.title, 22, true);
    y -= 12;
    for (const s of doc.sections) {
      line(s.name, 12, true);
      for (const l of s.content.split("\n")) line(l, 12);
      y -= 16;
    }
    download(
      `${title}.pdf`,
      new Blob([new Uint8Array(await pdf.save())], { type: "application/pdf" }),
    );
  }
  const text = doc.sections.map((s) => s.content).join("\n"),
    words = (text.match(/\S+/g) || []).length,
    lines = text.split("\n").filter((l) => l.trim()).length;
  return (
    <div
      className={`editor-workspace ${focus ? "focus-mode" : ""} ${tools ? "" : "tools-hidden"}`}
    >
      <div className="editor-top">
        <button className="secondary" onClick={() => void back()}>
          <ArrowLeft size={14} />
          Library
        </button>
        <span className="save-status" role="status">
          {dirty && status === "Saved" ? "Unsaved changes" : status}
        </span>
        <button
          className="icon-button"
          aria-label="Save now"
          onClick={() => {
            blocked.current = false;
            void persist();
          }}
        >
          <Save size={17} />
        </button>
        <button
          className="icon-button"
          aria-label="Toggle focus mode"
          onClick={() => setFocus(!focus)}
        >
          {focus ? <Minimize size={17} /> : <Maximize size={17} />}
        </button>
        <button
          className="icon-button"
          aria-label="Toggle creative tools"
          onClick={() => setTools(!tools)}
        >
          <PanelRightClose size={17} />
        </button>
      </div>
      {error && (
        <div className="notice" role="alert">
          {error}
          <button className="text-button" onClick={() => void duplicate()}>
            Save local writing as a separate draft
          </button>
        </div>
      )}
      {recovery && (
        <div className="notice">
          <strong>A local recovery draft is available.</strong>
          <p>It differs from the server copy. Choose what to keep.</p>
          <div className="row">
            <button
              className="secondary"
              onClick={() => {
                change({ ...recovery, revision: revision.current });
                setRecovery(null);
              }}
            >
              Recover local changes
            </button>
            <button
              className="secondary"
              onClick={() => {
                download("recovered-draft.txt", pieceText(recovery));
              }}
            >
              Download local copy
            </button>
            <button
              className="secondary"
              onClick={() => {
                localStorage.removeItem(recoveryKey);
                setRecovery(null);
              }}
            >
              Keep server copy
            </button>
          </div>
        </div>
      )}
      <div className="editor-columns">
        <div className="editor-canvas">
          <input
            className="piece-title"
            aria-label="Writing title"
            maxLength={200}
            value={doc.title}
            onChange={(e) =>
              change({ ...doc, title: e.target.value || "Untitled" })
            }
          />
          <div className="editor-meta">
            <span className="tag">{doc.kind}</span>
            <select
              aria-label="Draft status"
              value={doc.status}
              onChange={(e) =>
                change({ ...doc, status: e.target.value as Piece["status"] })
              }
            >
              {stages.map((s, i) => (
                <option key={s} value={s}>
                  {stageLabels[i]}
                </option>
              ))}
            </select>
            <select
              aria-label="Writing project"
              value={doc.project_id || ""}
              onChange={(e) =>
                change({ ...doc, project_id: e.target.value || null })
              }
            >
              <option value="">No project</option>
              {projects.map((p) => (
                <option value={p.id} key={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
            <button
              className="secondary"
              onClick={() => change({ ...doc, pinned: !doc.pinned })}
            >
              {doc.pinned ? "Unpin" : "Pin"}
            </button>
          </div>
          <div className="editor-toolbar">
            <button
              className="icon-button"
              aria-label="Bold"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => active.current?.chain().focus().toggleBold().run()}
            >
              <Bold size={16} />
            </button>
            <button
              className="icon-button"
              aria-label="Italic"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() =>
                active.current?.chain().focus().toggleItalic().run()
              }
            >
              <Italic size={16} />
            </button>
            <button
              className="icon-button"
              aria-label="Undo"
              onClick={() => active.current?.chain().focus().undo().run()}
            >
              <Undo2 size={16} />
            </button>
            <button
              className="icon-button"
              aria-label="Redo"
              onClick={() => active.current?.chain().focus().redo().run()}
            >
              <Redo2 size={16} />
            </button>
            <span>
              {words} words · {lines} lines
            </span>
            <button
              className="icon-button"
              aria-label="Copy writing"
              onClick={() =>
                void navigator.clipboard
                  .writeText(pieceText(doc))
                  .then(() => setStatus("Copied"))
              }
            >
              <Copy size={16} />
            </button>
            <button
              className="icon-button"
              aria-label="Draft versions"
              onClick={() => setHistory(true)}
            >
              <History size={16} />
            </button>
          </div>
          <input
            aria-label="Search within draft"
            placeholder="Find in this draft…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <p className="search-result">
              {doc.sections
                .filter((s) =>
                  `${s.name} ${s.content}`
                    .toLowerCase()
                    .includes(search.toLowerCase()),
                )
                .map((s) => s.name)
                .join(" · ") || "No matches"}
            </p>
          )}
          <DndContext
            sensors={sensors}
            onDragEnd={(e: DragEndEvent) => {
              if (e.over && e.active.id !== e.over.id) {
                const current = latest.current;
                change({
                  ...current,
                  sections: arrayMove(
                    current.sections,
                    current.sections.findIndex((s) => s.id === e.active.id),
                    current.sections.findIndex((s) => s.id === e.over!.id),
                  ),
                });
              }
            }}
          >
            <SortableContext
              items={doc.sections.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {doc.sections.map((s) => (
                <SectionEditor
                  key={s.id}
                  section={s}
                  onChange={updateSection}
                  onActive={(e) => {
                    active.current = e;
                  }}
                  onSelect={setSelected}
                  move={(direction) => move(s.id, direction)}
                  remove={() => {
                    if (doc.sections.length === 1) {
                      setError("Keep at least one writing section.");
                      return;
                    }
                    if (
                      confirm(
                        `Delete “${s.name}” and its writing? Save a snapshot first if you may need it.`,
                      )
                    )
                      change({
                        ...doc,
                        sections: doc.sections.filter((x) => x.id !== s.id),
                      });
                  }}
                />
              ))}
            </SortableContext>
          </DndContext>
          <button
            className="secondary"
            onClick={() =>
              change({
                ...doc,
                sections: [
                  ...doc.sections,
                  {
                    id: crypto.randomUUID(),
                    name: `Section ${doc.sections.length + 1}`,
                    content: "",
                  },
                ],
              })
            }
          >
            <Plus size={15} />
            Add section
          </button>
          <div className="export-controls">
            <span>
              <Download size={15} /> Export
            </span>
            {(["txt", "md", "pdf"] as const).map((f) => (
              <button
                key={f}
                className="secondary"
                onClick={() =>
                  void exportPiece(f).catch((e) => setError(e.message))
                }
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
          <small>
            PDF uses standard Latin fonts; unsupported characters are replaced
            with “?”. TXT and Markdown preserve Unicode.
          </small>
        </div>
        {tools && (
          <aside className="editor-tool-panel">
            <button
              className="secondary mobile-tool-close"
              onClick={() => setTools(false)}
            >
              Close creative tools
            </button>
            <Toolkit
              artistId={artistId}
              compact
              selected={selected}
              onInsert={insert}
              onFavorite={onFavorite}
              onCapture={onCapture}
            />
          </aside>
        )}
      </div>
      {history && (
        <Modal title="Draft versions" onClose={() => setHistory(false)}>
          <form
            className="row"
            onSubmit={async (e) => {
              e.preventDefault();
              if (dirty && !(await flushAll())) return;
              await api({
                action: "snapshot",
                pieceId: piece.id,
                name: snapshotName || "Named snapshot",
              });
              setSnapshotName("");
              await onReload();
            }}
          >
            <Field label="Snapshot name">
              <input
                value={snapshotName}
                onChange={(e) => setSnapshotName(e.target.value)}
                maxLength={100}
                required
              />
            </Field>
            <button className="secondary">Save snapshot</button>
          </form>
          <p>
            Snapshots are manual. Restoring preserves the current version first.
          </p>
          {versions
            .filter((v) => v.piece_id === piece.id)
            .sort((a, b) => b.created_at.localeCompare(a.created_at))
            .map((v) => (
              <div className="list-row" key={v.id}>
                <button className="title-button" onClick={() => setPreview(v)}>
                  {v.name}
                </button>
                <small>{new Date(v.created_at).toLocaleString()}</small>
              </div>
            ))}
        </Modal>
      )}
      {preview && (
        <Modal title={preview.name} onClose={() => setPreview(null)}>
          <pre className="version-preview">{pieceText(preview)}</pre>
          <button
            className="primary compact"
            onClick={async () => {
              if (
                !confirm(
                  "Restore this snapshot? The current saved version will be preserved first.",
                )
              )
                return;
              if (dirty && !(await flushAll())) return;
              await api({ action: "restore", versionId: preview.id });
              await onReload();
              setPreview(null);
              setHistory(false);
              onBack();
            }}
          >
            Restore this version
          </button>
        </Modal>
      )}
    </div>
  );
}
