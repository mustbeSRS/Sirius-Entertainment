# Product requirements

SIRIUS Writers Studio is an English-first, free creative home for Oman’s songwriters, rappers, poets, spoken-word artists, and emerging creatives. The parent brand is SIRIUS Entertainment. The product promise is “Your Words. Your Vision. Your Creative Process.” Human creative decisions remain central.

## Audiences and core journeys

1. Register with full name, email, and internationally normalized phone. Marketing is independent, optional, and unchecked. A browser session opens a personal dashboard.
2. Return to that browser and recover access using the session, without a password. A matching email or phone must never restore access.
3. Later milestones: capture an idea, develop it in a structured song/poem editor, arrange projects, explore language, save versions, finish and export writing.
4. Authorized SIRIUS administrators manage consent-aware artist contacts in a separate interface, without default access to private writing.

## Phase 1 acceptance

- Invalid inputs fail on client and server.
- Marketing defaults to false; changes have an audit event.
- A persistent HttpOnly browser cookie carries an opaque random token. Database stores its hash.
- Dashboard greets the actual registered artist with genuine empty states.
- Missing, expired, forged, and revoked sessions cannot access protected profile data.
- Cross-origin mutations fail. Artist registration cannot grant administrator privileges.
- Local preview clearly discloses development storage. Production requires the configured database and explicit registration gate.

## Prioritized roadmap

P0: Phase 1 foundation and session verification. Connect Supabase and verify migrations/RLS before claiming deployed persistence.
P1: Phase 2 projects, accessible Kanban (including keyboard/status-menu alternative), Tiptap editor, section templates, autosave with recovery and conflict handling, basic library.
P2: Phase 3 pronunciation-aware rhymes, dictionaries, vocabulary favorites, approximate syllable analyses. Clearly distinguish dataset-derived and generated output.
P3: Phase 4 ideas, collections, tasks, calendar, focus, manual snapshots and restore safeguards.
P4: Phase 5 restricted admin authentication/roles, contact-only audit/export, verified recovery, data deletion, accessibility/security checks, final legal policies and launch.
P5: Optional AI only after approval, Arabic/RTL, collaboration, PWA, advanced analysis.

No fabricated metrics, dead-end unlabeled action buttons, paid services, or automatic AI rewrites. All unfinished modules explain their actual milestone.
