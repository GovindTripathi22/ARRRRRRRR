'use client';

import { useEffect, useState } from 'react';
import { useTryonStore } from '@/lib/tryon-store';
import ARStage from '@/components/tryon/ARStage';
import ARPanel from '@/components/tryon/ARPanel';
import PhotoWizard from '@/components/tryon/PhotoWizard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageTransition } from '@/components/ui/page-transition';
import { Smartphone, Sparkles } from 'lucide-react';
import { isMobile } from '@/lib/utils/device';
import { hasSeenAROnboarding, hasSeenPhotoOnboarding } from '@/lib/utils/onboarding';
import { toast } from 'sonner';

export default function TryOnPage() {
  const { activeMode, setMode, openAROnboarding, openPhotoOnboarding, selectedLiveGarment } = useTryonStore();
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    // Check if mobile on client side
    setIsMobileDevice(isMobile());

    // Listen for resize events
    const handleResize = () => {
      setIsMobileDevice(isMobile());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-open onboarding on first visit or handle live garment loading
  useEffect(() => {
    if (selectedLiveGarment && activeMode === 'ar') {
        const store = useTryonStore.getState();
        // Ensure tracking is on for the "REAL-TIME" feel
        if (!store.mediaPipeEnabled) {
          store.toggleMediaPipe();
        }
        toast.info('Live garment loaded! Aligning to your pose...');
    }

    // Small delay to ensure components are mounted
    const timer = setTimeout(() => {
      if (activeMode === 'ar' && !hasSeenAROnboarding()) {
        openAROnboarding();
      } else if (activeMode === 'photo' && !hasSeenPhotoOnboarding()) {
        openPhotoOnboarding();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [activeMode, selectedLiveGarment, openAROnboarding, openPhotoOnboarding]);

  return (
    <PageTransition>
      <div className="h-[calc(100vh-4rem-3rem)] w-full overflow-hidden pb-12">
        {/* AR Mode */}
        {activeMode === 'ar' && (
          <div className="h-full flex flex-col lg:flex-row gap-4 p-4">
            {/* Camera Stage - Left/Main */}
            <div className="flex-1 min-h-[400px]">
              <ARStage />
            </div>

            {/* Control Panel - Right/Sidebar (Optional or Collapsible on mobile) */}
            <div className={`${isMobileDevice ? 'hidden' : 'block'} w-full lg:w-80 xl:w-96 rounded-lg border bg-card`}>
              <ARPanel />
            </div>
          </div>
        )}

        {/* Photo Mode */}
        {activeMode === 'photo' && (
          <div className="h-full">
            <PhotoWizard />
          </div>
        )}
      </div>
    </PageTransition>
  );
}
