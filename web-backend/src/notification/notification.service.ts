import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  notifySeller(sellerId: string, message: string) {
    this.logger.log(`Notification for seller ${sellerId}: ${message}`);
    // In a real app, this would send a WebSocket message or push notification
  }
}
