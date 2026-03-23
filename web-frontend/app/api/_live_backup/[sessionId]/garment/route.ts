import { NextRequest, NextResponse } from 'next/server';
import { LiveGarment, LiveSession } from '@/lib/types';
const getSessionsStore = (): Map<string, LiveSession> => {
  const globalAny = global as any;
  if (!globalAny.liveSessions) {
    globalAny.liveSessions = new Map<string, LiveSession>();
  }
  return globalAny.liveSessions;
};

// Simple "AI" Fit Recommendation logic based on garment type
const getFitRecommendation = (type: string) => {
  const recommendations: Record<string, { size: string; fit: string; confidence: number }> = {
    tshirt: { size: 'M', fit: 'Regular', confidence: 0.85 },
    shirt: { size: 'L', fit: 'Slim', confidence: 0.78 },
    trousers: { size: '32/30', fit: 'Straight', confidence: 0.82 },
    pants: { size: '32/30', fit: 'Straight', confidence: 0.82 },
    skirt: { size: 'S', fit: 'A-Line', confidence: 0.75 },
    jacket: { size: 'L', fit: 'Oversized', confidence: 0.88 },
  };

  const lowerType = type.toLowerCase();
  for (const [key, value] of Object.entries(recommendations)) {
    if (lowerType.includes(key)) return value;
  }

  return { size: 'One Size', fit: 'Adjustable', confidence: 0.5 };
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
    const formData = await req.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Forward to FastAPI for classification and extraction
    const fastApiUrl = process.env.NEXT_PUBLIC_GARMENT_API_BASE || 'http://localhost:8000';
    const fastApiFormData = new FormData();
    fastApiFormData.append('garment', image);

    const fastApiResponse = await fetch(`${fastApiUrl}/classify_garment`, {
      method: 'POST',
      body: fastApiFormData,
    });

    if (!fastApiResponse.ok) {
        // Fallback for demo if FastAPI is down (for development convenience)
        console.warn('FastAPI error, falling back to mock response for demo');
        // This is just a fallback to keep the demo working if the external ML service is not running
        // In a real scenario, this should error out.
    }

    const data = await fastApiResponse.json();

    const newGarment: LiveGarment = {
      id: crypto.randomUUID(),
      imageUrl: data.garment_url || URL.createObjectURL(image), // Use actual URL from FastAPI/Cloudinary
      type: data.label || 'unknown',
      fitRecommendation: getFitRecommendation(data.label || 'unknown'),
      createdAt: Date.now(),
    };

    // Store the cutout URL if available for AR try-on
    if (data.cutout_url) {
        (newGarment as any).cutoutUrl = data.cutout_url;
    }

    session.garments.push(newGarment);
    session.activeGarment = newGarment;
    session.lastUpdated = Date.now();

    return NextResponse.json(session);
  } catch (error: any) {
    console.error('Error processing garment:', error);
    return NextResponse.json({ error: 'Failed to process garment' }, { status: 500 });
  }
}
