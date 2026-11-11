# Full creative studio implementation

## Artist workspace

- Secure mandatory registration, independent marketing consent, persistent session recognition.
- Dashboard uses actual counts and recently edited pieces; quick actions open real creation flows.
- Projects: create/edit/archive/delete, tags, color, deadline, search/filter/sort, board/list/deadline views. Board drag/drop changes stage; status menus and ordering controls provide keyboard/touch alternatives.
- Tasks: create/edit/complete/delete, project link, due date, priority, checklist.
- Writing: maintained Tiptap editors with editable/reorderable named sections, song/poem templates, rich formatting, undo/redo, focus mode, project/stage/pin controls, word/line counts, within-draft search.
- Autosave: debounced server saves, synchronous per-artist browser recovery copy, explicit save states, optimistic revisions with conflict rejection, download/duplicate recovery options, unload warning while unsaved. Named snapshots preserve the current saved draft before restoration.
- Idea Vault: quick capture, editable types/tags/collections/project links, favorites, card/list search, archive/delete and conversion into songs/poems.
- Library: searchable songs/poems/completed pieces, pin/duplicate/archive/delete, saved vocabulary, archived project restoration.
- Export: complete workspace JSON; per-piece TXT/Markdown/PDF. PDF uses standard Latin fonts and replaces unsupported glyphs; TXT/Markdown preserve Unicode.
- Theme and sidebar preferences persist. Mobile navigation scrolls horizontally when needed; editor tools use a dismissible drawer.

## Language and creative tools

CMU pronunciation-aware perfect rhymes; approximate near/slant candidates; syllable filtering; phonetic alliteration; saved vocabulary and contextual insertion. WordNet senses provide dictionary definitions, parts of speech, examples, synonyms grouped by sense, and antonym pointers where present. Unknown words and missing entries have explicit empty states.

Rhythm analysis reports CMU/estimated syllables, end-rhyme groups, repeated words and possible internal rhymes. Guided metaphors/similes/imagery/topics/structure prompts are deterministic writing exercises and labeled as such. They are not represented as AI generation.

AI is disabled. A typed provider boundary and explicit-sharing requirement are prepared, but provider integration, cost/quota enforcement and activation remain an approval-dependent future feature. No paid API is called.

## Chord Lab — separate route `/studio/chords`

Circle-of-fifths wheel; major/natural-minor diatonic chords; starting-chord key exploration; next-chord suggestions based on tonal function and shared tones; genre/mood-filtered common patterns; editable/reorderable progression; transposition; project links; save/load/delete; text export.

Playback uses local Salamander Yamaha C5 grand-piano MP3 samples by Alexander Holm (CC BY 3.0), redistributed by Tone.js. AudioContext starts only after a user gesture. Samples are pitch-shifted from seven C-octave recordings; bass/root voicing, short attack spread, gain limiting, configurable release/sustain, pedal mode, volume, tempo, sequence highlights and stop are provided. This is a practical sampled preview instrument, not a complete multi-velocity commercial piano. Hardware audio output cannot be heard by automated tests; decode/playback state and sequence cancellation are testable.

## Identity, recovery and administration

Artist and admin recovery use separate-purpose, hashed, 15-minute, single-use tokens. Artist recovery verifies email and revokes old artist sessions. Administration requires a separately provisioned admin identity and distinct eight-hour cookie. Registering with an admin email alone never grants admin access.

Production recovery uses founder-configured SMTP; no email service or billing is provisioned. Development writes the link to a private ignored mailbox file, never an API response. Request responses do not disclose whether the address exists.

Contact administration excludes drafts. It includes search/discipline/location/consent filters, actual registration/activity counts, trends, audited directory views and marketing-consented CSV export with spreadsheet-formula protection. Directory filters affect viewing; exports explicitly include all currently opted-in records.

Profile preferences, consent withdrawal, full export and confirmed account deletion are supported. Creative records cascade on deletion. Recovery credentials for the deleted artist email are removed.

## Deployment prerequisites and remaining limits

Real Supabase credentials and approved SMTP settings are not available in this environment. SQL migrations and owner RLS can be exercised with embedded PostgreSQL tests; actual Supabase pooled-role behavior and live email delivery still need environment validation.

Production remains gated by PUBLIC_REGISTRATION_ENABLED. The development file adapter is single-process and disabled in production. Policy/controller contact details, retention/data-location decisions, Oman requirements and younger-user eligibility must be approved before public launch. No legal compliance claim is made.

No collaboration, Arabic tools, mobile PWA, melody/audio transcription or live AI is included in this release. English linguistic analysis is pronunciation/dataset-based and has dialect/coverage limitations.
