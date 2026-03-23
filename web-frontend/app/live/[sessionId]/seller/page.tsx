'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, RefreshCw, AlertCircle, ShoppingBag, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { LiveSession, LiveGarment } from '@/lib/types';
import Image from 'next/image';

export default function SellerPage({ params }: { params: { sessionId: string } }) {
  const { sessionId } = params;
  const [session, setSession] = useState<LiveSession | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    fetchSession();
    const interval = setInterval(fetchSession, 2000);
    return () => clearInterval(interval);
  }, [sessionId]);

  // Handle Camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      toast.error('Failed to access camera');
    }
  };

  const scanGarment = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsScanning(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setIsScanning(false);
        return;
      }

      const formData = new FormData();
      formData.append('image', blob, 'scan.jpg');

      try {
        const res = await fetch(`/api/live/${sessionId}/garment`, {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          setSession(data);
          toast.success('Garment scanned and added to session!');
        } else {
          toast.error('Failed to scan garment');
        }
      } catch (err) {
        toast.error('Error scanning garment');
      } finally {
        setIsScanning(false);
      }
    }, 'image/jpeg', 0.8);
  };

  const clearAlerts = async () => {
    try {
      const res = await fetch(`/api/live/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clearAlerts' }),
      });
      if (res.ok) {
        const data = await res.json();
        setSession(data);
      }
    } catch (err) {
      toast.error('Failed to clear alerts');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingBag className="text-primary" />
            Seller Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">Session ID: {sessionId}</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-1" /> Reload
           </Button>
           <Button 
            variant="destructive" 
            size="sm" 
            onClick={async () => {
              if (confirm('Are you sure you want to end this live session?')) {
                const res = await fetch(`/api/live/${sessionId}`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ action: 'end' }) });
                if (res.ok) {
                  toast.success('Session ended');
                  window.location.href = '/';
                }
              }
            }}
           >
            End Session
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Camera/Scanner View */}
        <Card className="overflow-hidden bg-black aspect-[3/4] relative flex flex-col items-center justify-center">
          {!cameraActive ? (
            <div className="text-center p-6 space-y-4">
              <Camera className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">Camera is ready</p>
              <Button onClick={startCamera}>Start Camera</Button>
            </div>
          ) : (
            <>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                <Button 
                  size="lg" 
                  onClick={scanGarment} 
                  disabled={isScanning}
                  className="rounded-full h-16 w-16 shadow-xl border-4 border-white/20"
                >
                  {isScanning ? <RefreshCw className="animate-spin" /> : <Camera />}
                </Button>
              </div>
            </>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </Card>

        {/* Status & Alerts */}
        <div className="space-y-6">
          <Card className="p-4 bg-primary/5 border-primary/20">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Active Product
            </h3>
            {session?.activeGarment ? (
              <div className="flex gap-4">
                <div className="relative h-24 w-24 rounded-lg overflow-hidden border bg-white">
                  <Image 
                    src={session.activeGarment.imageUrl} 
                    alt="Active Garment" 
                    fill 
                    className="object-contain"
                  />
                </div>
                <div className="space-y-1">
                  <p className="font-medium capitalize">{session.activeGarment.type}</p>
                  <p className="text-xs text-muted-foreground">
                    Fit: {session.activeGarment.fitRecommendation?.size} ({session.activeGarment.fitRecommendation?.fit})
                  </p>
                  <div className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] rounded-full inline-block">
                    LIVE NOW
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No active garment. Scan one to start.</p>
            )}
          </Card>

          <Card className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                Buyer Activity
              </h3>
              {session?.alerts && session.alerts.length > 0 && (
                <Button variant="ghost" size="xs" onClick={clearAlerts} className="text-[10px] h-6">
                  Clear All
                </Button>
              )}
            </div>
             <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {session?.alerts && session.alerts.length > 0 ? (
                session.alerts.map((alert, i) => (
                  <div key={i} className="text-xs p-2 bg-muted rounded border-l-2 border-primary animate-in fade-in slide-in-from-right-4">
                    {alert}
                  </div>
                )).reverse()
              ) : (
                <p className="text-xs text-muted-foreground text-center py-8">No buyer interaction requests yet.</p>
              )}
            </div>
          </Card>

          <Card className="p-4">
             <h3 className="font-semibold mb-3">Session Stats</h3>
             <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted rounded-lg text-center">
                  <div className="text-xl font-bold">{session?.buyers.length || 0}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Active Buyers</div>
                </div>
                <div className="p-3 bg-muted rounded-lg text-center">
                  <div className="text-xl font-bold">{session?.garments.length || 0}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Items Scanned</div>
                </div>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
