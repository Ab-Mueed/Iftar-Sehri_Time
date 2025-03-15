'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import { languages } from '@/i18n/config';
import { getPrayerTimes, getPrayerTimesForRange, CalculationMethod, CALCULATION_METHOD_NAMES, PrayerTimes } from '@/services/prayerTimes';
import { toast } from '@/hooks/use-toast';
import { addDays, format, isAfter, isBefore, startOfDay } from 'date-fns';

interface AppContextType {
  // Location
  location: GeolocationCoordinates | null;
  locationPermissionGranted: boolean;
  requestLocationPermission: () => Promise<GeolocationCoordinates | null>;
  setLocation: (location: GeolocationCoordinates | null) => void;
  setLocationPermissionGranted: (granted: boolean) => void;
  
  // Prayer times
  sehriTime: Date | null;
  iftarTime: Date | null;
  isNextDay: boolean;
  gregorianDate: string;
  hijriDate: string;
  
  // Calculation method
  calculationMethod: CalculationMethod;
  calculationMethodName: string;
  setCalculationMethod: (method: CalculationMethod) => void;
  
  // Hijri date adjustment
  hijriAdjustment: number;
  setHijriAdjustment: (adjustment: number) => void;
  
  // Language
  language: string;
  setLanguage: (lang: string) => void;
  
  // Theme
  theme: string;
  setThemeValue: (theme: string) => void;
  
  // Refresh data
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper function to adjust Hijri date based on user preference
const adjustHijriDate = (hijriDateStr: string, adjustment: number): string => {
  if (adjustment === 0) return hijriDateStr;
  
  // Parse the Hijri date string (format: "DD Month, YYYY AH" or "DD Month, YYYY")
  const match = hijriDateStr.match(/^(\d+)\s+([^,]+),\s+(\d+)(.*)$/);
  if (!match) return hijriDateStr;
  
  let [_, day, month, year, suffix] = match;
  
  // Convert day to number and apply adjustment
  let dayNum = parseInt(day, 10) + adjustment;
  
  // Handle month transitions
  const daysInMonth = 30; // Simplified - Hijri months can have 29 or 30 days
  
  if (dayNum <= 0) {
    // Move to previous month
    dayNum += daysInMonth;
    // This is a simplification - would need a proper Hijri calendar library for accurate month transitions
    // For now, we'll just adjust the day and keep the month the same
  } else if (dayNum > daysInMonth) {
    // Move to next month
    dayNum -= daysInMonth;
    // This is a simplification - would need a proper Hijri calendar library for accurate month transitions
    // For now, we'll just adjust the day and keep the month the same
  }
  
  // Format the adjusted date
  return `${dayNum} ${month}, ${year}${suffix}`;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  
  // Location state
  const [location, setLocationState] = useState<GeolocationCoordinates | null>(null);
  const [locationPermissionGranted, setLocationPermissionGrantedState] = useState<boolean>(false);
  
  // Prayer times
  const [sehriTime, setSehriTime] = useState<Date | null>(null);
  const [iftarTime, setIftarTime] = useState<Date | null>(null);
  const [isNextDay, setIsNextDay] = useState<boolean>(false);
  const [prayerTimesCache, setPrayerTimesCache] = useState<PrayerTimes[]>([]);
  const [gregorianDate, setGregorianDate] = useState<string>('');
  const [hijriDate, setHijriDate] = useState<string>('');
  
  // Calculation method
  const [calculationMethod, setCalculationMethod] = useState<CalculationMethod>('karachi');
  const [calculationMethodName, setCalculationMethodName] = useState<string>(CALCULATION_METHOD_NAMES.karachi);
  
  // Hijri date adjustment
  const [hijriAdjustment, setHijriAdjustment] = useState<number>(0);
  
  // Language
  const [language, setLanguageState] = useState<string>('en');
  
  // Request location permission
  const requestLocationPermission = async () => {
    // First, check the current permission state if the Permissions API is available
    let permissionState = 'prompt'; // Default to 'prompt' if Permissions API is not available
    
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        permissionState = permissionStatus.state; // Can be 'granted', 'denied', or 'prompt'
        console.log('Current geolocation permission state:', permissionState);
      }
    } catch (error) {
      console.error('Error checking permission state:', error);
    }
    
    // Check if we already have permission stored in localStorage
    const storedPermission = localStorage.getItem('locationPermissionGranted');
    const storedLocation = localStorage.getItem('userLocation');
    
    // Only use stored location if permission is still granted
    if (storedPermission === 'true' && storedLocation && permissionState !== 'denied') {
      try {
        const parsedLocation = JSON.parse(storedLocation);
        setLocationState(parsedLocation);
        setLocationPermissionGrantedState(true);
        console.log('Using stored location:', parsedLocation);
        return parsedLocation;
      } catch (error) {
        console.error('Error parsing stored location:', error);
        // Continue with requesting new permission if stored data is invalid
      }
    }
    
    if (navigator.geolocation) {
      try {
        // Define options for getCurrentPosition
        const options = {
          enableHighAccuracy: true, // Get the best possible result
          timeout: 10000,           // Time to wait for a position (10 seconds)
          maximumAge: 300000        // Accept a cached position up to 5 minutes old
        };
        
        // If permission is denied, show a more specific message
        if (permissionState === 'denied') {
          throw { 
            code: 1, // PERMISSION_DENIED
            message: 'Location permission was previously denied. Please reset permissions in your browser settings.'
          };
        }
        
        // If the LocationPermission component has already triggered the permission dialog,
        // we might already have a position or the user might have already denied permission.
        // Let's check the permission state again.
        if (permissionState === 'granted') {
          console.log('Permission already granted, getting position...');
        }
        
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve, 
            (error) => {
              // Provide more specific error messages
              let errorMessage = 'Unable to get your location.';
              
              switch (error.code) {
                case error.PERMISSION_DENIED:
                  errorMessage = 'Location permission was denied. Please try "Allow this time" when prompted.';
                  break;
                case error.POSITION_UNAVAILABLE:
                  errorMessage = 'Location information is unavailable.';
                  break;
                case error.TIMEOUT:
                  errorMessage = 'The request to get location timed out.';
                  break;
              }
              
              reject({ code: error.code, message: errorMessage });
            },
            options
          );
        });
        
        // Store the location and permission status
        setLocationState(position.coords);
        setLocationPermissionGrantedState(true);
        localStorage.setItem('locationPermissionGranted', 'true');
        localStorage.setItem('userLocation', JSON.stringify(position.coords));
        
        console.log('Location permission granted:', position.coords);
        return position.coords;
      } catch (error: any) {
        console.error('Error getting location:', error);
        setLocationPermissionGrantedState(false);
        localStorage.setItem('locationPermissionGranted', 'false');
        localStorage.setItem('permissionState', permissionState);
        
        toast({
          title: 'Location Error',
          description: error.message || 'Unable to get your location. Please check your browser settings.',
          variant: 'destructive',
        });
        return null;
      }
    } else {
      console.error('Geolocation is not supported by this browser.');
      setLocationPermissionGrantedState(false);
      localStorage.setItem('locationPermissionGranted', 'false');
      
      toast({
        title: 'Location Not Supported',
        description: 'Geolocation is not supported by your browser.',
        variant: 'destructive',
      });
      return null;
    }
  };
  
  // Set language
  const setLanguage = (lang: string) => {
    if (languages.includes(lang)) {
      setLanguageState(lang);
      i18n.changeLanguage(lang);
      // Set document direction for RTL languages
      document.documentElement.dir = lang === 'ar' || lang === 'ur' ? 'rtl' : 'ltr';
    }
  };
  
  // Set theme
  const setThemeValue = (newTheme: string) => {
    setTheme(newTheme);
  };
  
  // Determine which prayer times to display based on current time
  const determineCurrentPrayerTimes = () => {
    if (prayerTimesCache.length === 0) return null;
    
    const now = new Date();
    
    // Sort prayer times by date
    const sortedTimes = [...prayerTimesCache].sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // First, check if we have today's prayer times
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTimes = sortedTimes.find(item => {
      const itemDate = new Date(item.date);
      itemDate.setHours(0, 0, 0, 0);
      return itemDate.getTime() === today.getTime();
    });
    
    // If we have today's times and Iftar hasn't passed yet, use today's times
    if (todayTimes && isAfter(todayTimes.iftarTime, now)) {
      setIsNextDay(false);
      return todayTimes;
    }
    
    // If today's Iftar has passed or we don't have today's times,
    // find the next day's times
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const tomorrowTimes = sortedTimes.find(item => {
      const itemDate = new Date(item.date);
      itemDate.setHours(0, 0, 0, 0);
      return itemDate.getTime() === tomorrow.getTime();
    });
    
    // If we have tomorrow's times, use them
    if (tomorrowTimes) {
      setIsNextDay(true);
      return tomorrowTimes;
    }
    
    // If we don't have tomorrow's times, fetch them
    const nextDay = addDays(today, 1);
    fetchPrayerTimesForDate(nextDay);
    
    // In the meantime, return the latest available times
    if (sortedTimes.length > 0) {
      const latestTimes = sortedTimes[sortedTimes.length - 1];
      setIsNextDay(true);
      return latestTimes;
    }
    
    return null;
  };
  
  // Fetch prayer times for a specific date
  const fetchPrayerTimesForDate = async (date: Date) => {
    if (location && locationPermissionGranted) {
      try {
        console.log(`Fetching prayer times for: ${date.toDateString()}`);
        const times = await getPrayerTimes(
          location.latitude,
          location.longitude,
          date,
          calculationMethod
        );
        
        // Update cache with new times
        setPrayerTimesCache(prev => {
          // Remove any existing entry for this date
          const filtered = prev.filter(item => 
            item.date.getDate() !== date.getDate() || 
            item.date.getMonth() !== date.getMonth() || 
            item.date.getFullYear() !== date.getFullYear()
          );
          
          // Add the new times
          return [...filtered, times];
        });
        
        return times;
      } catch (error) {
        console.error('Error fetching prayer times:', error);
        return null;
      }
    }
    return null;
  };
  
  // Fetch prayer times for a range of dates
  const fetchPrayerTimesForRange = async (startDate: Date, days: number = 3) => {
    if (location && locationPermissionGranted) {
      try {
        console.log(`Fetching prayer times for ${days} days starting from: ${startDate.toDateString()}`);
        const times = await getPrayerTimesForRange(
          location.latitude,
          location.longitude,
          startDate,
          days,
          calculationMethod
        );
        
        // Update cache with new times
        setPrayerTimesCache(prev => {
          // Create a new array with all times that don't overlap with the new range
          const filtered = prev.filter(item => {
            const itemDate = startOfDay(item.date).getTime();
            const rangeStart = startOfDay(startDate).getTime();
            const rangeEnd = startOfDay(addDays(startDate, days - 1)).getTime();
            
            return itemDate < rangeStart || itemDate > rangeEnd;
          });
          
          // Add the new times
          return [...filtered, ...times];
        });
        
        return times;
      } catch (error) {
        console.error('Error fetching prayer times for range:', error);
        return null;
      }
    }
    return null;
  };
  
  // Refresh data manually
  const refreshData = async () => {
    console.log('Manually refreshing data');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Fetch from yesterday to ensure we have data for Hijri date logic
    await fetchPrayerTimesForRange(yesterday, 4);
    updateDisplayedPrayerTimes();
  };
  
  // Update the displayed prayer times based on the cache
  const updateDisplayedPrayerTimes = () => {
    const times = determineCurrentPrayerTimes();
    
    if (times) {
      setSehriTime(times.sehriTime);
      setIftarTime(times.iftarTime);
      setCalculationMethodName(times.methodName);
      
      // Set the Gregorian date from the API response
      setGregorianDate(times.gregorianDate);
      
      // Set the Hijri date based on whether we're showing today's or tomorrow's times
      if (isNextDay) {
        // If we're showing tomorrow's times, we need to find tomorrow's Hijri date
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        // Find tomorrow's prayer times in the cache
        const tomorrowTimes = prayerTimesCache.find(item => {
          const itemDate = new Date(item.date);
          itemDate.setHours(0, 0, 0, 0);
          return itemDate.getTime() === tomorrow.getTime();
        });
        
        if (tomorrowTimes) {
          // Apply Hijri date adjustment
          const adjustedHijriDate = adjustHijriDate(tomorrowTimes.hijriDate, hijriAdjustment);
          const adjustedHijriDateAr = adjustHijriDate(tomorrowTimes.hijriDateAr, hijriAdjustment);
          
          // Use tomorrow's adjusted Hijri date
          setHijriDate(language === 'ar' || language === 'ur' ? 
            adjustedHijriDateAr : 
            adjustedHijriDate);
          console.log(`Using tomorrow's adjusted Hijri date: ${adjustedHijriDate}`);
        } else {
          // Apply Hijri date adjustment to fallback date
          const adjustedHijriDate = adjustHijriDate(times.hijriDate, hijriAdjustment);
          const adjustedHijriDateAr = adjustHijriDate(times.hijriDateAr, hijriAdjustment);
          
          // Fallback to the current times' adjusted Hijri date
          setHijriDate(language === 'ar' || language === 'ur' ? 
            adjustedHijriDateAr : 
            adjustedHijriDate);
          console.log(`Using fallback adjusted Hijri date: ${adjustedHijriDate}`);
        }
      } else {
        // Apply Hijri date adjustment
        const adjustedHijriDate = adjustHijriDate(times.hijriDate, hijriAdjustment);
        const adjustedHijriDateAr = adjustHijriDate(times.hijriDateAr, hijriAdjustment);
        
        // If we're showing today's times, use the current times' adjusted Hijri date
        setHijriDate(language === 'ar' || language === 'ur' ? 
          adjustedHijriDateAr : 
          adjustedHijriDate);
        console.log(`Using today's adjusted Hijri date: ${adjustedHijriDate}`);
      }
      
      // Log the times being displayed
      console.log(`Set prayer times - Sehri: ${times.sehriTime.toLocaleString()}, Iftar: ${times.iftarTime.toLocaleString()}`);
      console.log(`Set dates - Gregorian: ${times.gregorianDate}, Hijri: ${hijriDate}`);
      console.log(`Is next day: ${isNextDay}`);
    }
  };
  
  // Fetch prayer times when location changes
  useEffect(() => {
    if (location && locationPermissionGranted) {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Fetch from yesterday to ensure we have data for Hijri date logic
      fetchPrayerTimesForRange(yesterday, 4).then(() => {
        updateDisplayedPrayerTimes();
      });
    }
  }, [location, locationPermissionGranted, calculationMethod]);
  
  // Update displayed prayer times when cache or language changes
  useEffect(() => {
    updateDisplayedPrayerTimes();
  }, [prayerTimesCache, language]);
  
  // Check if we need to update the displayed prayer times periodically
  useEffect(() => {
    const checkAndUpdateTimes = () => {
      updateDisplayedPrayerTimes();
      
      // If we're showing the next day's times, we should fetch more future days
      if (isNextDay && prayerTimesCache.length > 0) {
        const lastCachedDay = [...prayerTimesCache].sort((a, b) => 
          b.date.getTime() - a.date.getTime()
        )[0].date;
        
        fetchPrayerTimesForDate(addDays(lastCachedDay, 1));
      }
    };
    
    // Check immediately
    checkAndUpdateTimes();
    
    // Set up an interval to check periodically
    const interval = setInterval(checkAndUpdateTimes, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [sehriTime, iftarTime, prayerTimesCache]);
  
  // Load saved preferences from localStorage on initial load
  useEffect(() => {
    // Load language preference
    const savedLanguage = localStorage.getItem('language') || 'en';
    setLanguage(savedLanguage);
    
    // Load theme preference
    const savedTheme = localStorage.getItem('theme') || 'system';
    setThemeValue(savedTheme);
    
    // Load calculation method
    const savedCalculationMethod = localStorage.getItem('calculationMethod') as CalculationMethod || 'karachi';
    setCalculationMethod(savedCalculationMethod);
    
    // Load Hijri date adjustment
    const savedHijriAdjustment = localStorage.getItem('hijriAdjustment');
    if (savedHijriAdjustment !== null) {
      setHijriAdjustment(parseInt(savedHijriAdjustment, 10));
    }
    
    // Request location permission
    requestLocationPermission();
  }, []);
  
  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem('language', language);
    localStorage.setItem('calculationMethod', calculationMethod);
    localStorage.setItem('theme', theme || 'system');
    localStorage.setItem('hijriAdjustment', hijriAdjustment.toString());
  }, [language, calculationMethod, theme, hijriAdjustment]);
  
  const value = {
    location,
    locationPermissionGranted,
    requestLocationPermission,
    setLocation: setLocationState,
    setLocationPermissionGranted: setLocationPermissionGrantedState,
    sehriTime,
    iftarTime,
    isNextDay,
    calculationMethod,
    calculationMethodName,
    setCalculationMethod,
    language,
    setLanguage,
    theme: theme || 'system',
    setThemeValue,
    refreshData,
    gregorianDate,
    hijriDate,
    hijriAdjustment,
    setHijriAdjustment,
  };
  
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}; 