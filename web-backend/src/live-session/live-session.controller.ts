import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { LiveSessionService } from './live-session.service';

@Controller('live')
export class LiveSessionController {
  constructor(private readonly liveSessionService: LiveSessionService) {}

  @Post('create')
  create(@Body('sellerId') sellerId: string) {
    return this.liveSessionService.createSession(sellerId);
  }

  @Post('join')
  join(@Body('sessionId') sessionId: string, @Body('buyerId') buyerId: string) {
    return this.liveSessionService.joinSession(sessionId, buyerId);
  }

  @Post('request-seller')
  requestSeller(@Body('sessionId') sessionId: string, @Body('buyerId') buyerId: string) {
    return this.liveSessionService.requestSeller(sessionId, buyerId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.liveSessionService.getSession(id);
  }

  @Post('select-garment')
  selectGarment(@Body('sessionId') sessionId: string, @Body('garmentId') garmentId: string) {
    return this.liveSessionService.selectGarment(sessionId, garmentId);
  }
}
