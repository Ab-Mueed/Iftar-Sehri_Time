'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Download } from 'lucide-react';

// Define the BeforeInstallPromptEvent interface
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

// Define a type for Safari's Navigator extension
interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

const InstallPWA: React.FC = () => {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if the app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true);
      console.log('App is already installed and running in standalone mode');
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show the install dialog
      setIsOpen(true);
      console.log('beforeinstallprompt event fired');
    };

    // Listen for the appinstalled event
    const handleAppInstalled = () => {
      // Log app installed
      console.log('App was installed');
      setIsInstalled(true);
      setDeferredPrompt(null);
      setIsOpen(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if the app was launched from the home screen
    // Use type assertion for Safari's standalone property
    const nav = window.navigator as NavigatorWithStandalone;
    if (
      (nav.standalone === true) ||
      window.matchMedia('(display-mode: standalone)').matches
    ) {
      setIsInstalled(true);
      console.log('App launched from home screen');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.log('No installation prompt available');
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const choiceResult = await deferredPrompt.userChoice;
    
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setIsInstalled(true);
    } else {
      console.log('User dismissed the install prompt');
    }
    
    // Clear the deferredPrompt for the next time
    setDeferredPrompt(null);
    setIsOpen(false);
  };

  // Don't show anything if the app is already installed or running in standalone mode
  if (isInstalled || isStandalone) {
    return null;
  }

  // Show the install button if we have a deferred prompt
  return (
    <>
      {deferredPrompt && (
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1"
          onClick={() => setIsOpen(true)}
        >
          <Download className="h-4 w-4" />
          {t('install_app')}
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('install_app')}</DialogTitle>
            <DialogDescription>
              {t('install_app_description')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button onClick={handleInstallClick} className="w-full sm:w-auto">
              {t('install_now')}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="w-full sm:w-auto"
            >
              {t('later')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InstallPWA; 