import { redirect } from 'next/navigation';
import { currentArtist } from '@/lib/session';
import { demoMode } from '@/lib/store';
import { Workspace } from '@/components/workspace';
export default async function Studio(){const artist=await currentArtist();if(!artist)redirect('/');return <Workspace name={artist.full_name.split(' ')[0]} marketing={artist.marketing_consent} demo={demoMode}/>}
