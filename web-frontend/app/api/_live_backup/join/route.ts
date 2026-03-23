import { NextRequest, NextResponse } from 'next/server';
import { LiveSession } from '@/lib/types';

const getSessionsStore = (): Map<string, LiveSession> => {
  if (!(global as any).liveSessions) {
    (global as any).liveSessions = new Map<string, LiveSession>();
  }
  return (global as any).liveSessions;
};

export async function POST(req: NextRequest) {
  const { sessionId, buyerId } = await req.json();
  const sessions = getSessionsStore();
  
  if (!sessions.has(sessionId)) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
  
  const session = sessions.get(sessionId)!;
  if (!session.buyers.includes(buyerId)) {
    session.buyers.push(buyerId);
    session.lastUpdated = Date.now();
  }
  
  return NextResponse.json(session);
}
