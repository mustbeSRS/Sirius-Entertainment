begin;
-- gen_random_uuid is built into PostgreSQL 13 and later.
create table artist_profiles (
 id uuid primary key default gen_random_uuid(), full_name text not null check(length(full_name) between 2 and 120),
 email text not null check(email=lower(email)), phone text not null check(phone ~ '^\+[1-9][0-9]{7,14}$'),
 preferred_name text, city text, country text, discipline text, creative_interests text[] not null default '{}',
 marketing_consent boolean not null default false, consent_at timestamptz not null default now(), privacy_version text not null,
 email_verified_at timestamptz, account_status text not null default 'active' check(account_status in ('active','suspended','deleted')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), last_active_at timestamptz
);
create unique index artist_email_unique on artist_profiles(lower(email));
create table artist_sessions(token_hash text primary key check(length(token_hash)=64),artist_id uuid not null references artist_profiles on delete cascade, expires_at timestamptz not null, revoked_at timestamptz, created_at timestamptz not null default now());
create index sessions_artist on artist_sessions(artist_id);
create table consent_events(id uuid primary key default gen_random_uuid(),artist_id uuid not null references artist_profiles on delete cascade,consent boolean not null,policy_version text not null,created_at timestamptz not null default now());
create table registration_attempts(key text not null, created_at timestamptz not null default now());
create index attempts_key_time on registration_attempts(key,created_at);
-- One transaction-scoped advisory lock prevents parallel requests bypassing the limit.
create function take_registration_slot(p_key text) returns boolean language plpgsql security invoker set search_path=public as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(p_key,0));
 delete from registration_attempts where created_at < now()-interval '1 hour';
 if (select count(*) from registration_attempts where key=p_key)>=5 then return false; end if;
 insert into registration_attempts(key) values(p_key); return true;
end $$;
create table projects(id uuid primary key default gen_random_uuid(),artist_id uuid not null references artist_profiles on delete cascade,title text not null,type text not null,status text not null default 'ideas',position integer not null default 0,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table user_preferences(artist_id uuid primary key references artist_profiles on delete cascade,theme text not null default 'dark' check(theme in ('dark','light')),updated_at timestamptz not null default now());
-- Browser clients have no table access. The restricted server connection is the only Phase 1 data path.
-- Dedicated deployment role: no table ownership, no superuser, no BYPASSRLS.
create role sirius_app nologin;
grant usage on schema public to sirius_app;
grant select,insert on artist_profiles to sirius_app;
grant update(marketing_consent,consent_at) on artist_profiles to sirius_app;
grant select,insert on artist_sessions to sirius_app;
grant update(revoked_at) on artist_sessions to sirius_app;
grant insert on consent_events to sirius_app;
grant select,insert,delete on registration_attempts to sirius_app;
revoke all on function take_registration_slot(text) from public;
grant execute on function take_registration_slot(text) to sirius_app;
alter table artist_profiles enable row level security;
alter table artist_sessions enable row level security;
alter table consent_events enable row level security;
alter table registration_attempts enable row level security;
alter table projects enable row level security;
alter table user_preferences enable row level security;
create policy server_profiles on artist_profiles to sirius_app using(true) with check(true);
create policy server_sessions on artist_sessions to sirius_app using(true) with check(true);
create policy server_consent on consent_events for insert to sirius_app with check(true);
create policy server_throttle on registration_attempts to sirius_app using(true) with check(true);
revoke all on artist_profiles,artist_sessions,consent_events,registration_attempts,projects,user_preferences from anon,authenticated;
-- No project policies/grants until owner-scoped access is implemented in Phase 2.
commit;
