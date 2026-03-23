import { NextRequest, NextResponse } from 'next/server';
import { LiveSession } from '@/lib/types';

const getSessionsStore = (): Map<string, LiveSession> => {
  if (!(global as any).liveSessions) {
    (global as any).liveSessions = new Map<string, LiveSession>();
  }
  return (global as any).liveSessions;
};

export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const { sessionId } = params;
  const sessions = getSessionsStore();
  const session = sessions.get(sessionId);

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  try {
    const { action, buyerId, garmentId } = await req.json();

    if (action === 'requestSeller') {
      const alert = `Buyer ${buyerId || 'Anonymous'} requested interaction!`;
      session.alerts.push(alert);
      session.lastUpdated = Date.now();
      return NextResponse.json(session);
    }

    if (action === 'selectGarment') {
      const garment = session.garments.find((g) => g.id === garmentId);
      if (garment) {
        session.activeGarment = garment;
        session.lastUpdated = Date.now();
        return NextResponse.json(session);
      }
      return NextResponse.json({ error: 'Garment not found' }, { status: 404 });
    }

    if (action === 'join') {
        if (!session.buyers.includes(buyerId)) {
            session.buyers.push(buyerId);
            session.lastUpdated = Date.now();
        }
        return NextResponse.json(session);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}
