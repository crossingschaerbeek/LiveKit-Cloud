import { AccessToken } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { room, role, language, adminKey } = await request.json();
  const languages = ['FLOOR','EN','FR','DE'];
  if (typeof room !== 'string' || !/^[a-zA-Z0-9_-]{3,60}$/.test(room) || !['listener','interpreter','floor'].includes(role) || !languages.includes(language)) {
    return NextResponse.json({error:'Invalid request'}, {status:400});
  }
  if (role !== 'listener' && (!process.env.DEMO_ADMIN_KEY || adminKey !== process.env.DEMO_ADMIN_KEY)) {
    return NextResponse.json({error:'Unauthorized publisher'}, {status:403});
  }
  if ((role === 'floor' && language !== 'FLOOR') || (role === 'interpreter' && language === 'FLOOR')) {
    return NextResponse.json({error:'Invalid publishing channel'}, {status:400});
  }
  if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET || !process.env.LIVEKIT_URL) {
    return NextResponse.json({error:'Server is not configured'}, {status:503});
  }
  const identity = `${role}-${language}-${crypto.randomUUID()}`;
  const token = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {identity, ttl:'2h', metadata:JSON.stringify({role,language})});
  token.addGrant({roomJoin:true, room, canPublish:role !== 'listener', canSubscribe:true, canPublishData:false, ...(role !== 'listener' ? {canPublishSources:['microphone' as const]} : {})});
  return NextResponse.json({token:await token.toJwt(), url:process.env.LIVEKIT_URL});
}
