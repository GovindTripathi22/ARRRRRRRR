import { Controller, Post, Body, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GarmentService } from './garment.service';

@Controller('garment')
export class GarmentController {
  constructor(private readonly garmentService: GarmentService) {}

  @Post('scan')
  @UseInterceptors(FileInterceptor('image'))
  async scan(
    @Body('sessionId') sessionId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.garmentService.scanGarment(sessionId, file.buffer);
  }
}
