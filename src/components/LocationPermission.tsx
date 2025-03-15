'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const LocationPermission: React.FC = () => {
  const { t } = useTranslation();
  const { requestLocationPermission, locationPermissionGranted } = useAppContext();
  const [open, setOpen] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [permissionState, setPermissionState] = useState<string>('prompt');
  const [browserName, setBrowserName] = useState<string>('');

  // Detect browser
  useEffect(() => {
    const userAgent = navigator.userAgent;
    if (userAgent.indexOf("Chrome") > -1) {
      setBrowserName('chrome');
    } else if (userAgent.indexOf("Safari") > -1) {
      setBrowserName('safari');
    } else if (userAgent.indexOf("Firefox") > -1) {
      setBrowserName('firefox');
    } else if (userAgent.indexOf("MSIE") > -1 || userAgent.indexOf("Trident") > -1) {
      setBrowserName('ie');
    } else if (userAgent.indexOf("Edge") > -1) {
      setBrowserName('edge');
    } else {
      setBrowserName('other');
    }
  }, []);

  // Check permission state
  useEffect(() => {
    const checkPermissionState = async () => {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const permissionStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
          setPermissionState(permissionStatus.state);
          
          if (permissionStatus.state === 'denied') {
            setPermissionDenied(true);
          }
          
          // Listen for changes to permission state
          permissionStatus.onchange = () => {
            setPermissionState(permissionStatus.state);
            if (permissionStatus.state === 'granted') {
              requestLocationPermission();
            }
          };
        }
      } catch (error) {
        console.error('Error checking permission state:', error);
      }
    };
    
    checkPermissionState();
    
    // Also check if permission was previously denied
    const storedPermission = localStorage.getItem('locationPermissionGranted');
    if (storedPermission === 'false') {
      setPermissionDenied(true);
    }
  }, [requestLocationPermission]);

  const handleRequestPermission = async () => {
    console.log('Requesting location permission...');
    
    // Force a new geolocation request to trigger the browser's permission dialog
    if (navigator.geolocation) {
      try {
        // Use a simple direct call with a short timeout to force the prompt
        const positionPromise = new Promise<GeolocationPosition>((resolve, reject) => {
          const geoWatchId = navigator.geolocation.watchPosition(
            (position) => {
              navigator.geolocation.clearWatch(geoWatchId);
              resolve(position);
            },
            (error) => {
              navigator.geolocation.clearWatch(geoWatchId);
              reject(error);
            },
            { 
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0 // Force fresh location
            }
          );
        });
        
        // Wait for the position
        const position = await positionPromise;
        console.log('Position obtained:', position);
        
        // Now call the context function to store the position
        const result = await requestLocationPermission();
        if (result) {
          setOpen(false);
        }
      } catch (error: any) {
        console.error('Error getting location:', error);
        setPermissionDenied(true);
        
        // Show appropriate error message based on error code
        if (error.code === 1) { // PERMISSION_DENIED
          console.log('Permission denied by user');
        } else if (error.code === 2) { // POSITION_UNAVAILABLE
          console.log('Position unavailable');
        } else if (error.code === 3) { // TIMEOUT
          console.log('Timeout getting location');
        }
      }
    } else {
      console.error('Geolocation is not supported by this browser.');
      setPermissionDenied(true);
    }
  };

  const handleManualLocation = () => {
    // This would be implemented if we wanted to add manual location entry
    // For now, we'll just close the dialog
    setOpen(false);
  };

  if (locationPermissionGranted) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('location_permission')}</DialogTitle>
          <DialogDescription>
            {permissionState === 'denied' 
              ? t('location_permission_denied') 
              : t('location_needed')}
          </DialogDescription>
        </DialogHeader>
        
        {permissionState === 'denied' ? (
          <Tabs defaultValue={browserName || "chrome"}>
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="chrome">Chrome</TabsTrigger>
              <TabsTrigger value="firefox">Firefox</TabsTrigger>
              <TabsTrigger value="safari">Safari</TabsTrigger>
            </TabsList>
            <TabsContent value="chrome" className="space-y-2">
              <div className="bg-muted p-3 rounded-md text-sm">
                <h3 className="font-medium">Chrome Instructions:</h3>
                <ol className="list-decimal list-inside space-y-1 mt-2">
                  <li>Click the lock/info icon in the address bar</li>
                  <li>Click on "Site settings"</li>
                  <li>Under "Permissions", find "Location"</li>
                  <li>Change from "Block" to "Allow"</li>
                  <li>Refresh the page</li>
                </ol>
              </div>
            </TabsContent>
            <TabsContent value="firefox" className="space-y-2">
              <div className="bg-muted p-3 rounded-md text-sm">
                <h3 className="font-medium">Firefox Instructions:</h3>
                <ol className="list-decimal list-inside space-y-1 mt-2">
                  <li>Click the lock/shield icon in the address bar</li>
                  <li>Click on "Connection secure" or similar</li>
                  <li>Click "More Information" and then "Permissions"</li>
                  <li>Find "Access Your Location" and remove the setting or set to "Allow"</li>
                  <li>Refresh the page</li>
                </ol>
              </div>
            </TabsContent>
            <TabsContent value="safari" className="space-y-2">
              <div className="bg-muted p-3 rounded-md text-sm">
                <h3 className="font-medium">Safari Instructions:</h3>
                <ol className="list-decimal list-inside space-y-1 mt-2">
                  <li>Click Safari in the menu bar</li>
                  <li>Select "Settings for This Website" or "Preferences"</li>
                  <li>Find "Location" in the list</li>
                  <li>Change from "Deny" to "Allow"</li>
                  <li>Refresh the page</li>
                </ol>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="bg-muted p-3 rounded-md text-sm">
            <p>{t('location_permission_help')}</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>{t('location_permission_help_1')}</li>
              <li>{t('location_permission_help_2')}</li>
              <li>{t('location_permission_help_3')}</li>
            </ul>
          </div>
        )}
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button 
            onClick={handleRequestPermission} 
            className="w-full sm:w-auto"
          >
            {t('grant_permission')}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            className="w-full sm:w-auto"
          >
            {t('continue_without_location')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LocationPermission; 