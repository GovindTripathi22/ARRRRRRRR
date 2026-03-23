import { Injectable, NotFoundException } from '@nestjs/common';
import { LiveSession, LiveGarment } from '../types/live';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class LiveSessionService {
  private sessions = new Map<string, LiveSession>();

  constructor(private readonly notificationService: NotificationService) {}

  createSession(sellerId: string): LiveSession {
    const id = Math.random().toString(36).substring(2, 9);
    const session: LiveSession = {
      id,
      sellerId,
      buyers: [],
      scannedGarments: [],
      status: 'active',
      lastUpdated: Date.now(),
      alerts: [],
    };
    this.sessions.set(id, session);
    return session;
  }

  getSession(id: string): LiveSession {
    const session = this.sessions.get(id);
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  joinSession(id: string, buyerId: string): LiveSession {
    const session = this.getSession(id);
    if (!session.buyers.includes(buyerId)) {
      session.buyers.push(buyerId);
      session.lastUpdated = Date.now();
    }
    return session;
  }

  addGarment(id: string, garment: LiveGarment): LiveSession {
    const session = this.getSession(id);
    session.scannedGarments.push(garment);
    session.activeGarmentId = garment.id;
    session.lastUpdated = Date.now();
    return session;
  }

  selectGarment(id: string, garmentId: string): LiveSession {
    const session = this.getSession(id);
    session.activeGarmentId = garmentId;
    session.lastUpdated = Date.now();
    return session;
  }

  requestSeller(id: string, buyerId: string): LiveSession {
    const session = this.getSession(id);
    const alert = `Buyer ${buyerId} requested interaction`;
    session.alerts.push(alert);
    session.lastUpdated = Date.now();
    this.notificationService.notifySeller(session.sellerId, alert);
    return session;
  }
}
