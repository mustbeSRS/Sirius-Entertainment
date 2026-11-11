import { NextResponse } from 'next/server';
import { registrationSchema } from '@/lib/validation';
import { assertOrigin,newToken,tokenHash,SESSION_DAYS } from '@/lib/security';
import { register,rateLimit } from '@/lib/store';
import { cookieName } from '@/lib/session';
export async function POST(request:Request) {
 if(process.env.NODE_ENV==='production' && process.env.PUBLIC_REGISTRATION_ENABLED!=='true')return NextResponse.json({error:'Public registration is not open yet.'},{status:503});
 try {assertOrigin(request);}catch{return NextResponse.json({error:'Request origin rejected.'},{status:403});}
 if(Number(request.headers.get('content-length')||0)>8192)return NextResponse.json({error:'Request too large.'},{status:413});
 try {
 const body=await request.text();if(body.length>8192)return NextResponse.json({error:'Request too large.'},{status:413});
 const input=registrationSchema.safeParse(JSON.parse(body));if(!input.success)return NextResponse.json({error:input.error.issues[0].message},{status:400});
 // Network metadata is used for abuse throttling only, never identity. Vercel supplies this header in production.
 const network=process.env.VERCEL ? request.headers.get('x-vercel-forwarded-for')||'unknown' : 'local';
 if(!await rateLimit(tokenHash(network)))return NextResponse.json({error:'Too many attempts. Please try again in an hour.'},{status:429});
 const token=newToken();await register(input.data,tokenHash(token),new Date(Date.now()+SESSION_DAYS*86400000).toISOString());
 const response=NextResponse.json({ok:true});response.cookies.set(cookieName,token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:SESSION_DAYS*86400});return response;
 }catch{return NextResponse.json({error:'Registration is unavailable or this address is already registered. Existing accounts require verified recovery; contact matching cannot restore access.'},{status:409});}
}
