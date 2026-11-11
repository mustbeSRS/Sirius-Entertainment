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
