begin;
alter table projects add column description text not null default '',add column color text not null default '#9b36df',add column tags jsonb not null default '[]',add column deadline text not null default '',add column archived boolean not null default false;
alter table projects add constraint projects_owner_id unique(artist_id,id);
alter table projects add constraint projects_status_check check(status in('ideas','developing','writing','revising','completed'));
alter table user_preferences add column collapsed boolean not null default false;
create table writing_pieces(id uuid primary key,artist_id uuid not null references artist_profiles on delete cascade,project_id uuid,title text not null,kind text not null check(kind in('song','poem')),status text not null default 'ideas' check(status in('ideas','developing','writing','revising','completed')),revision integer not null default 0,pinned boolean not null default false,archived boolean not null default false,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(artist_id,id),foreign key(artist_id,project_id) references projects(artist_id,id) on delete set null(project_id));
create table writing_sections(id uuid primary key,artist_id uuid not null references artist_profiles on delete cascade,piece_id uuid not null,name text not null,content text not null default '',richtext jsonb,position integer not null,foreign key(artist_id,piece_id) references writing_pieces(artist_id,id) on delete cascade);
create table draft_versions(id uuid primary key,artist_id uuid not null references artist_profiles on delete cascade,piece_id uuid not null,name text not null,title text not null,sections jsonb not null,created_at timestamptz not null default now(),foreign key(artist_id,piece_id) references writing_pieces(artist_id,id) on delete cascade);
create table ideas(id uuid primary key,artist_id uuid not null references artist_profiles on delete cascade,project_id uuid,title text not null default '',body text not null,type text not null,tags jsonb not null default '[]',collection text not null default '',favorite boolean not null default false,archived boolean not null default false,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),foreign key(artist_id,project_id) references projects(artist_id,id) on delete set null(project_id));
create table tasks(id uuid primary key,artist_id uuid not null references artist_profiles on delete cascade,project_id uuid,title text not null,due_date text not null default '',priority text not null default 'medium' check(priority in('low','medium','high')),completed boolean not null default false,checklist jsonb not null default '[]',created_at timestamptz not null default now(),updated_at timestamptz not null default now(),foreign key(artist_id,project_id) references projects(artist_id,id) on delete set null(project_id));
create table saved_words(id uuid primary key,artist_id uuid not null references artist_profiles on delete cascade,word text not null,note text not null default '',source text not null,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table chord_progressions(id uuid primary key,artist_id uuid not null references artist_profiles on delete cascade,title text not null,key text not null,mode text not null,chords jsonb not null,genre text not null default '',mood text not null default '',bpm integer not null default 80,sustain numeric not null default 3,project_id uuid,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),foreign key(artist_id,project_id) references projects(artist_id,id) on delete set null(project_id));
-- Every creative table is owner-scoped at SQL level as well as in HTTP handlers.
do $$ declare t text; begin
 foreach t in array array['projects','user_preferences','writing_pieces','writing_sections','draft_versions','ideas','tasks','saved_words','chord_progressions'] loop
 execute format('alter table %I enable row level security',t);
 execute format('grant select,insert,update,delete on %I to sirius_app',t);
 execute format('revoke all on %I from anon,authenticated',t);
 execute format('create policy owner_access on %I to sirius_app using(artist_id=nullif(current_setting(''studio.artist_id'',true),'''')::uuid) with check(artist_id=nullif(current_setting(''studio.artist_id'',true),'''')::uuid)',t);
 execute format('create index on %I(artist_id)',t);
 end loop;
end $$;
create table recovery_tokens(token_hash text primary key,email text not null,purpose text not null check(purpose in('artist','admin')),expires_at timestamptz not null,used_at timestamptz,created_at timestamptz not null default now());
create table admin_users(email text primary key,role text not null check(role in('contacts','owner')),created_at timestamptz not null default now());
create table admin_sessions(token_hash text primary key,email text not null references admin_users on delete cascade,expires_at timestamptz not null);
create table admin_audit(id uuid primary key default gen_random_uuid(),email text not null,action text not null,created_at timestamptz not null default now());
alter table artist_profiles add column return_count integer not null default 0,add column calling_code text not null default '';
update artist_profiles set calling_code='+968' where phone like '+968%';
grant update(preferred_name,city,country,discipline,creative_interests,last_active_at,return_count,email_verified_at) on artist_profiles to sirius_app;
grant delete on artist_profiles to sirius_app;
grant delete on artist_sessions to sirius_app;
grant select,insert,update,delete on recovery_tokens to sirius_app;
grant select on admin_users to sirius_app;
grant select,insert,delete on admin_sessions to sirius_app;
grant insert,select on admin_audit to sirius_app;
do $$ declare t text; begin foreach t in array array['recovery_tokens','admin_users','admin_sessions','admin_audit'] loop
 execute format('alter table %I enable row level security',t);
 execute format('revoke all on %I from anon,authenticated',t);
 execute format('create policy server_only on %I to sirius_app using(true) with check(true)',t);
 end loop;end $$;
commit;
