import "server-only";
import { randomUUID } from "node:crypto";
import { local, sql } from "./store";
import {
  emptyRecords,
  resources,
  schemas,
  type Resource,
  type Records,
  type WorkspaceData,
  type Piece,
  type Version,
} from "./models";
export class ConflictError extends Error {}
export class MissingError extends Error {}
const now = () => new Date().toISOString();
async function owned<T>(
  artistId: string,
  run: (tx: NonNullable<typeof sql>) => Promise<T>,
): Promise<T> {
  if (!sql) throw Error("No database");
  return (await sql.begin(async (tx) => {
    await tx`select set_config('studio.artist_id',${artistId},true)`;
    return run(tx as unknown as NonNullable<typeof sql>);
  })) as T;
}
export async function workspace(artistId: string): Promise<WorkspaceData> {
  if (!sql)
    return local((s) => {
      s.records ??= emptyRecords();
      return {
        ...Object.fromEntries(
          Object.entries(s.records).map(([k, v]) => [
            k,
            v.filter((x) => x.artist_id === artistId),
          ]),
        ),
        preferences: s.preferences?.[artistId] || {
          theme: "dark",
          collapsed: false,
        },
      } as WorkspaceData;
    });
  return owned(artistId, async (tx) => {
    const result = emptyRecords();
    for (const table of [...resources, "draft_versions"] as const) {
      const rows =
        await tx`select * from ${tx(table)} where artist_id=${artistId} order by created_at desc`;
      if (table === "writing_pieces") {
        for (const p of rows) {
          p.sections =
            await tx`select id,name,content,richtext from writing_sections where artist_id=${artistId} and piece_id=${p.id} order by position`;
        }
      }
      (result[table] as unknown[]).push(...rows);
    }
    const prefs =
      await tx`select theme,collapsed from user_preferences where artist_id=${artistId}`;
    return {
      ...result,
      preferences: prefs[0] || { theme: "dark", collapsed: false },
    } as WorkspaceData;
  });
}
function checkParent(records: Records, artistId: string, projectId: unknown) {
  if (
    projectId &&
    !records.projects.some(
      (p) => p.id === projectId && p.artist_id === artistId,
    )
  )
    throw new MissingError("Project not found");
}
export async function saveRecord(
  artistId: string,
  resource: Resource,
  raw: unknown,
) {
  const data = schemas[resource].parse(raw);
  if (data.artist_id !== artistId) throw new MissingError("Not found");
  data.updated_at = now();
  if (!sql)
    return local((s) => {
      s.records ??= emptyRecords();
      const rows = s.records[resource] as (typeof data)[];
      const index = rows.findIndex((x) => x.id === data.id);
      if (index >= 0 && rows[index].artist_id !== artistId)
        throw new MissingError("Not found");
      if ("project_id" in data)
        checkParent(s.records, artistId, data.project_id);
      if (resource === "writing_pieces") {
        const p = data as Piece;
        const old = rows[index] as Piece | undefined;
        if (old && old.revision !== p.revision)
          throw new ConflictError(
            "Another tab saved a newer version. Your local changes are preserved.",
          );
        p.revision = (old?.revision || 0) + 1;
      }
      if (index >= 0) rows[index] = data;
      else rows.push(data);
      return data;
    });
  return owned(artistId, async (tx) => {
    if ("project_id" in data && data.project_id) {
      const p =
        await tx`select id from projects where id=${data.project_id} and artist_id=${artistId}`;
      if (!p.length) throw new MissingError("Project not found");
    }
    const rows =
      await tx`select * from ${tx(resource)} where id=${data.id} for update`;
    if (rows.length && rows[0].artist_id !== artistId)
      throw new MissingError("Not found");
    const values = { ...data } as Record<string, unknown>;
    delete values.sections;
    // postgres.js arrays are explicitly encoded for JSON columns.
    for (const key of ["tags", "checklist", "chords"])
      if (key in values) values[key] = tx.json(values[key] as never);
    if (resource === "writing_pieces") {
      if (rows.length && rows[0].revision !== values.revision)
        throw new ConflictError(
          "A newer version exists. Your local changes are preserved.",
        );
      values.revision = (rows[0]?.revision || 0) + 1;
    }
    if (rows.length) {
      delete values.created_at;
      await tx`update ${tx(resource)} set ${tx(values as never)} where id=${data.id} and artist_id=${artistId}`;
    } else await tx`insert into ${tx(resource)} ${tx(values as never)}`;
    if (resource === "writing_pieces") {
      const p = data as Piece;
      await tx`delete from writing_sections where piece_id=${p.id} and artist_id=${artistId}`;
      for (const [position, section] of p.sections.entries())
        await tx`insert into writing_sections ${tx({ ...section, richtext: section.richtext ? tx.json(section.richtext as never) : null, piece_id: p.id, artist_id: artistId, position })}`;
      return { ...p, revision: values.revision };
    }
    return data;
  });
}
export async function removeRecord(
  artistId: string,
  resource: Resource,
  id: string,
) {
  if (!sql)
    return local((s) => {
      s.records ??= emptyRecords();
      const rows = s.records[resource];
      const record = rows.find((x) => x.id === id && x.artist_id === artistId);
      if (!record) throw new MissingError("Not found");
      if (resource === "projects") {
        for (const table of [
          "writing_pieces",
          "ideas",
          "tasks",
          "chord_progressions",
        ] as const)
          for (const x of s.records[table])
            if (x.artist_id === artistId && x.project_id === id)
              x.project_id = null;
      }
      if (resource === "writing_pieces")
        s.records.draft_versions = s.records.draft_versions.filter(
          (x) => x.piece_id !== id || x.artist_id !== artistId,
        );
      (s.records[resource] as unknown[]) = rows.filter((x) => x !== record);
    });
  await owned(artistId, async (tx) => {
    const result =
      await tx`delete from ${tx(resource)} where id=${id} and artist_id=${artistId} returning id`;
    if (!result.length) throw new MissingError("Not found");
  });
}
export async function snapshot(
  artistId: string,
  pieceId: string,
  name: string,
) {
  if (!sql)
    return local((s) => {
      s.records ??= emptyRecords();
      const p = s.records.writing_pieces.find(
        (p) => p.artist_id === artistId && p.id === pieceId,
      );
      if (!p) throw new MissingError("Not found");
      const version: Version = {
        id: randomUUID(),
        artist_id: artistId,
        piece_id: pieceId,
        name,
        sections: structuredClone(p.sections),
        title: p.title,
        created_at: now(),
      };
      s.records.draft_versions.push(version);
      return version;
    });
  return owned(artistId, async (tx) => {
    const p = (
      await tx`select * from writing_pieces where artist_id=${artistId} and id=${pieceId} for update`
    )[0];
    if (!p) throw new MissingError("Not found");
    const sections =
      await tx`select id,name,content,richtext from writing_sections where piece_id=${pieceId} and artist_id=${artistId} order by position`;
    const v = {
      id: randomUUID(),
      artist_id: artistId,
      piece_id: pieceId,
      name,
      sections: tx.json(sections),
      title: p.title,
      created_at: now(),
    };
    await tx`insert into draft_versions ${tx(v)}`;
    return { ...v, sections };
  });
}
export async function restore(artistId: string, versionId: string) {
  // Read and restore in one serialized/locked operation; preserve the current content first.
  if (!sql)
    return local((s) => {
      s.records ??= emptyRecords();
      const v = s.records.draft_versions.find(
        (v) => v.id === versionId && v.artist_id === artistId,
      );
      const p = s.records.writing_pieces.find(
        (p) => p.id === v?.piece_id && p.artist_id === artistId,
      );
      if (!v || !p) throw new MissingError("Not found");
      s.records.draft_versions.push({
        id: randomUUID(),
        artist_id: artistId,
        piece_id: p.id,
        name: "Before restore",
        title: p.title,
        sections: structuredClone(p.sections),
        created_at: now(),
      });
      p.title = v.title;
      p.sections = structuredClone(v.sections);
      p.revision++;
      p.updated_at = now();
      return p;
    });
  return owned(artistId, async (tx) => {
    const v = (
      await tx`select * from draft_versions where id=${versionId} and artist_id=${artistId}`
    )[0];
    if (!v) throw new MissingError("Not found");
    const p = (
      await tx`select * from writing_pieces where id=${v.piece_id} and artist_id=${artistId} for update`
    )[0];
    if (!p) throw new MissingError("Not found");
    const previous =
      await tx`select id,name,content,richtext from writing_sections where piece_id=${p.id} and artist_id=${artistId} order by position`;
    await tx`insert into draft_versions ${tx({ id: randomUUID(), artist_id: artistId, piece_id: p.id, name: "Before restore", title: p.title, sections: tx.json(previous), created_at: now() })}`;
    await tx`update writing_pieces set title=${v.title},revision=revision+1,updated_at=now() where id=${p.id} and artist_id=${artistId}`;
    await tx`delete from writing_sections where piece_id=${p.id} and artist_id=${artistId}`;
    for (const [position, section] of (
      v.sections as Piece["sections"]
    ).entries())
      await tx`insert into writing_sections ${tx({ ...section, richtext: section.richtext ? tx.json(section.richtext as never) : null, piece_id: p.id, artist_id: artistId, position })}`;
  });
}
export async function preferences(
  artistId: string,
  value: { theme: "dark" | "light"; collapsed: boolean },
) {
  if (!sql)
    return local((s) => {
      s.preferences ??= {};
      s.preferences[artistId] = value;
    });
  await owned(artistId, async (tx) => {
    await tx`insert into user_preferences ${tx({ artist_id: artistId, ...value })} on conflict(artist_id) do update set theme=excluded.theme,collapsed=excluded.collapsed`;
  });
}
