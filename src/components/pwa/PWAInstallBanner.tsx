'use client';

import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (!isVisible || !deferredPrompt) {
    return null;
  }

  return (
    <aside
      aria-label="PWA Installation Prompt"
      className="bg-card border-b border-primary/20 px-4 py-2 flex items-center justify-between text-xs"
    >
      <div className="flex items-center gap-2">
        <Download className="h-4 w-4 text-primary shrink-0" />
        <span className="text-foreground font-medium">
          Install GymFlow on your device for fast offline access.
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          onClick={handleInstall}
          size="sm"
          className="h-7 text-xs font-bold px-2.5 gap-1 shadow-sm"
        >
          Install
        </Button>
        <button
          type="button"
          onClick={() => setIsVisible(false)}
          className="text-muted-foreground hover:text-foreground p-1"
          aria-label="Dismiss installation prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
