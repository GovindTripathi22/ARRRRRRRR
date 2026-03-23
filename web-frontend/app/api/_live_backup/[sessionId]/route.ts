import { NextRequest, NextResponse } from 'next/server';
import { LiveSession } from '@/lib/types';

// In-memory session store (hackathon-safe persistence in global)
const getSessionsStore = (): Map<string, LiveSession> => {
  if (!(global as any).liveSessions) {
    (global as any).liveSessions = new Map<string, LiveSession>();
  }
  return (global as any).liveSessions;
};

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const { sessionId } = params;
  const sessions = getSessionsStore();

  if (!sessions.has(sessionId)) {
    // Initialize session if not exists
    const newSession: LiveSession = {
      id: sessionId,
      sellerId: 'default-seller',
      buyers: [],
      garments: [],
      lastUpdated: Date.now(),
      alerts: [],
    };
    sessions.set(sessionId, newSession);
  }

  const session = sessions.get(sessionId);
  return NextResponse.json(session);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const { sessionId } = params;
  const sessions = getSessionsStore();

  try {
    const { action } = await req.json();

    if (action === 'end') {
      sessions.delete(sessionId);
      return NextResponse.json({ success: true, message: 'Session ended' });
    }

    if (action === 'clearAlerts') {
      const session = sessions.get(sessionId);
      if (session) {
        session.alerts = [];
        session.lastUpdated = Date.now();
        return NextResponse.json(session);
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
