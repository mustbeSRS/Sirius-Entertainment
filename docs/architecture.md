# Application architecture

## Runtime and repository

Next.js App Router, React, TypeScript and Tailwind/CSS tokens; Lucide icons; Tiptap StarterKit for structured writing; dnd-kit for keyboard/pointer ordering. Heavy editor/language/music panels load on demand to keep the initial mobile dashboard lighter. Native dialog provides focus containment.

- src/app: pages and authenticated server API routes.
- src/components: studio shell, projects/calendar, editor, ideas/library, language tools, Chord Lab, recovery and admin.
- src/lib: typed models/validation, crypto sessions, owner-scoped persistence, linguistic datasets, music theory and sampled piano, optional disabled AI interface.
- supabase/migrations: versioned normalized schema and RLS.
- tests: unit/PostgreSQL tests and real browser acceptance journeys.
- public: intact SIRIUS brand asset and attributed local grand-piano samples.

## Persistence and ownership

Supabase PostgreSQL is the production path. Projects, writing pieces/sections, draft versions, ideas, tasks, saved words, chord progressions and preferences are normalized tables, with UUIDs and owner IDs. Child/project links enforce compound ownership constraints. Creative reads/mutations run in transactions with a server-selected studio.artist_id; PostgreSQL RLS and explicit route checks both enforce ownership. Public Supabase roles have no table access. Use the restricted sirius_app runtime role, never a table owner/superuser/BYPASSRLS credential.

A separate single-process development adapter serializes atomic file replacement under .data. It is explicitly labeled and prohibited in production. Production builds succeeding without DATABASE_URL do not imply database readiness.

Writing autosave stores text plus Tiptap structured JSON. Revision checks reject stale writes. Browser-local recovery is scoped by artist/piece; interrupted/conflicting copies remain available rather than silently overwriting the server. Before leaving or taking a snapshot, queued saves are drained so an in-flight older save cannot hide a newer change. Manual restore locks/preserves the current draft before replacement. Snapshots are not created on every keystroke.

## Identity and security

Artist cookies hold 256-bit random session credentials; server storage keeps SHA-256 hashes, owner ID, expiry and revocation. Cookies are HttpOnly/SameSite=Lax and Secure in production. Artist lifetime is 30 days. Exact-origin checks protect mutations. Registration/recovery abuse buckets use short-lived hashed trusted network metadata, not IP identity or fingerprinting.

Unverified contacts never authenticate recovery. Fifteen-minute, one-use hashed email tokens are consumed explicitly via POST after a confirmation gesture. Artist recovery verifies email and revokes previous artist sessions. Production delivery uses separately approved SMTP with TLS; development uses an ignored private mailbox. No token is returned by the request API.

Administration uses separately provisioned admin_users, separate-purpose recovery tokens and a distinct eight-hour cookie. Artist registration cannot provision admins. Admin contact endpoints expose no writing and audit sensitive access/export. Outreach CSV requires current consent and verified email, escapes spreadsheet formulas, and excludes drafts. Profile deletion cascades creative data and removes outstanding artist recovery credentials. Marketing history is independent of tool access.

## Language and music

CMU pronunciations drive rhymes, syllables and matching initial phonemes. Unknown syllables/near matches are labeled approximate. The WordNet adapter reads the bundled index/data offsets without third-party prototype polyfills, and returns dictionary senses/examples/antonym links. Guided inspiration exercises are explicitly deterministic prompts.

Chord Lab uses conventional diatonic harmony, circle-of-fifths ordering, shared-tone/tonal-function suggestions and curated common progression patterns. Native Web Audio decodes locally served Yamaha C5/Salamander samples after a user gesture; it transposes sample roots, voices chords with a bass note, applies gain/release/sustain, and cancels sequences on stop/unmount. Audio samples and dataset licenses are attributed.

AI is disabled. The typed optional provider boundary defines explicitly consented context and suggestions; live providers, quotas/cost logging and activation require separate approval/implementation before use.

## Operations still requiring external setup

Approved Supabase/SMTP/Vercel configuration, runtime-role integration verification, production smoke tests, policy/controller/retention/region and Oman/younger-user review, manual real-device audio/accessibility checks, backups/monitoring. The admin list currently targets an initial small community; add server pagination before large-scale use.
