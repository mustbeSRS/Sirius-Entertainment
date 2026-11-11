import { beforeAll, afterAll, it, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
const db = new PGlite();
const owner = "11111111-1111-4111-8111-111111111111",
  other = "22222222-2222-4222-8222-222222222222",
  project = "33333333-3333-4333-8333-333333333333";
beforeAll(async () => {
  await db.exec("create role anon; create role authenticated;");
  await db.exec(
    await readFile("supabase/migrations/0001_foundation.sql", "utf8"),
  );
  await db.exec(
    await readFile("supabase/migrations/0002_creative_workspace.sql", "utf8"),
  );
  await db.query(
    "insert into artist_profiles(id,full_name,email,phone,privacy_version) values ($1,'One Artist','one@example.com','+96892123456','test'),($2,'Two Artist','two@example.com','+96892123457','test')",
    [owner, other],
  );
}, 30000);
afterAll(() => db.close());
it("applies normalized migrations and blocks public contact reads", async () => {
  await db.exec("set role anon");
  await expect(db.query("select email from artist_profiles")).rejects.toThrow();
  await db.exec("reset role");
});
it("enforces ownership in PostgreSQL independently of the HTTP layer", async () => {
  await db.exec("set role sirius_app");
  await db.query("select set_config('studio.artist_id',$1,false)", [owner]);
  await db.query(
    "insert into projects(id,artist_id,title,type) values ($1,$2,'Private project','Song')",
    [project, owner],
  );
  await db.query("select set_config('studio.artist_id',$1,false)", [other]);
  expect((await db.query("select * from projects")).rows).toHaveLength(0);
  await expect(
    db.query(
      "insert into projects(id,artist_id,title,type) values ('44444444-4444-4444-8444-444444444444',$1,'Forged owner','Song')",
      [owner],
    ),
  ).rejects.toThrow();
  await expect(
    db.query(
      "insert into writing_pieces(id,artist_id,project_id,title,kind) values ('55555555-5555-4555-8555-555555555555',$1,$2,'Cross-owner child','song')",
      [other, project],
    ),
  ).rejects.toThrow();
  await db.exec("reset role");
});
it("throttles registration atomically and excludes admin creation from the app role", async () => {
  await db.exec("set role sirius_app");
  for (let i = 0; i < 5; i++)
    expect(
      (
        await db.query<{ allowed: boolean }>(
          "select take_registration_slot('test-key') as allowed",
        )
      ).rows[0].allowed,
    ).toBe(true);
  expect(
    (
      await db.query<{ allowed: boolean }>(
        "select take_registration_slot('test-key') as allowed",
      )
    ).rows[0].allowed,
  ).toBe(false);
  await expect(
    db.query(
      "insert into admin_users(email,role) values ('attacker@example.com','owner')",
    ),
  ).rejects.toThrow();
  await db.exec("reset role");
});
