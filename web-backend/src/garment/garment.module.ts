import { Module } from '@nestjs/common';
import { GarmentService } from './garment.service';
import { GarmentController } from './garment.controller';
import { LiveSessionModule } from '../live-session/live-session.module';

@Module({
  imports: [LiveSessionModule],
  providers: [GarmentService],
  controllers: [GarmentController],
})
export class GarmentModule {}
