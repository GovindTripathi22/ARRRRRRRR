export interface LiveGarment {
  id: string;
  imageUrl: string;
  type: string;
  fitRecommendation?: {
    size: string;
    fit: string;
    confidence: number;
  };
}

export interface LiveSession {
  id: string;
  sellerId: string;
  buyers: string[];
  scannedGarments: LiveGarment[];
  activeGarmentId?: string;
  status: 'active' | 'ended';
  lastUpdated: number;
  alerts: string[];
}
