# Architecture and trust boundaries

## Repository

```
src/app/             Next.js App Router pages and API routes
src/components/      Registration and responsive studio shell
src/lib/             Validation, session cryptography, persistence
supabase/migrations/ Versioned PostgreSQL migrations
tests/               Unit tests
 e2e/                Browser acceptance tests (under tests)
docs/                Product, design, deployment, verification
```

Next.js server components read the session; protected server API routes handle mutations. Contacts never need to enter a public Supabase browser client. Tailwind v4 and CSS design tokens style the shell; Lucide icons are used. shadcn/ui and Tiptap are reserved for editor/project work rather than added as unused dependencies.

## Identity

A 256-bit random token is sent only in an HttpOnly, SameSite=Lax cookie; Secure is set in production. The server stores SHA-256(token), artist ID, expiration, and revocation. Current lifetime: 30 days, absolute, no sliding renewal. No IP identity or fingerprinting. Unverified email uniqueness blocks duplicate registration but cannot authenticate or recover an account. Registration does not create any admin role.

Exact-origin checking protects mutations. Registration rate limits are stored server-side; production SQL uses an advisory transaction lock. Vercel trusted network headers supply an abuse bucket, stored hashed and expired within one hour; this is not identity. Other deployments must add trusted edge throttling; the global fallback intentionally limits registration conservatively. JSON requests are size bounded. Errors do not expose SQL or credentials.

## Database

Supabase PostgreSQL via a server-only connection. Use a dedicated login inheriting `sirius_app`, never a table-owner/superuser/service-role credential. The migration enables RLS on all tables and gives no anon/authenticated table access. The Phase 1 backend role can operate on profiles/sessions/consent/abuse records; each HTTP operation resolves identity from the session and never accepts a caller-provided owner ID. Backend credentials are therefore a sensitive trust boundary. Projects/preferences have no access policy until their owner-scoped implementation in Phase 2. Future writing policies must enforce ownership at SQL level as well as in routes.

Registration inserts the artist, initial consent event and session in one transaction. Session lookup checks expiry, revocation and active account. Consent changes and consent audit insertion share a transaction. Development uses an explicit serialized file adapter with atomic file replacement, restricted to one development process. It is not Supabase and cannot run in production.

## Remaining normalized schema (future migrations)

- projects: owner, title, description, type, status, position, cover, tags, deadlines, timestamps.
- writing_pieces: owner, project, kind, title, state, revision, timestamps.
- writing_sections: piece, owner, section name, structured editor JSON, position, revision.
- draft_versions: owner, piece, snapshot JSON, name, timestamp; preserve current before restore.
- ideas: owner, type, body, tags, collection, project, favorite, archive timestamps.
- tasks: owner, project/piece/section associations, title, checklist, priority, due date, status, position.
- saved_words: owner, term, source, meaning, pronunciation, notes.
- user_preferences: owner, theme, language, editor preferences.
- admin_users: separately verified auth identity and explicit assigned roles.
- admin_audit: actor, action, contact scope, timestamp, export reason; no private drafts.
- recovery_tokens: hashed one-time, expiring, purpose-bound tokens; verified delivery; revoke prior credentials as appropriate.

Use compound ownership constraints for child relationships, index owner queries, and never expose other owners through guessed UUIDs.

## Providers and costs

Supabase database and Vercel-compatible hosting are required for production; GitHub stores source. Verified recovery needs an approved transactional email provider. Free-tier eligibility and limits must be checked at setup; no billing is enabled here. Core language tools will use approved dictionary/pronunciation sources with license and availability checks. AI provider interface will remain disabled without explicit approval and server-side limits.
