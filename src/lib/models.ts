import { z } from "zod";
export const stages = [
  "ideas",
  "developing",
  "writing",
  "revising",
  "completed",
] as const;
export const stageLabels = [
  "Ideas",
  "Developing",
  "Writing",
  "Revising",
  "Completed",
];
const id = z.uuid();
const base = {
  id,
  artist_id: id,
  created_at: z.string(),
  updated_at: z.string(),
};
export const projectSchema = z.object({
  ...base,
  title: z.string().trim().min(1).max(200),
  description: z.string().max(5000),
  type: z.enum([
    "Song",
    "EP",
    "Album",
    "Poetry collection",
    "Spoken word",
    "Writing collection",
  ]),
  status: z.enum(stages),
  position: z.number().int().nonnegative(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  tags: z.array(z.string().max(40)).max(30),
  deadline: z.string().regex(/^$|^\d{4}-\d{2}-\d{2}$/),
  archived: z.boolean(),
});
export const sectionSchema = z.object({
  id,
  name: z.string().min(1).max(100),
  content: z.string().max(200000),
  richtext: z.json().optional(),
});
export const pieceSchema = z.object({
  ...base,
  title: z.string().trim().min(1).max(200),
  kind: z.enum(["song", "poem"]),
  project_id: id.nullable(),
  status: z.enum(stages),
  sections: z.array(sectionSchema).min(1).max(100),
  revision: z.number().int().nonnegative(),
  pinned: z.boolean(),
  archived: z.boolean(),
});
export const ideaSchema = z.object({
  ...base,
  title: z.string().max(200),
  body: z.string().min(1).max(20000),
  type: z.enum([
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
  ]),
  tags: z.array(z.string().max(40)).max(30),
  collection: z.string().max(100),
  project_id: id.nullable(),
  favorite: z.boolean(),
  archived: z.boolean(),
});
export const taskSchema = z.object({
  ...base,
  title: z.string().trim().min(1).max(300),
  project_id: id.nullable(),
  due_date: z.string().regex(/^$|^\d{4}-\d{2}-\d{2}$/),
  priority: z.enum(["low", "medium", "high"]),
  completed: z.boolean(),
  checklist: z
    .array(
      z.object({ id, text: z.string().min(1).max(300), done: z.boolean() }),
    )
    .max(100),
});
export const wordSchema = z.object({
  ...base,
  word: z.string().min(1).max(100),
  note: z.string().max(1000),
  source: z.string().max(200),
});
export const progressionSchema = z.object({
  ...base,
  title: z.string().trim().min(1).max(200),
  key: z.string().max(3),
  mode: z.enum(["major", "minor"]),
  chords: z
    .array(
      z.object({
        root: z.number().int().min(0).max(11),
        quality: z.enum([
          "major",
          "minor",
          "dim",
          "7",
          "maj7",
          "m7",
          "sus2",
          "sus4",
        ]),
      }),
    )
    .min(1)
    .max(64),
  genre: z.string().max(60),
  mood: z.string().max(60),
  bpm: z.number().int().min(30).max(240),
  sustain: z.number().min(0.3).max(10),
  project_id: id.nullable(),
});
export type Progression = z.infer<typeof progressionSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Piece = z.infer<typeof pieceSchema>;
export type Section = z.infer<typeof sectionSchema>;
export type Idea = z.infer<typeof ideaSchema>;
export type Task = z.infer<typeof taskSchema>;
export type SavedWord = z.infer<typeof wordSchema>;
export type Version = {
  id: string;
  artist_id: string;
  piece_id: string;
  name: string;
  sections: Section[];
  title: string;
  created_at: string;
};
export type Resource =
  | "projects"
  | "writing_pieces"
  | "ideas"
  | "tasks"
  | "saved_words"
  | "chord_progressions";
export type Records = {
  chord_progressions: Progression[];
  projects: Project[];
  writing_pieces: Piece[];
  ideas: Idea[];
  tasks: Task[];
  saved_words: SavedWord[];
  draft_versions: Version[];
};
export type WorkspaceData = Records & {
  preferences: { theme: "dark" | "light"; collapsed: boolean };
};
export const schemas = {
  projects: projectSchema,
  writing_pieces: pieceSchema,
  ideas: ideaSchema,
  tasks: taskSchema,
  saved_words: wordSchema,
  chord_progressions: progressionSchema,
};
export const resources = Object.keys(schemas) as Resource[];
export const emptyRecords = (): Records => ({
  chord_progressions: [],
  projects: [],
  writing_pieces: [],
  ideas: [],
  tasks: [],
  saved_words: [],
  draft_versions: [],
});
export const templates: Record<string, string[]> = {
  "Verse / Chorus": ["Verse 1", "Chorus", "Verse 2", "Chorus"],
  "Full song": [
    "Intro",
    "Verse 1",
    "Pre-Chorus",
    "Chorus",
    "Verse 2",
    "Chorus",
    "Bridge",
    "Outro",
  ],
  "Rap & hook": ["Verse 1", "Hook", "Verse 2", "Hook"],
  Storytelling: ["Scene", "Conflict", "Turning point", "Resolution"],
  "Freeform song": ["Lyrics"],
  "Free verse": ["Stanza 1"],
  Sonnet: ["Quatrain 1", "Quatrain 2", "Quatrain 3", "Couplet"],
  Haiku: [
    "Line 1 · 5 syllables",
    "Line 2 · 7 syllables",
    "Line 3 · 5 syllables",
  ],
  "Spoken word": ["Opening", "Development", "Climax", "Closing"],
  "Narrative poetry": ["Beginning", "Middle", "End"],
  Custom: ["Section 1"],
};
export function pieceText(
  piece: Pick<Piece, "title" | "sections">,
  markdown = false,
) {
  return (
    `${markdown ? "# " : ""}${piece.title}\n\n` +
    piece.sections
      .map((s) => `${markdown ? "## " : ""}${s.name}\n${s.content}`)
      .join("\n\n")
  );
}
