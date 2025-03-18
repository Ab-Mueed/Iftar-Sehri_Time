'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '@/context/AppContext';
import { useNotification } from '@/providers/NotificationProvider';
import { scheduleSehriNotification, scheduleIftarNotification } from '@/services/notifications';
import TimerCard from '@/components/TimerCard';
import Settings from '@/components/Settings';
import LocationPermission from '@/components/LocationPermission';
import LocationDisplay from '@/components/LocationDisplay';
import DateDisplay from '@/components/DateDisplay';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { isAfter, isBefore } from 'date-fns';

export default function Home() {
  const { t } = useTranslation();
  const {
    location,
    locationPermissionGranted,
    sehriTime,
    iftarTime,
    isNextDay,
    language,
    calculationMethod,
    refreshData,
    requestLocationPermission,
    setLocation,
    setLocationPermissionGranted
  } = useAppContext();

  const {
    notificationsEnabled,
    sehriNotificationEnabled,
    iftarNotificationEnabled,
    notificationTime,
  } = useNotification();

  const [activePeriod, setActivePeriod] = useState<'sehri' | 'iftar'>('sehri');
  const [sehriNotificationId, setSehriNotificationId] = useState<number | null>(null);
  const [iftarNotificationId, setIftarNotificationId] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Determine which period is active based on current time
  useEffect(() => {
    if (sehriTime && iftarTime) {
      const now = new Date();
      
      // If both times are in the future, set active to the one coming first
      if (isBefore(now, sehriTime) && isBefore(now, iftarTime)) {
        if (isBefore(sehriTime, iftarTime)) {
          setActivePeriod('sehri');
        } else {
          setActivePeriod('iftar');
        }
      }
      // If Sehri has passed but Iftar is still in the future
      else if (isAfter(now, sehriTime) && isBefore(now, iftarTime)) {
        setActivePeriod('iftar');
      }
      // If both have passed, we're showing next day's times, so Sehri is next
      else if (isAfter(now, sehriTime) && isAfter(now, iftarTime)) {
        setActivePeriod('sehri');
      }
      // Default to Sehri (this should rarely happen)
      else {
        setActivePeriod('sehri');
      }
      
      console.log(`Active period: ${activePeriod}, Next day: ${isNextDay}`);
      console.log(`Current time: ${now.toLocaleString()}`);
      console.log(`Sehri time: ${sehriTime.toLocaleString()}`);
      console.log(`Iftar time: ${iftarTime.toLocaleString()}`);
    }
  }, [sehriTime, iftarTime, isNextDay]);

  // Schedule notifications when settings or times change
  useEffect(() => {
    if (notificationsEnabled && locationPermissionGranted) {
      // Cancel previous notifications
      if (sehriNotificationId !== null) {
        clearTimeout(sehriNotificationId);
        setSehriNotificationId(null);
      }
      
      if (iftarNotificationId !== null) {
        clearTimeout(iftarNotificationId);
        setIftarNotificationId(null);
      }
      
      // Schedule new notifications
      if (sehriNotificationEnabled && sehriTime) {
        const id = scheduleSehriNotification(sehriTime, notificationTime, language);
        setSehriNotificationId(id);
      }

      if (iftarNotificationEnabled && iftarTime) {
        const id = scheduleIftarNotification(iftarTime, notificationTime, language);
        setIftarNotificationId(id);
      }
    }
  }, [
    notificationsEnabled,
    locationPermissionGranted,
    sehriNotificationEnabled,
    iftarNotificationEnabled,
    notificationTime,
    language,
    sehriTime,
    iftarTime,
  ]);

  // Handle completion of Sehri countdown
  const handleSehriComplete = () => {
    setActivePeriod('iftar');
  };

  // Handle completion of Iftar countdown
  const handleIftarComplete = () => {
    setActivePeriod('sehri');
  };
  
  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
      toast({
        title: 'Data refreshed',
        description: 'Ramadan timing updated with the latest data.',
      });
    } catch (error) {
      toast({
        title: 'Refresh failed',
        description: 'Could not refresh data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle manual location entry
  const handleManualLocationSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const latitude = parseFloat(formData.get('latitude') as string);
    const longitude = parseFloat(formData.get('longitude') as string);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      toast({
        title: 'Invalid coordinates',
        description: 'Please enter valid latitude and longitude values.',
        variant: 'destructive',
      });
      return;
    }
    
    // Create a mock GeolocationCoordinates object with type assertion
    const mockCoords = {
      latitude,
      longitude,
      accuracy: 0,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
      // Add a dummy toJSON method to satisfy the interface
      toJSON: () => ({ latitude, longitude, accuracy: 0 })
    } as GeolocationCoordinates;
    
    // Set the location manually
    setLocation(mockCoords);
    setLocationPermissionGranted(true);
    localStorage.setItem('locationPermissionGranted', 'true');
    localStorage.setItem('userLocation', JSON.stringify(mockCoords));
    
    toast({
      title: 'Location set',
      description: `Location set to Lat: ${latitude.toFixed(4)}, Long: ${longitude.toFixed(4)}`,
    });
    
    // Refresh data with the new location
    await refreshData();
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8">
      {!locationPermissionGranted && <LocationPermission />}

      <div className="w-full max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">{t('app_title')}</h1>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleRefresh} 
              disabled={isRefreshing}
              aria-label="Refresh data"
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Settings />
          </div>
        </header>

        {locationPermissionGranted ? (
          <>
            <LocationDisplay />
            <DateDisplay />
          </>
        ) : (
          <div className="bg-primary/10 p-4 rounded-lg mb-6">
            <div className="text-center mb-4">
              <p className="mb-2">{t('location_needed')}</p>
              <Button 
                onClick={() => {
                  console.log('Requesting location permission from main page...');
                  // Force a new geolocation request to trigger the browser's permission dialog
                  if (navigator.geolocation) {
                    try {
                      // Use watchPosition instead of getCurrentPosition to better trigger the permission dialog
                      const geoWatchId = navigator.geolocation.watchPosition(
                        (position) => {
                          console.log('Position obtained:', position);
                          navigator.geolocation.clearWatch(geoWatchId);
                          // Now call the context function which will store the position
                          requestLocationPermission().then(() => {
                            console.log('Location permission processed');
                          });
                        },
                        (error) => {
                          navigator.geolocation.clearWatch(geoWatchId);
                          console.error('Error getting location:', error);
                          toast({
                            title: 'Location Error',
                            description: 'Unable to get your location. Please check your browser settings.',
                            variant: 'destructive',
                          });
                        },
                        {
                          enableHighAccuracy: true,
                          timeout: 5000,
                          maximumAge: 0 // Force fresh location
                        }
                      );
                    } catch (error) {
                      console.error('Error setting up geolocation watch:', error);
                      toast({
                        title: 'Location Error',
                        description: 'Unable to request location. Please try again.',
                        variant: 'destructive',
                      });
                    }
                  } else {
                    console.error('Geolocation is not supported by this browser.');
                    toast({
                      title: 'Location Not Supported',
                      description: 'Geolocation is not supported by your browser.',
                      variant: 'destructive',
                    });
                  }
                }} 
                variant="default" 
                className="mb-4"
              >
                {t('grant_permission')}
              </Button>
              
              <div className="text-sm text-muted-foreground mt-2">
                {t('or_enter_coordinates')}
              </div>
            </div>
            
            <form onSubmit={handleManualLocationSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="latitude" className="text-sm font-medium">
                    {t('latitude')}
                  </label>
                  <input
                    id="latitude"
                    name="latitude"
                    type="number"
                    step="0.0001"
                    placeholder="e.g. 24.7136"
                    className="w-full p-2 border rounded-md"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="longitude" className="text-sm font-medium">
                    {t('longitude')}
                  </label>
                  <input
                    id="longitude"
                    name="longitude"
                    type="number"
                    step="0.0001"
                    placeholder="e.g. 46.6753"
                    className="w-full p-2 border rounded-md"
                    required
                  />
                </div>
              </div>
              <div className="text-center">
                <Button type="submit" variant="outline">
                  {t('set_location')}
                </Button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TimerCard
            title="sehri"
            time={sehriTime}
            isActive={activePeriod === 'sehri'}
            onComplete={handleSehriComplete}
          />
          <TimerCard
            title="iftar"
            time={iftarTime}
            isActive={activePeriod === 'iftar'}
            onComplete={handleIftarComplete}
          />
        </div>
      </div>
    </main>
  );
} 