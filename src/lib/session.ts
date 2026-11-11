import 'server-only';
import { cookies } from 'next/headers';
import { findArtist } from './store';
import { tokenHash } from './security';
export const cookieName = 'sirius_session';
export async function currentArtist() { const token=(await cookies()).get(cookieName)?.value; if(!token)return null;return findArtist(tokenHash(token)); }
