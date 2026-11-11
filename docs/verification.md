# Phase 1 verification — 11 November 2026

- `npm test`: 4 unit tests passed (normalization/default consent, invalid contacts/terms, random token/hash properties, origin rejection).
- `npm run test:e2e`: 1 browser acceptance journey passed in Chromium. Checks registration with marketing declined; name recognition after reload; HttpOnly/SameSite and persistent cookie; hashed server storage; consent opt-in and withdrawal; owner profile export; cross-origin rejection; anonymous and forged session rejection; two separate registered artists receive different profiles; mobile layout without horizontal overflow; session revocation and replay rejection; server-side expired-session rejection.
- `npm run build`: passed optimized production build.
- `npm run typecheck`: passed after production build.
- Desktop and 390px-wide mobile screenshots inspected. Development toolbar was disabled after it intercepted mobile navigation in the initial browser run. A screenshot-timing hydration warning was removed by waiting for the page to settle before capture; final browser run had no hydration warning.
- Supabase migrations, custom database role, database RLS and deployed Secure-cookie behavior have **not** been exercised against real infrastructure. No database credentials were provided.
- GitHub clone succeeded (empty repository). CLI authentication reports an invalid token and Git push dry-run fails for missing HTTPS credentials. Source is locally committed on `feat/phase-1-foundation`; no remote branch or deployment is claimed.
- Public registration is disabled by default. Legal text, branding, recovery, deletion and launch privacy review remain pending.

Screenshots are local test artifacts in ignored `work/screenshots/`, not source-controlled. Real personal data and development session stores are excluded from Git.

## SIRIUS branding update

Reviewed both supplied PDFs as visual references. Extracted existing logo artwork from SRSPRNT.pdf page 1 without redrawing/recoloring. Added shared brand component, violet/silver tokens, gradient accents and bold heading typography. The documents’ rental content is not incorporated as product instructions.

Re-ran production build, TypeScript, 4 unit checks and browser acceptance journey successfully. Inspected updated desktop welcome/dashboard and mobile screens. Dark-mode primary button white text contrast at gradient endpoints: 5.55:1 and 8.52:1; secondary text on panels: 8.38:1. These checks do not constitute a full accessibility audit.

GitHub connection subsequently confirmed with repository push permission. Initial authentication failure above is historical. See the repository branches/PR for current publishing state.

Screenshots in docs/previews contain invented test identity only. Branding UI colors are derived from supplied references, not official spot-color specifications.

## Full creative studio release verification

- `npm test`: 12 tests pass across registration/security, pronunciation/music theory, and embedded PostgreSQL migrations/RLS. Database cases prove anonymous contact denial, owner isolation, rejected cross-owner children, registration throttling and denial of admin provisioning by the application role.
- `npm run typecheck` and optimized `npm run build`: pass.
- `npm run test:e2e`: 4 actual Chromium acceptance journeys pass: registration/session/consent; projects/tasks/writing/autosave/conflicts/snapshots/ideas/dictionaries/chord playback and persistence; recovery/replay/admin/consent export/deletion; mobile interrupted-save recovery/contextual insertion/TXT+Markdown+PDF exports.
- Axe checks for WCAG A/AA and WCAG 2.1 AA on the mobile editor and chord page report no violations in those tested states. This is not a complete accessibility certification.
- 390px-wide mobile editor and chord pages have no horizontal document overflow; mobile creative tools default closed and open in a dismissible drawer.
- Piano samples load/decode, play state advances, sequence stop cancels, and saved sustain persists. Automated tests cannot establish perceived speaker/headphone sound quality; a real-device listening pass remains necessary.
- Production-mode smoke test on port 3100: welcome 200; anonymous workspace 401; chord page redirects to registration; admin renders verified-access form; public registration 503 while gated; recovery 503 without SMTP; locally served piano sample 200. Production file-demo access is disabled.
- Removed an old WordNet access wrapper whose prototype shim broke production prerendering. The direct index/data adapter builds successfully and returns real dictionary entries.
- Snapshots/Back navigation drain queued saves; stale revisions fail with 409 and local copies remain recoverable.
- Admin export includes only currently opted-in, email-verified contacts. Tests check both opt-out exclusion and verified opt-in inclusion. Administrators cannot read creative workspace routes with an admin cookie.
- Form labels and native-dialog names are explicit; a CSS utility collision hiding the sidebar toggle was corrected. Heavy creative panels load on demand.
- Actual Supabase pooled-role operation, live SMTP delivery, hosting configuration and legal launch review are still external requirements; no public deployment or paid provider is claimed.

Current screenshots in docs/previews show the functional app using invented test data only.
