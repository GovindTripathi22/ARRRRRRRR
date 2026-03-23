'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Sparkles, 
  ShoppingBag, 
  MessageSquare, 
  Scan, 
  UserCircle2,
  ChevronRight,
  Info,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { LiveSession, LiveGarment } from '@/lib/types';
import { useTryonStore } from '@/lib/tryon-store';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function BuyerPage({ params }: { params: { sessionId: string } }) {
  const { sessionId } = params;
  const router = useRouter();
  const [session, setSession] = useState<LiveSession | null>(null);
  const [buyerId] = useState(() => `buyer-${Math.floor(Math.random() * 1000)}`);
  const { setSelectedLiveGarment, setMode } = useTryonStore();

  // Poll for session updates
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/live/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          setSession(data);
        }
      } catch (err) {
        console.error('Failed to poll session:', err);
      }
    };

    // Join session on mount
    fetch(`/api/live/${sessionId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join', buyerId }),
    });

    fetchSession();
    const interval = setInterval(fetchSession, 2000);
    return () => clearInterval(interval);
  }, [sessionId, buyerId]);

  const requestInteraction = async () => {
    try {
      const res = await fetch(`/api/live/${sessionId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'requestSeller', buyerId }),
      });
      if (res.ok) {
        toast.success('Seller notified! They will respond shortly.');
      }
    } catch (err) {
      toast.error('Failed to send request');
    }
  };

  const startTryOn = () => {
    if (!session?.activeGarment) return;
    
    // Handoff to AR store
    setSelectedLiveGarment(session.activeGarment);
    setMode('ar');
    router.push('/try-on');
    toast.success('Switching to AR Try-On...');
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-muted-foreground flex items-center gap-2">
          <RefreshCw className="animate-spin h-4 w-4" /> Connecting to live session...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 pb-24 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider">Live Shopping</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
            <UserCircle2 className="h-3 w-3" /> {session.buyers.length} watching
        </div>
      </div>

      {/* Main Product Card */}
      <Card className="overflow-hidden border-2 border-primary/20 shadow-xl bg-gradient-to-b from-card to-background">
        <div className="aspect-[3/4] relative bg-white flex items-center justify-center p-4">
          {session.activeGarment ? (
             <Image 
                src={session.activeGarment.imageUrl} 
                alt="Active Garment" 
                fill 
                className="object-contain p-4"
                priority
             />
          ) : (
            <div className="text-center space-y-3 p-8">
              <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mx-auto" />
              <p className="text-muted-foreground text-sm">Waiting for seller to showcase a garment...</p>
            </div>
          )}
          
          {session.activeGarment && (
            <div className="absolute top-4 right-4 animate-bounce">
                <div className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
                    HOT PICK
                </div>
            </div>
          )}
        </div>

        {session.activeGarment && (
          <div className="p-5 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold capitalize">{session.activeGarment.type}</h2>
                <div className="flex items-center gap-2 text-sm text-primary mt-1 font-medium">
                    <Sparkles className="h-4 w-4" />
                    AI Recommendation
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Recommended Size</p>
                    <p className="text-lg font-bold">{session.activeGarment.fitRecommendation?.size}</p>
                </div>
                <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Fit Style</p>
                    <p className="text-lg font-bold">{session.activeGarment.fitRecommendation?.fit}</p>
                </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                <Info className="h-4 w-4 flex-shrink-0" />
                <span>Our AI analyzed your pose and this garment. We recommend {session.activeGarment.fitRecommendation?.size} for a perfect {session.activeGarment.fitRecommendation?.fit.toLowerCase()} fit with {(session.activeGarment.fitRecommendation?.confidence! * 100).toFixed(0)}% confidence.</span>
            </div>

            <div className="pt-2 gap-3 flex flex-col">
              <Button 
                className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20 bg-primary hover:scale-[1.02] transition-transform" 
                onClick={startTryOn}
              >
                <Scan className="mr-2 h-5 w-5" /> Virtual Try-On
              </Button>
              <Button 
                variant="outline" 
                className="w-full h-12" 
                onClick={requestInteraction}
              >
                <MessageSquare className="mr-2 h-5 w-5" /> Ask Seller a Question
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Garment History (Optional but good) */}
      {session.garments.length > 1 && (
        <div className="space-y-3">
          <h3 className="font-bold text-sm flex items-center justify-between">
            Recent Showcase
            <ChevronRight className="h-4 w-4" />
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {session.garments.slice().reverse().map((g) => (
              <button 
                key={g.id}
                onClick={async () => {
                    await fetch(`/api/live/${sessionId}/action`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'selectGarment', garmentId: g.id }),
                    });
                }}
                className={`relative h-20 w-20 flex-shrink-0 rounded-lg border bg-white overflow-hidden transition-all ${session.activeGarment?.id === g.id ? 'ring-2 ring-primary border-transparent' : 'opacity-60 hover:opacity-100'}`}
              >
                <Image 
                    src={g.imageUrl} 
                    alt="History" 
                    fill 
                    className="object-contain p-2"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// No custom component needed, using lucide-react
