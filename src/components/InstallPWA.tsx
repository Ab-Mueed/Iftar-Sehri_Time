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
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    // Check if the app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true);
      console.log('App is already installed and running in standalone mode');
    }

    // Check if the app was launched from the home screen
    const nav = window.navigator as NavigatorWithStandalone;
    if (nav.standalone === true) {
      setIsInstalled(true);
      console.log('App launched from home screen (iOS)');
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      console.log('beforeinstallprompt event fired');
      
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show the install button
      setShowInstallButton(true);
    };

    // Listen for the appinstalled event
    const handleAppInstalled = () => {
      console.log('App was installed');
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowInstallButton(false);
      setIsOpen(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Debug log for mobile
    console.log('Mobile PWA debug:', {
      isStandalone: window.matchMedia('(display-mode: standalone)').matches,
      isSafariStandalone: (window.navigator as NavigatorWithStandalone).standalone,
      userAgent: window.navigator.userAgent,
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(window.navigator.userAgent)
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.log('No installation prompt available');
      
      // For iOS devices, show instructions
      if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        setIsOpen(true);
        return;
      }
      
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
    setShowInstallButton(false);
    setIsOpen(false);
  };

  // Don't show anything if the app is already installed or running in standalone mode
  if (isInstalled || isStandalone) {
    return null;
  }

  // Check if it's iOS
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  return (
    <>
      {(showInstallButton || isIOS) && (
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1"
          onClick={handleInstallClick}
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
              {isIOS 
                ? "To install this app on iOS, tap the share button and then 'Add to Home Screen'"
                : t('install_app_description')
              }
            </DialogDescription>
          </DialogHeader>
          
          {isIOS && (
            <div className="py-4">
              <div className="bg-muted p-3 rounded-md text-sm">
                <h3 className="font-medium">iOS Installation Steps:</h3>
                <ol className="list-decimal list-inside space-y-1 mt-2">
                  <li>Tap the Share button at the bottom of the screen</li>
                  <li>Scroll down and tap "Add to Home Screen"</li>
                  <li>Tap "Add" in the top right corner</li>
                  <li>The app will be installed on your home screen</li>
                </ol>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            {!isIOS && deferredPrompt && (
              <Button onClick={handleInstallClick} className="w-full sm:w-auto">
                {t('install_now')}
              </Button>
            )}
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