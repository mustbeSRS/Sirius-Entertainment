# Feature completion and release checklist

## Implemented

- [x] SIRIUS design system, intact supplied logo, desktop/mobile navigation, persistent light/dark preferences.
- [x] Registration, normalized contacts/calling code, independent consent/history, hashed browser sessions, expiry/revocation.
- [x] Personalized real-data dashboard and global search.
- [x] Projects: creation/editing, Kanban/stage controls, persisted ordering, search/filter/sort, tags, deadlines, archive/delete.
- [x] Tasks: checklists, priorities, due dates, project links, complete/edit/delete.
- [x] Song/poem templates, Tiptap rich-text sections, keyboard/drag reordering, undo/redo, word/line counts, focus mode.
- [x] Debounced autosave, synchronous local recovery, explicit conflicts/save states, named snapshots and restore preservation.
- [x] Idea Vault types/tags/collections/favorites/search/card/list/project links, conversion to drafts, archive/delete.
- [x] Library, pins, duplication, archived work, saved vocabulary.
- [x] CMU perfect/near rhymes, syllable filters, alliteration, contextual insertion/favorites; WordNet senses/synonyms/antonyms/examples.
- [x] Estimated rhythm/rhyme analysis and clearly labeled deterministic creative exercises.
- [x] Separate Chord Lab: key/first-chord exploration, wheel, recommendations, genre/mood patterns, sampled grand piano, sustain/pedal/tempo/volume, sequence/stop, editable/transposable saved progressions.
- [x] TXT/Markdown/PDF and full JSON export.
- [x] Verified one-time email-link recovery path; separate admin identity/session; local mailbox for test mode.
- [x] Contact-only administrator directory, filters, actual registration/activity trends, audited verified-consent-only CSV export.
- [x] Optional profile fields, consent withdrawal and confirmed account deletion.
- [x] PostgreSQL schema/RLS and browser/security/mobile test coverage.

## Operational launch requirements still pending

- [ ] Founder-approved Supabase project, restricted runtime credential and live integration verification.
- [ ] Approved SMTP sender, real deliverability/recovery checks.
- [ ] Hosting project, environment settings, production smoke tests and monitoring/backups.
- [ ] Final legal entity/contact, retention/region decisions, Oman and younger-user policy review.
- [ ] Manual real-device listening, screen-reader/keyboard review beyond automated checks.

## Intentionally not enabled / future roadmap

- [ ] Paid/live AI provider activation (requires explicit approval; no paid calls).
- [ ] Arabic/RTL and language-specific tools.
- [ ] Collaboration/shared sessions, PWA, melody/audio transcription.
- [ ] Expanded multi-velocity piano, alternate voicings, advanced rhythm analysis.
- [ ] Server-side paginated admin directory for large community scale.

Read docs/full-studio-status.md for precise behavior and limitations. Functional development testing does not imply public-production readiness.
