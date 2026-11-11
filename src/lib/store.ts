import 'server-only';
import postgres from 'postgres';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
export type Artist = { id: string; full_name: string; email: string; phone: string; marketing_consent: boolean; consent_at: string; privacy_version: string; created_at: string };
type Session = { token_hash: string; artist_id: string; expires_at: string };
type State = { artists: Artist[]; sessions: Session[]; events: { artist_id: string; consent: boolean; at: string }[]; attempts: { key: string; at: number }[] };
const sql = process.env.DATABASE_URL ? postgres(process.env.DATABASE_URL, { max: 3, prepare: false }) : null;
export const demoMode = !sql && process.env.LOCAL_DEMO === 'true' && process.env.NODE_ENV !== 'production';
const dataDir = process.env.LOCAL_DATA_DIR || '.data';
let queue = Promise.resolve();
async function local<T>(action: (state: State) => T): Promise<T> {
 if (!demoMode) throw new Error('Database is not configured. Registration is unavailable.');
 let result!: T;
 const task = queue.then(async () => { await mkdir(dataDir, { recursive: true }); let state: State;
 try { state = JSON.parse(await readFile(`${dataDir}/studio.json`,'utf8')); } catch (e) { if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e; state = {artists:[],sessions:[],events:[],attempts:[]}; }
 result = action(state); await writeFile(`${dataDir}/studio.tmp`,JSON.stringify(state),{mode:0o600}); await rename(`${dataDir}/studio.tmp`,`${dataDir}/studio.json`); }); queue = task.then(()=>{},()=>{}); await task; return result;
}
export async function register(input: {fullName:string;email:string;phone:string;marketing:boolean}, hash:string, expires:string) {
 const artist: Artist = {id:randomUUID(),full_name:input.fullName,email:input.email,phone:input.phone,marketing_consent:input.marketing,consent_at:new Date().toISOString(),privacy_version:'draft-2026-11',created_at:new Date().toISOString()};
 if (sql) await sql.begin(async tx => { await tx`insert into artist_profiles ${sql(artist)}`; await tx`insert into artist_sessions ${sql({token_hash:hash,artist_id:artist.id,expires_at:expires})}`; await tx`insert into consent_events (artist_id,consent,policy_version) values (${artist.id},${input.marketing},${artist.privacy_version})`; });
 else await local(s=>{ if(s.artists.some(a=>a.email===artist.email)) throw new Error('Registration could not be completed. If you previously registered, recovery will be required.'); s.artists.push(artist);s.sessions.push({token_hash:hash,artist_id:artist.id,expires_at:expires});s.events.push({artist_id:artist.id,consent:input.marketing,at:artist.consent_at}); });
 return artist;
}
export async function findArtist(hash:string):Promise<Artist|null> {
 if(sql) {const rows=await sql<Artist[]>`select a.* from artist_profiles a join artist_sessions s on a.id=s.artist_id where s.token_hash=${hash} and s.expires_at>now() and s.revoked_at is null and a.account_status='active'`;return rows[0]||null;}
 return local(s=>{const session=s.sessions.find(x=>x.token_hash===hash && Date.parse(x.expires_at)>Date.now());return s.artists.find(a=>a.id===session?.artist_id)||null;});
}
export async function revoke(hash:string) { if(sql) await sql`update artist_sessions set revoked_at=now() where token_hash=${hash}`;else await local(s=>{s.sessions=s.sessions.filter(x=>x.token_hash!==hash);}); }
export async function consent(id:string,value:boolean) {if(sql) await sql.begin(async tx=>{await tx`update artist_profiles set marketing_consent=${value},consent_at=now() where id=${id}`;await tx`insert into consent_events (artist_id,consent,policy_version) values (${id},${value},'draft-2026-11')`;});else await local(s=>{const a=s.artists.find(a=>a.id===id);if(!a)throw Error('Not found');a.marketing_consent=value;a.consent_at=new Date().toISOString();s.events.push({artist_id:id,consent:value,at:a.consent_at});});}
export async function rateLimit(key:string):Promise<boolean> {
 if(sql){const rows=await sql`select take_registration_slot(${key}) as allowed`;return rows[0].allowed;}
 return local(s=>{s.attempts=s.attempts.filter(a=>a.at>Date.now()-3600000);if(s.attempts.filter(a=>a.key===key).length>=5)return false;s.attempts.push({key,at:Date.now()});return true;});
}
