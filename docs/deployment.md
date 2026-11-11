# Deployment — Vercel + Supabase

No deployment, paid service, or billing setup has been performed.

1. Create/select the approved Supabase project and confirm region, privacy/transfer requirements, free-tier constraints, and backups. Do not put credentials in chat or source.
2. Review/apply `supabase/migrations/0001_foundation.sql` using the database owner. Supabase provides anon/authenticated roles used by the migration. The migration creates a NOLOGIN `sirius_app` role; provision a separate LOGIN role with a generated private password and grant `sirius_app` to it. Do not grant table ownership/BYPASSRLS. Configure its verified TLS connection/pooler URL as DATABASE_URL. This custom-role/pooler path needs real integration testing in the selected project.
3. Import this repository into Vercel. Build: npm run build. Framework: Next.js. Configure DATABASE_URL and APP_ORIGIN as server-only environment variables. APP_ORIGIN is the exact deployment URL origin. Never prefix credentials with NEXT_PUBLIC_. Set LOCAL_DEMO=false. Keep PUBLIC_REGISTRATION_ENABLED=false while reviewing.
4. Deploy a restricted preview and run database/session tests against two separate artist profiles. Confirm anon and authenticated Supabase REST clients cannot read contacts/sessions. Test expiry/revocation and owner isolation. Confirm production cookies include Secure/HttpOnly/SameSite.
5. Add verified passwordless recovery, self-service deletion, admin isolation/audit, contact retention policies, final controller/contact details, younger-user and Oman legal review before enabling public registration.
6. Enable PUBLIC_REGISTRATION_ENABLED only after those launch checks. Production fails closed if the database is absent. A production build can succeed without connecting; it does not prove database readiness.

Preview URLs: set APP_ORIGIN per deployment. This cannot be wildcarded. The development adapter is unavailable in `next start`, even with LOCAL_DEMO=true. Do not deploy filesystem storage on Vercel.

GitHub: work is prepared on a feature branch. Merge after reviewing the Phase 1 scope. Configure hosting only when ready to review a concrete deployment.
