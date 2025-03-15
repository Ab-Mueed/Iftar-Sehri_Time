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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if it's a mobile device
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      setIsMobile(isMobileDevice);
      return isMobileDevice;
    };

    // Check if the app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true);
      console.log('App is already installed and running in standalone mode');
    }

    // Check if the app was launched from the home screen on iOS
    const nav = window.navigator as NavigatorWithStandalone;
    if (nav.standalone === true) {
      setIsInstalled(true);
      console.log('App launched from home screen (iOS)');
    }

    // Check if it's a mobile device
    checkMobile();

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      console.log('beforeinstallprompt event fired');
      
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for the appinstalled event
    const handleAppInstalled = () => {
      console.log('App was installed');
      setIsInstalled(true);
      setDeferredPrompt(null);
      setIsOpen(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Debug log for mobile
    console.log('Mobile PWA debug:', {
      isStandalone: window.matchMedia('(display-mode: standalone)').matches,
      isSafariStandalone: (window.navigator as NavigatorWithStandalone).standalone,
      userAgent: window.navigator.userAgent,
      isMobile: checkMobile()
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    // Check if it's iOS
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    // For iOS devices, always show instructions
    if (isIOS) {
      setIsOpen(true);
      return;
    }
    
    // For Android with deferredPrompt available
    if (deferredPrompt) {
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
      return;
    }
    
    // For Android without deferredPrompt (fallback)
    console.log('No installation prompt available');
    setIsOpen(true);
  };

  // Don't show anything if the app is already installed or running in standalone mode
  if (isInstalled || isStandalone) {
    return null;
  }

  // Check if it's iOS
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  // Check if it's Android
  const isAndroid = /Android/i.test(navigator.userAgent);

  // Only show the button on mobile devices
  if (!isMobile) {
    return null;
  }

  return (
    <>
      <Button 
        variant={isMobile ? "default" : "outline"}
        size={isMobile ? "default" : "sm"} 
        className={`flex items-center gap-1 ${isMobile ? "w-full md:w-auto" : ""}`}
        onClick={handleInstallClick}
      >
        <Download className={`${isMobile ? "h-5 w-5 mr-1" : "h-4 w-4"}`} />
        {t('install_app')}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('install_app')}</DialogTitle>
            <DialogDescription>
              {isIOS 
                ? "To install this app on iOS, tap the share button and then 'Add to Home Screen'"
                : isAndroid && !deferredPrompt
                  ? "To install this app on Android, tap the menu button (three dots) and select 'Install app' or 'Add to Home Screen'"
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
          
          {isAndroid && !deferredPrompt && (
            <div className="py-4">
              <div className="bg-muted p-3 rounded-md text-sm">
                <h3 className="font-medium">Android Installation Steps:</h3>
                <ol className="list-decimal list-inside space-y-1 mt-2">
                  <li>Tap the menu button (three dots) in the top right</li>
                  <li>Select "Install app" or "Add to Home Screen"</li>
                  <li>Follow the on-screen instructions</li>
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