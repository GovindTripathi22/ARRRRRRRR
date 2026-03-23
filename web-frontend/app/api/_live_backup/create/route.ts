import { NextRequest, NextResponse } from 'next/server';
import { LiveSession } from '@/lib/types';

// Use same in-memory store
const getSessionsStore = (): Map<string, LiveSession> => {
  if (!(global as any).liveSessions) {
    (global as any).liveSessions = new Map<string, LiveSession>();
  }
  return (global as any).liveSessions;
};

export async function POST(req: NextRequest) {
  const { sellerId } = await req.json();
  const sessions = getSessionsStore();
  
  const sessionId = Math.random().toString(36).slice(2, 9);
  const newSession: LiveSession = {
    id: sessionId,
    sellerId: sellerId || 'host_1',
    buyers: [],
    garments: [],
    lastUpdated: Date.now(),
    alerts: [],
  };
  
  sessions.set(sessionId, newSession);
  return NextResponse.json(newSession);
}
