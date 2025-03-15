'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '@/context/AppContext';
import { MapPin, Calculator } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const LocationDisplay: React.FC = () => {
  const { t } = useTranslation();
  const { location, locationPermissionGranted, calculationMethodName } = useAppContext();
  const [locationName, setLocationName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchLocationName = async () => {
      if (location && locationPermissionGranted) {
        try {
          setLoading(true);
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}&zoom=10&addressdetails=1`
          );
          
          if (response.ok) {
            const data = await response.json();
            const city = data.address.city || data.address.town || data.address.village || data.address.county || '';
            const state = data.address.state || '';
            const country = data.address.country || '';
            
            let formattedLocation = '';
            if (city) formattedLocation += city;
            if (state && state !== city) formattedLocation += formattedLocation ? `, ${state}` : state;
            if (country) formattedLocation += formattedLocation ? `, ${country}` : country;
            
            setLocationName(formattedLocation || t('unknown_location'));
          } else {
            setLocationName(t('location_fetch_error'));
          }
        } catch (error) {
          console.error('Error fetching location name:', error);
          setLocationName(t('location_fetch_error'));
        } finally {
          setLoading(false);
        }
      } else {
        setLocationName(t('location_not_available'));
      }
    };

    fetchLocationName();
  }, [location, locationPermissionGranted, t]);

  if (!locationPermissionGranted) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center mb-2">
          <MapPin className="h-5 w-5 mr-2 text-primary" />
          {loading ? (
            <p className="text-sm text-muted-foreground">{t('loading_location')}...</p>
          ) : (
            <div className="text-sm">
              {locationName}
              {location && (
                <span className="text-xs text-muted-foreground block">
                  {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center mt-2 pt-2 border-t border-border">
          <Calculator className="h-5 w-5 mr-2 text-primary" />
          <div className="text-sm">
            <span className="text-xs text-muted-foreground">{t('calculation_method')}:</span>
            <span className="ml-1">{calculationMethodName}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationDisplay; 