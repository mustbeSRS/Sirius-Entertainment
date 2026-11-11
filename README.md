# SIRIUS Writers Studio

Your Words. Your Vision. Your Creative Process.

A free creative tool by SIRIUS Entertainment. Phase 1 foundation; not ready for public artist registration.

## Preview in a cloud workspace

Node 22+ and npm are needed on the cloud host, not on the founder’s Mac.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open the workspace preview for port 3000. `APP_ORIGIN` must match the exact browser origin (including https and port) for registration, consent, and logout. For this environment’s localhost browser it is `http://localhost:3000`. In a forwarded preview, set it to the forwarded URL and restart the server.

`LOCAL_DEMO=true` works only in development without DATABASE_URL. Use invented contact details. It persists on the development server in ignored `.data/studio.json`, not in browser storage. This adapter is single-process only and is prohibited in production. Stop the server and delete `.data/` to reset test data. No public demo bypasses registration.

## Quality checks

```sh
npm test
npm run typecheck
npm run build
npm run test:e2e
```

Browser tests use `/usr/bin/chromium` by default; override with `CHROMIUM_PATH`. They start their own isolated development server and use `.data` test state; do not run against real contacts.

## Status

Working locally: responsive shell; name/email/phone registration; optional unchecked marketing; acceptance of draft terms; server-side sessions; returning recognition; consent withdrawal/re-subscription; profile export; session revocation; dark/light UI; labeled future modules. Unit and browser test results are recorded in docs/verification.md.

Not implemented: writing/editor, project CRUD, toolkit, admin, verified recovery, deletion, optional profile editing, production activity analytics. No AI calls or paid services. Project and preferences tables reserve Phase 2 structure; the rest of the normalized schema is designed in docs/architecture.md and will be migrated alongside tested functionality.

The logo is intact artwork extracted from the supplied SRSPRNT.pdf. Violet, silver and stage-light accents draw from both supplied PDFs. Fonts are system fonts; all colors are replaceable CSS variables. Light mode and navigation collapse are in-session UI choices; persistence follows later.

See docs/ for requirements, architecture, design tokens, deployment, completion status, and launch limitations.

## Branding preview

The updated welcome and dashboard use the supplied SIRIUS identity. See [welcome](docs/previews/welcome.png), [dashboard](docs/previews/dashboard.png), and [mobile](docs/previews/mobile-registration.png). These are screenshots of the functional local development preview, not a deployed public service.
