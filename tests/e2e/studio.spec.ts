import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
const headers = { origin: "http://localhost:3000" };
test("complete creative workflow, piano playback, conflict protection and mobile chord page", async ({
  page,
  context,
  browser,
}) => {
  test.setTimeout(120000);
  const email = "full-studio@example.com";
  const registration = await context.request.post("/api/register", {
    headers,
    data: {
      fullName: "Studio Artist",
      email,
      phone: "+96892123458",
      terms: true,
      marketing: false,
    },
  });
  expect(registration.status()).toBe(200);
  await page.goto("/studio");
  await expect(
    page.getByRole("heading", { name: "Welcome back, Studio." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "My Projects", exact: true }).click();
  await page.getByRole("button", { name: "New project", exact: true }).click();
  await page.getByLabel("Project title").fill("First EP");
  await page
    .getByLabel("Description", { exact: true })
    .fill("Songs about finding home");
  await page.getByRole("button", { name: "Save project" }).click();
  await expect(
    page.getByRole("button", { name: "First EP", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Status for First EP").selectOption("writing");
  await page.getByRole("button", { name: "Task", exact: true }).click();
  await page.getByLabel("Task title").fill("Finish the chorus");
  await page.getByLabel("Due date").fill("2026-12-20");
  await page.getByRole("button", { name: "Add checklist item" }).click();
  await page
    .getByLabel("Checklist item", { exact: true })
    .fill("Try a stronger final image");
  await page.getByRole("button", { name: "Save task" }).click();
  await expect(
    page.getByRole("button", { name: "Finish the chorus", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Dashboard", exact: true }).click();
  await page.getByRole("button", { name: "New song", exact: true }).click();
  await page
    .getByLabel("Writing title", { exact: true })
    .fill("Home in the Quiet");
  await page
    .getByLabel("Template", { exact: true })
    .selectOption("Verse / Chorus");
  await page.getByRole("button", { name: "Open writing canvas" }).click();
  const verse = page.getByRole("textbox", {
    name: "Writing section Verse 1",
    exact: true,
  });
  await expect(verse).toBeVisible();
  await verse.fill("I found a light\nInside the night");
  await expect
    .poll(async () => {
      const r = await context.request.get("/api/workspace");
      const d = await r.json();
      return d.writing_pieces[0]?.sections[0]?.content;
    })
    .toContain("Inside the night");
  await expect(page.locator(".save-status")).toHaveText("Saved");
  await page.getByRole("button", { name: "Draft versions" }).click();
  await page.getByLabel("Snapshot name").fill("First spark");
  await page.getByRole("button", { name: "Save snapshot" }).click();
  await expect(
    page.getByRole("button", { name: "First spark", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  const stored = await (await context.request.get("/api/workspace")).json();
  const original = stored.writing_pieces[0];
  // A stale browser revision cannot overwrite the current document.
  const fresh = await context.request.post("/api/workspace", {
    headers,
    data: {
      action: "save",
      resource: "writing_pieces",
      data: {
        ...original,
        title: "Home in the Quiet",
        revision: original.revision,
      },
    },
  });
  expect(fresh.status()).toBe(200);
  const stale = await context.request.post("/api/workspace", {
    headers,
    data: { action: "save", resource: "writing_pieces", data: original },
  });
  expect(stale.status()).toBe(409);
  await page.reload();
  await page.getByRole("button", { name: /^Home in the Quiet/ }).click();
  await expect(
    page.getByRole("textbox", { name: "Writing section Verse 1", exact: true }),
  ).toContainText("Inside the night");
  await page
    .getByRole("button", { name: "Library", exact: true })
    .last()
    .click();
  await page.getByRole("button", { name: "Idea Vault", exact: true }).click();
  await page.getByRole("button", { name: "Capture idea", exact: true }).click();
  await page.getByLabel("Idea title (optional)").fill("Salt on the windowsill");
  await page
    .getByLabel("Your idea", { exact: true })
    .fill("The sea kept a room in my memory.");
  await page.getByRole("button", { name: "Save idea" }).click();
  await page.getByRole("button", { name: "Make poem", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Writing title", exact: true }),
  ).toHaveValue("Salt on the windowsill");
  await page
    .getByRole("button", { name: "Library", exact: true })
    .last()
    .click();
  await page
    .getByRole("button", { name: "Creative Toolkit", exact: true })
    .click();
  await page.getByLabel("Explore a word").fill("light");
  await page.getByRole("button", { name: "Search language tools" }).click();
  await expect(
    page.getByRole("button", { name: "night", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Save word night", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Saved “night”" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Definitions", exact: true }).click();
  await page.getByLabel("Explore a word").fill("music");
  await page.getByRole("button", { name: "Search language tools" }).click();
  await expect(
    page.getByText("Princeton WordNet 3.1 · dictionary data, not AI", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator(".dictionary-sense").first()).toBeVisible();
  await page.getByRole("button", { name: "Chord Lab", exact: true }).click();
  await expect(page).toHaveURL(/studio\/chords/);
  await expect(
    page.getByRole("heading", { name: "Chord Lab", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Use pattern", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Play C, I", exact: true }).click();
  await expect(
    page.getByText("Grand piano ready.", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Sustain (seconds)").fill("4");
  await page
    .getByRole("button", { name: "Play progression", exact: true })
    .click();
  await expect(page.locator(".chord-step.playing")).toHaveCount(1);
  await page.getByRole("button", { name: "Stop piano", exact: true }).click();
  await expect(page.locator(".chord-step.playing")).toHaveCount(0);
  await page.getByLabel("Progression title").fill("Home chorus progression");
  await page
    .getByRole("button", { name: "Save progression", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Home chorus progression", exact: true }),
  ).toBeVisible();
  await mkdir("work/screenshots", { recursive: true });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "work/screenshots/chord-lab.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "work/screenshots/mobile-chords.png",
    fullPage: true,
  });
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Home chorus progression", exact: true }),
  ).toBeVisible();
  const workspace = await (await context.request.get("/api/workspace")).json();
  expect(workspace.chord_progressions[0].sustain).toBe(4);
  expect(workspace.ideas).toHaveLength(1);
  expect(workspace.draft_versions).toHaveLength(1);
  expect(workspace.tasks[0].checklist[0].text).toBe(
    "Try a stronger final image",
  );
  const stranger = await browser.newContext();
  expect(
    (
      await stranger.request.get("http://localhost:3000/api/workspace")
    ).status(),
  ).toBe(401);
  await stranger.close();
  // Restore preserves the previous draft first.
  const restored = await context.request.post("/api/workspace", {
    headers,
    data: { action: "restore", versionId: workspace.draft_versions[0].id },
  });
  expect(restored.status()).toBe(200);
  const after = await (await context.request.get("/api/workspace")).json();
  expect(after.draft_versions).toHaveLength(2);
  const exportData = await (await context.request.get("/api/export")).json();
  expect(exportData.writing_pieces).toHaveLength(2);
  expect(exportData.chord_progressions).toHaveLength(1);
});
test("verified passwordless recovery, admin separation, consent-aware export and deletion", async ({
  page,
  context,
  browser,
}) => {
  const email = "recovery-test@example.com";
  expect(
    (
      await context.request.post("/api/register", {
        headers,
        data: {
          fullName: "Recovery Artist",
          email,
          phone: "+96892123459",
          terms: true,
          marketing: false,
        },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await context.request.post("/api/admin", {
        headers,
        data: { action: "export" },
      })
    ).status(),
  ).toBe(401);
  const oldCookies = await context.cookies();
  const requested = await context.request.post("/api/recovery", {
    headers,
    data: { action: "request", email, purpose: "artist" },
  });
  expect(requested.status()).toBe(200);
  const mailbox = JSON.parse(await readFile(".data/e2e/mailbox.json", "utf8"));
  expect(mailbox.to).toBe(email);
  const url = new URL(mailbox.url),
    token = url.searchParams.get("token");
  expect(
    (
      await context.request.post("/api/recovery", {
        headers,
        data: { action: "consume", token, purpose: "artist" },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await context.request.post("/api/recovery", {
        headers,
        data: { action: "consume", token, purpose: "artist" },
      })
    ).status(),
  ).toBe(400);
  const old = await browser.newContext();
  await old.addCookies(oldCookies);
  expect(
    (await old.request.get("http://localhost:3000/api/workspace")).status(),
  ).toBe(401);
  await old.close();
  const admin = await browser.newContext();
  expect(
    (
      await admin.request.post("http://localhost:3000/api/recovery", {
        headers,
        data: {
          action: "request",
          email: "admin@example.com",
          purpose: "admin",
        },
      })
    ).status(),
  ).toBe(200);
  const adminMail = JSON.parse(
    await readFile(".data/e2e/mailbox.json", "utf8"),
  );
  const adminToken = new URL(adminMail.url).searchParams.get("token");
  expect(
    (
      await admin.request.post("http://localhost:3000/api/recovery", {
        headers,
        data: { action: "consume", token: adminToken, purpose: "admin" },
      })
    ).status(),
  ).toBe(200);
  expect(
    (await admin.request.get("http://localhost:3000/api/workspace")).status(),
  ).toBe(401);
  const csv = await admin.request.post("http://localhost:3000/api/admin", {
    headers,
    data: { action: "export" },
  });
  expect(csv.status()).toBe(200);
  expect(await csv.text()).not.toContain(email);
  expect(
    (
      await context.request.post("/api/consent", {
        headers,
        data: { marketing: true },
      })
    ).status(),
  ).toBe(200);
  const optedIn = await admin.request.post("http://localhost:3000/api/admin", {
    headers,
    data: { action: "export" },
  });
  expect(await optedIn.text()).toContain(email);
  const adminPage = await admin.newPage();
  await adminPage.goto("http://localhost:3000/admin");
  await expect(
    adminPage.getByRole("heading", { name: "Artist directory", exact: true }),
  ).toBeVisible();
  await expect(
    adminPage.getByText("Home in the Quiet", { exact: true }),
  ).toHaveCount(0);
  await adminPage.screenshot({
    path: "work/screenshots/admin.png",
    fullPage: true,
  });

  expect(
    (
      await context.request.delete("/api/profile", {
        headers,
        data: { confirm: "DELETE" },
      })
    ).status(),
  ).toBe(200);
  expect((await context.request.get("/api/workspace")).status()).toBe(401);
  await admin.close();
});
test("mobile editing, interrupted-save recovery, contextual insertion and exports", async ({
  page,
  context,
}) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    (
      await context.request.post("/api/register", {
        headers,
        data: {
          fullName: "Mobile Artist",
          email: "mobile-test@example.com",
          phone: "+96892123460",
          terms: true,
          marketing: false,
        },
      })
    ).status(),
  ).toBe(200);
  const profile = await (await context.request.get("/api/export")).json();
  const at = new Date().toISOString(),
    id = crypto.randomUUID();
  const piece = {
    id,
    artist_id: profile.profile.id,
    created_at: at,
    updated_at: at,
    title: "Mobile draft",
    kind: "song",
    project_id: null,
    status: "ideas",
    revision: 0,
    pinned: false,
    archived: false,
    sections: [
      { id: crypto.randomUUID(), name: "Verse", content: "Original words" },
    ],
  };
  expect(
    (
      await context.request.post("/api/workspace", {
        headers,
        data: { action: "save", resource: "writing_pieces", data: piece },
      })
    ).status(),
  ).toBe(200);
  await page.goto("/studio?view=Library");
  await page.getByRole("button", { name: "Mobile draft", exact: true }).click();
  const verse = page.getByRole("textbox", {
    name: "Writing section Verse",
    exact: true,
  });
  await expect(verse).toBeVisible();
  await expect(page.locator(".editor-tool-panel")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.route("**/api/workspace", (route) =>
    route.request().method() === "POST" ? route.abort() : route.continue(),
  );
  await verse.fill("My recovered mobile line");
  await expect(page.locator(".save-status")).toContainText("local copy kept");
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage).some((k) => k.startsWith("sirius-recovery:")),
    ),
  ).toBe(true);
  page.once("dialog", (d) => d.accept());
  await page.reload();
  await page.getByRole("button", { name: "Mobile draft", exact: true }).click();
  await expect(
    page.getByText("A local recovery draft is available.", { exact: true }),
  ).toBeVisible();
  await page.unroute("**/api/workspace");
  await page
    .getByRole("button", { name: "Recover local changes", exact: true })
    .click();
  await expect(verse).toContainText("My recovered mobile line");
  await expect(page.locator(".save-status")).toHaveText("Saved");
  await verse.click();
  await page.getByRole("button", { name: "Toggle creative tools" }).click();
  await page.getByLabel("Explore a word").fill("light");
  await page.getByRole("button", { name: "Search language tools" }).click();
  await page.getByRole("button", { name: "night", exact: true }).click();
  await page
    .getByRole("button", { name: "Close creative tools", exact: true })
    .click();
  await expect(verse).toContainText("night");
  await expect(page.locator(".save-status")).toHaveText("Saved");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "work/screenshots/mobile-editor.png",
    fullPage: true,
  });
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);
  for (const format of ["TXT", "MD", "PDF"]) {
    const event = page.waitForEvent("download");
    await page.getByRole("button", { name: format, exact: true }).click();
    const d = await event;
    const path = await d.path();
    expect(path).toBeTruthy();
    const buffer = await readFile(path!);
    if (format === "PDF") expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
    else expect(buffer.toString()).toContain("My recovered mobile line");
  }
});
