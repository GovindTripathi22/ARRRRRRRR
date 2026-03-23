'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Users, 
  ShoppingBag, 
  Sparkles, 
  Scan, 
  MessageSquare,
  ArrowRight,
  Loader2,
  Camera,
  X as CloseIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useTryonStore } from '@/lib/tryon-store';
import Image from 'next/image';
import Webcam from 'react-webcam';

export default function LiveShoppingPage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  
  const { 
    liveSession, 
    setLiveSession, 
    setSelectedLiveGarment,
    setMode 
  } = useTryonStore();

  const [isScanning, setIsScanning] = useState(false);
  const webcamRef = React.useRef<Webcam>(null);

  // Poll for session updates if joined
  useEffect(() => {
    if (!liveSession?.id) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/live/${liveSession.id}`);
        if (res.ok) {
          const data = await res.json();
          // Debug log to catch undefineds
          console.log('[LiveSession] Updated data:', data);
          setLiveSession(data);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [liveSession?.id, setLiveSession]);

  const handleCreateSession = async () => {
    setIsCreating(true);
    try {
      const res = await fetch('/api/live/create', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerId: 'seller_' + Math.random().toString(36).slice(2, 7) })
      });
      
      if (res.ok) {
        const data = await res.json();
        setLiveSession(data);
        toast.success('Live session created!');
      }
    } catch (err) {
      toast.error('Failed to create session');
    } finally {
      setIsCreating(false);
    }
  };

  const handleScan = async () => {
    if (!webcamRef.current || !liveSession) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    toast.loading('Processing garment...', { id: 'scan' });

    try {
      const imgRes = await fetch(imageSrc);
      const blob = await imgRes.blob();
      const file = new File([blob], "scan.jpg", { type: "image/jpeg" });

      const formData = new FormData();
      formData.append('image', file);
      formData.append('sessionId', liveSession.id);

      const scanRes = await fetch('/api/garment/scan', {
        method: 'POST',
        body: formData,
      });

      if (scanRes.ok) {
        toast.success('Garment scanned and added!', { id: 'scan' });
        setIsScanning(false);
      } else {
        toast.error('Scan failed', { id: 'scan' });
      }
    } catch (err) {
      toast.error('Scan error', { id: 'scan' });
    }
  };

  const handleJoinSession = async () => {
    if (!sessionId.trim()) return;
    setIsJoining(true);
    try {
      const res = await fetch('/api/live/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, buyerId: 'buyer_' + Math.random().toString(36).slice(2, 7) })
      });

      if (res.ok) {
        const data = await res.json();
        setLiveSession(data);
        toast.success('Joined session!');
      } else {
        toast.error('Session not found');
      }
    } catch (err) {
      toast.error('Failed to join');
    } finally {
      setIsJoining(false);
    }
  };

  const handleTryGarment = (garment: any) => {
    console.log('[LiveSession] Selecting garment for try-on:', garment);
    setSelectedLiveGarment(garment);
    setMode('ar');
    toast.success(`Selected ${garment.type} for try-on`);
    router.push('/try-on?mode=ar');
  };

  const handleAskSeller = async () => {
    if (!liveSession) return;
    try {
      await fetch('/api/live/request-seller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: liveSession.id, buyerId: 'user_123' })
      });
      toast.success('Seller notified!');
    } catch (err) {
      toast.error('Failed to notify seller');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 selection:bg-primary/30">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="space-y-1">
            <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter bg-gradient-to-br from-white via-white to-white/40 bg-clip-text text-transparent uppercase">
              Live Shopping
            </h1>
            <div className="flex items-center gap-2 text-primary font-medium tracking-widest text-xs uppercase">
              <div className="size-2 rounded-full bg-primary animate-pulse" />
              Powered by AR Try-On
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!liveSession ? (
              <>
                <div className="hidden md:flex bg-white/5 border border-white/10 rounded-full pl-4 pr-1 py-1 items-center focus-within:border-primary/50 transition-all backdrop-blur-md">
                  <Input 
                    placeholder="Session ID" 
                    className="h-8 bg-transparent border-none focus-visible:ring-0 w-32 text-sm"
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value)}
                  />
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="h-8 rounded-full hover:bg-white/10"
                    onClick={handleJoinSession}
                    disabled={isJoining || !sessionId.trim()}
                  >
                    {isJoining ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Join'}
                  </Button>
                </div>
                <Button variant="gradient" size="lg" className="rounded-full px-8 shadow-2xl shadow-primary/20" onClick={handleCreateSession} disabled={isCreating}>
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-5 w-5 mr-2" />}
                  Host Now
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <div className="bg-white/5 px-4 py-2 rounded-full border border-white/10 flex items-center gap-3">
                  <span className="text-xs font-mono text-gray-400 capitalize">{liveSession.id}</span>
                  <div className="h-3 w-[1px] bg-white/10" />
                  <span className="text-xs font-bold text-primary">LIVE</span>
                </div>
                <Button variant="outline" size="sm" className="rounded-full border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={() => setLiveSession(null)}>
                  Exit
                </Button>
              </div>
            )}
          </div>
        </header>

        {!liveSession ? (
          <div className="grid md:grid-cols-2 gap-8 py-12">
            <Card className="p-8 bg-white/[0.02] border-white/10 flex flex-col items-center text-center group hover:bg-white/[0.04] transition-all cursor-pointer" onClick={handleCreateSession}>
              <div className="size-20 rounded-3xl bg-primary/20 flex items-center justify-center mb-8 ring-1 ring-primary/40">
                <Users className="size-10 text-primary" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Start Session</h2>
              <Button variant="gradient" className="rounded-full px-8">Host Now</Button>
            </Card>

            <Card className="p-8 bg-white/[0.02] border-white/10 flex flex-col items-center text-center group hover:bg-white/[0.04] transition-all">
                <div className="size-20 rounded-3xl bg-accent/20 flex items-center justify-center mb-8 ring-1 ring-accent/40">
                  <ShoppingBag className="size-10 text-accent" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Join Session</h2>
                <div className="flex w-full max-w-sm gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5 mt-4">
                   <Input 
                    placeholder="Session ID" 
                    className="bg-transparent border-none focus-visible:ring-0"
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value)}
                  />
                  <Button variant="secondary" className="rounded-xl px-6" onClick={handleJoinSession}>Join</Button>
                </div>
            </Card>

          </div>
        ) : (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="relative overflow-hidden bg-white/[0.03] border border-white/10 rounded-[2rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-xl">
              <div className="absolute -left-12 -top-12 size-48 bg-primary/10 blur-[80px]" />
              <div className="absolute -right-12 -bottom-12 size-48 bg-accent/10 blur-[80px]" />
              
              <div className="relative flex items-center gap-6">
                <div className="size-20 rounded-full border-4 border-black ring-4 ring-primary/30 p-1 flex items-center justify-center overflow-hidden bg-black/40">
                  <div className="size-full rounded-full bg-primary animate-pulse flex items-center justify-center">
                    <Users className="text-white size-8" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Active Session</h3>
                  <div className="flex items-center gap-2 text-primary font-mono text-sm">
                    <div className="size-1.5 rounded-full bg-primary animate-ping" />
                    LIVE · {liveSession.buyers.length} Watching
                  </div>
                </div>
              </div>
              
              <div className="relative flex items-center gap-4">
                {/* Host Scan Button */}
                {liveSession.sellerId.startsWith('seller_') && (
                  <Button variant="default" className="rounded-full px-6" onClick={() => setIsScanning(true)}>
                    <Camera className="h-4 w-4 mr-2" /> Scan New Garment
                  </Button>
                )}
              </div>
            </div>

            {/* Scanning Overlay */}
            {isScanning && (
              <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
                <div className="relative w-full max-w-2xl bg-white/[0.05] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
                  <div className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-bold">Scan Garment</h3>
                      <Button variant="ghost" size="icon" onClick={() => setIsScanning(false)} className="rounded-full">
                        <CloseIcon className="h-6 w-6" />
                      </Button>
                    </div>
                    
                    <div className="relative aspect-video rounded-3xl overflow-hidden bg-black border border-white/10 shadow-inner">
                      <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{ facingMode: "environment" }}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 border-[20px] border-black/20 pointer-events-none" />
                      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary/30 blur-sm animate-pulse" />
                    </div>
                    
                    <div className="flex flex-col gap-4">
                      <p className="text-sm text-gray-400 text-center">Position the garment clearly in the frame for best detection</p>
                      <Button variant="gradient" size="lg" className="w-full rounded-2xl py-8 text-xl font-bold gap-3 shadow-primary/20 shadow-lg" onClick={handleScan}>
                        <Scan className="h-6 w-6 animate-pulse" /> CAPTURE & ANALYZE
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Current Collection</h2>
                <div className="text-xs text-gray-500 font-mono text-right">
                  {liveSession.scannedGarments?.length || 0} ITEMS SCANNED
                </div>
              </div>
              
              {liveSession.scannedGarments?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {liveSession.scannedGarments.map((garment: any) => (
                    <Card key={garment.id} className="group relative aspect-[3/4] overflow-hidden bg-black border-white/10 rounded-3xl">
                      <Image 
                        src={garment.imageUrl} 
                        alt={garment.type}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-6 flex flex-col justify-end">
                        <div className="space-y-1 mb-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                          <h4 className="text-2xl font-black italic uppercase tracking-tighter">{garment.type}</h4>
                        </div>
                        <Button 
                          variant="gradient" 
                          className="w-full rounded-2xl opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-xl shadow-primary/40" 
                          onClick={() => handleTryGarment(garment)}
                        >
                          <Scan className="h-4 w-4 mr-2" /> VIRTUAL TRY-ON
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="h-96 rounded-[3rem] border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-gray-600 bg-white/[0.01]">
                  <div className="size-24 rounded-full bg-white/[0.02] flex items-center justify-center mb-6">
                    <Scan className="h-10 w-10 opacity-20" />
                  </div>
                  <p className="text-xl font-medium">Capture starting soon...</p>
                  <p className="text-sm opacity-50 mt-2">The host is preparing the collection</p>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
