# SIRIUS Writers Studio

**Your Words. Your Vision. Your Creative Process.**

A free creative writing and music workspace by SIRIUS Entertainment. English-first, dark-mode-first, responsive on desktop and mobile. This repository contains the functional application; public launch still requires the infrastructure and policy steps below.

## What works

- Password-free artist registration; secure browser sessions; email-link recovery; separate optional marketing consent.
- Real-data dashboard and global workspace search.
- Projects with Kanban/status controls, persistent ordering, list/deadline views, tags and tasks/checklists.
- Song and poetry templates, Tiptap rich-text sections, reordering, undo/redo, contextual vocabulary insertion, autosave with local interruption recovery, optimistic conflict protection, focus mode and named snapshots.
- Idea Vault, collections/favorites, idea-to-song/poem conversion, searchable library and archived work.
- Offline-data language tools: CMU rhymes/syllables/alliteration; WordNet definitions/synonyms/antonyms/examples; rhythm analysis; clearly labeled guided imagery/metaphor/topic exercises.
- **Chord Lab** at `/studio/chords`: circle of fifths, key/starting-chord exploration, genre/mood patterns, next-chord suggestions, editable/transposable progressions, real Yamaha C5 grand-piano samples, sustain/pedal/tempo/volume, playback/stop, save/load and export.
- TXT/Markdown/PDF writing export; full workspace JSON export; profile preferences and confirmed account deletion.
- Separate verified admin sessions, private contact directory, filters, actual registration/activity counts/trends and audited verified-consent-only CSV export. No private-draft browser is provided to administrators.

**AI is disabled.** Core features need no paid AI service. No provider, billing or external email service is enabled by this code change.

## Run in the cloud workspace

Node 22+ and npm are needed on the cloud host, not on the founder’s Mac.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open the cloud workspace’s preview for port 3000. Set `APP_ORIGIN` to the **exact browser origin**, including https/port if forwarded, and restart after changing it. Local automated Chrome uses `http://localhost:3000`.

`LOCAL_DEMO=true` works only without DATABASE_URL and outside production. Use invented contacts. Data is stored in ignored `.data/studio.json` on this development server and persists across browser reloads. It is a serialized, single-process adapter, not Supabase or a production filesystem database.

Development recovery sends no email. It writes the latest link to ignored `.data/mailbox.json` (or LOCAL_DATA_DIR). Open the URL in that file to test verification. No token is returned by the recovery API. For local admin testing only, set ADMIN_EMAILS to a comma-separated list of test administrator addresses; request an admin link at `/admin` and inspect the private development mailbox. Artist registration never grants admin access.

## Production setup

Use Supabase PostgreSQL and Vercel-compatible hosting. Apply both versioned migrations, create a restricted runtime database login inheriting sirius_app, configure verified TLS/database connection and APP_ORIGIN, configure approved SMTP, and separately provision admin_users. See [deployment guide](docs/deployment.md).

The production build **does not enable filesystem demo storage**. PUBLIC_REGISTRATION_ENABLED defaults to false. Do not open public registration until live database/SMTP checks and Oman/privacy/younger-user policy review are completed.

## Checks

```sh
npm test              # validation, pronunciation/music theory and PostgreSQL RLS/migration tests
npm run typecheck
npm run build
npm run test:e2e      # registration, full creative flow, recovery/admin, mobile/offline/export
npm run format:check
```

Browser tests use `/usr/bin/chromium`, override with CHROMIUM_PATH when needed. They reset only `.data/e2e`, start their own development server, use invented contacts, and exercise actual application routes. Embedded PostgreSQL tests use PGlite; they do not claim that Supabase production credentials/SMTP have been tested. Automated accessibility checks cover the mobile editor and chord page; they are not a full compliance certification.

## Design and documentation

Supplied SIRIUS logo artwork is preserved, with reference-derived violet/silver accents. See [design system](docs/design-system.md), [full status and limits](docs/full-studio-status.md), [architecture](docs/architecture.md), [verification](docs/verification.md), and [attributions](docs/third-party-notices.md).

Preview screenshots are in docs/previews. They show the running development application with invented test data. Screenshots are not a public deployment.

### New functional previews

- [Chord Lab](docs/previews/chord-lab.png)
- [Mobile chord wheel and progression controls](docs/previews/mobile-chords.png)
- [Mobile writing editor](docs/previews/mobile-editor.png)
- [Restricted contact administration](docs/previews/admin.png)
