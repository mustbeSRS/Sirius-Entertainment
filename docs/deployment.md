# Production setup — Supabase + Vercel-compatible hosting

No hosting, SMTP service, paid AI or billing has been provisioned by this implementation.

## Database

1. Create/select the founder-approved Supabase project. Confirm region, data transfers, backup retention, free-tier limits and the privacy/legal requirements.
2. Apply migrations in numeric order: 0001_foundation.sql, then 0002_creative_workspace.sql. Migration 1 is the foundation; migration 2 adds normalized creative records, owner RLS, recovery and admin isolation. These files are for a new installation; do not repeatedly apply a migration or edit one already deployed without a subsequent migration.
3. As database owner, provision a private LOGIN role that inherits `sirius_app` and can connect to the database. It must NOT own tables, have superuser, or BYPASSRLS. Give it a unique private generated password through secure environment settings. Never place it in source or chat.
4. Set DATABASE_URL to the TLS-verified direct/pooler connection for this restricted role. postgres.js uses prepare:false for pooler compatibility. Validate the selected Supabase pooler’s custom-role connection format; test transactions and RLS with two artist identities before relying on the connection.
5. No anon/authenticated REST client can access the tables. Creative queries use transaction-local studio.artist_id and owner policies. The backend identity/contact role is a trusted boundary and is not exposed to browsers.

## Hosting and environment

Import the repository into Vercel or an equivalent Node/Next.js host. Build `npm run build`; framework Next.js; Node 22+.

Required server-only variables:

- DATABASE_URL: restricted production database connection.
- APP_ORIGIN: exact externally visited origin. No wildcard, no path. Preview deployments need their own correct value.
- LOCAL_DEMO=false (also prohibited by production code).
- PUBLIC_REGISTRATION_ENABLED=false while setup/legal checks are pending.

Do not use NEXT_PUBLIC_ for secrets. WordNet data is included through outputFileTracingIncludes. Local piano samples are served from public/audio/piano. Verify deployment upload/function size limits against the bundled dataset rather than assuming any hosting free tier is unlimited.

## Verified recovery email

Configure a founder-approved SMTP sender with authenticated domain delivery:

- SMTP_HOST, SMTP_PORT (587 by default; 465 for implicit TLS).
- SMTP_USER and SMTP_PASSWORD if authentication is required.
- MAIL_FROM: approved verified sender address.

Ports other than 465 require STARTTLS. No SMTP provider is chosen or billed automatically. Test delivery, link origin, 15-minute expiry, one-time consumption and prior-session revocation. Missing configuration produces an explicit unavailable response. Development instead writes to ignored .data/mailbox.json; this adapter is never enabled in production.

## Administrator provisioning

Use a trusted database-owner connection to insert an approved email into admin_users with role contacts or owner. Administrators are provisioned separately, never through artist registration. Open `/admin`, request a link, and verify the email. Admin cookies are separate, expire after eight hours, and cannot authenticate as an artist. Local ADMIN_EMAILS is a development-only allowlist.

Contact view/export actions are audited. CSV export always filters current marketing consent and prevents spreadsheet formula execution. It contains no private writing. Assigning the contacts role authorizes contact administration only; there is no private-draft admin endpoint.

## Before public launch

- Real Supabase role/pooler/transaction/RLS integration tests, production Secure cookies and CSRF origin verification.
- Real SMTP delivery and recovery/replay tests; test account deletion and export against the deployed database.
- Controller identity/privacy contact, final privacy/terms, retention/backup expiry, provider regions/transfers, younger-user eligibility/consent, and applicable Oman review.
- Manual keyboard/screen-reader testing and real-device audio listening. Automated accessibility checks and audio decode tests have limits.
- Trusted edge rate limiting if hosting outside Vercel (the non-Vercel fallback is conservative/global). Configure monitoring, backup restore procedures, database size controls and contact-directory pagination for larger deployments.
- Only then set PUBLIC_REGISTRATION_ENABLED=true. A successful build alone does not establish production readiness.

## Preview for the founder

Use the cloud environment’s port-3000 browser preview. This does not require a local Mac development environment. There is no public Vercel URL until an approved hosting project and environment variables are configured.
