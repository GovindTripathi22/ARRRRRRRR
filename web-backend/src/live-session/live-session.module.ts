import { Module } from '@nestjs/common';
import { LiveSessionService } from './live-session.service';
import { LiveSessionController } from './live-session.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  providers: [LiveSessionService],
  controllers: [LiveSessionController],
  exports: [LiveSessionService],
})
export class LiveSessionModule {}
