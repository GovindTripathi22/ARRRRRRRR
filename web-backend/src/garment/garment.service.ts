import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { LiveSessionService } from '../live-session/live-session.service';
import { LiveGarment } from '../types/live';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GarmentService {
  private readonly mlApiBase: string;

  constructor(
    private readonly liveSessionService: LiveSessionService,
    private readonly configService: ConfigService,
  ) {
    this.mlApiBase = this.configService.get<string>('ML_BACKEND_URL') || 'http://localhost:8000';
  }

  async scanGarment(sessionId: string, image: Buffer): Promise<LiveGarment> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

    try {
      if (!image || image.length === 0) {
        throw new Error('Invalid image data');
      }

      const formData = new FormData();
      const blob = new Blob([image], { type: 'image/jpeg' });
      formData.append('file', blob, 'garment.jpg');

      const response = await fetch(`${this.mlApiBase}/api/v1/garment/scan-garment`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`ML Backend error: ${response.statusText}`);
      }

      const mlResult = await response.json();
      const imageBase64 = `data:image/jpeg;base64,${image.toString('base64')}`;
      
      console.log(`[GarmentService] ML Backend Response:`, mlResult);

      const liveGarment: LiveGarment = {
        id: `garment_${Date.now()}`,
        imageUrl: mlResult.image || imageBase64, // Use processed image if available, else original
        type: mlResult.type || 'garment',
        fitRecommendation: {
          size: mlResult.dimensions?.recommended_size || 'M',
          fit: mlResult.dimensions?.recommended_size ? 'AI-Calculated' : 'Standard',
          confidence: mlResult.confidence || 0.8,
        },
      };

      console.log(`[GarmentService] Created LiveGarment object:`, liveGarment);

      await this.liveSessionService.addGarment(sessionId, liveGarment);
      return liveGarment;
    } catch (err) {
      // Fallback for demo/timeout
      const fallbackGarment: LiveGarment = {
        id: `gar_fallback_${Date.now()}`,
        imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=500',
        type: 'Shirt',
        fitRecommendation: {
          size: 'M',
          fit: 'Standard',
          confidence: 0.7,
        },
      };
      
      if (err.name === 'AbortError') {
        console.warn('ML Scan timed out, using fallback');
      } else {
        console.error('ML Scan failed:', err.message);
      }
      
      this.liveSessionService.addGarment(sessionId, fallbackGarment);
      return fallbackGarment;
    } finally {
      clearTimeout(timeout);
    }
  }
}
