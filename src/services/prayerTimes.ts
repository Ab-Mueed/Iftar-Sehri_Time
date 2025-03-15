import { toast } from '@/hooks/use-toast';

// Define the calculation methods
export const CALCULATION_METHODS = {
  karachi: 1, // University of Islamic Sciences, Karachi
  isna: 2, // Islamic Society of North America (ISNA)
  mwl: 3, // Muslim World League
  makkah: 4, // Umm al-Qura, Makkah
  egypt: 5, // Egyptian General Authority of Survey
  tehran: 7, // Institute of Geophysics, University of Tehran
  shia: 0, // Shia Ithna-Ashari, Leva Research Institute, Qum
};

export type CalculationMethod = keyof typeof CALCULATION_METHODS;

// Define the calculation method names for display
export const CALCULATION_METHOD_NAMES = {
  karachi: 'University of Islamic Sciences, Karachi',
  isna: 'Islamic Society of North America',
  mwl: 'Muslim World League',
  makkah: 'Umm al-Qura, Makkah',
  egypt: 'Egyptian General Authority of Survey',
  tehran: 'Institute of Geophysics, University of Tehran',
  shia: 'Shia Ithna-Ashari, Leva Research Institute, Qum',
};

// Define the prayer times response interface
interface PrayerTimesResponse {
  code: number;
  status: string;
  data: {
    timings: {
      Fajr: string;
      Sunrise: string;
      Dhuhr: string;
      Asr: string;
      Sunset: string;
      Maghrib: string;
      Isha: string;
      Imsak: string;
      Midnight: string;
      Firstthird: string;
      Lastthird: string;
    };
    date: {
      readable: string;
      timestamp: string;
      gregorian: {
        date: string;
        format: string;
        day: string;
        weekday: {
          en: string;
        };
        month: {
          number: number;
          en: string;
        };
        year: string;
        designation: {
          abbreviated: string;
          expanded: string;
        };
      };
      hijri: {
        date: string;
        format: string;
        day: string;
        weekday: {
          en: string;
          ar: string;
        };
        month: {
          number: number;
          en: string;
          ar: string;
        };
        year: string;
        designation: {
          abbreviated: string;
          expanded: string;
        };
        holidays: string[];
      };
    };
    meta: {
      latitude: number;
      longitude: number;
      timezone: string;
      method: {
        id: number;
        name: string;
        params: {
          Fajr: number;
          Isha: number;
        };
        location: {
          latitude: number;
          longitude: number;
        };
      };
      latitudeAdjustmentMethod: string;
      midnightMode: string;
      school: string;
      offset: {
        Imsak: number;
        Fajr: number;
        Sunrise: number;
        Dhuhr: number;
        Asr: number;
        Maghrib: number;
        Sunset: number;
        Isha: number;
        Midnight: number;
      };
    };
  };
}

// WorldTimeAPI response interface
interface WorldTimeResponse {
  abbreviation: string;
  client_ip: string;
  datetime: string;
  day_of_week: number;
  day_of_year: number;
  dst: boolean;
  dst_from: string | null;
  dst_offset: number;
  dst_until: string | null;
  raw_offset: number;
  timezone: string;
  unixtime: number;
  utc_datetime: string;
  utc_offset: string;
  week_number: number;
}

export interface PrayerTimes {
  sehriTime: Date;
  iftarTime: Date;
  methodName: string;
  methodId: number;
  gregorianDate: string;
  hijriDate: string;
  hijriDateAr: string;
  timestamp: number;
  date: Date;
}

// Get accurate date and time from WorldTimeAPI
const getAccurateDateTime = async (): Promise<Date> => {
  try {
    // Get the timezone for the user's location
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const url = `https://worldtimeapi.org/api/timezone/${timezone}`;
    
    console.log(`Fetching accurate time from: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`WorldTimeAPI request failed with status ${response.status}`);
    }
    
    const data: WorldTimeResponse = await response.json();
    console.log('WorldTimeAPI Response:', data);
    
    // Parse the datetime string to a Date object
    const accurateDate = new Date(data.datetime);
    console.log(`Accurate date and time: ${accurateDate.toLocaleString()}`);
    
    return accurateDate;
  } catch (error) {
    console.error('Error fetching accurate time:', error);
    // Fallback to browser's date if WorldTimeAPI fails
    console.log('Falling back to browser date');
    return new Date();
  }
};

// Convert time string from API (HH:MM format) to Date object
const convertTimeStringToDate = (timeString: string, date: Date): Date => {
  // Extract hours and minutes from the time string
  const [hoursStr, minutesStr] = timeString.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  
  // Create a new date object based on the input date to avoid modifying the original
  const newDate = new Date(date);
  
  // Set the hours and minutes
  newDate.setHours(hours, minutes, 0, 0);
  
  console.log(`Converting time string: ${timeString} for date: ${date.toDateString()} => ${newDate.toLocaleString()}`);
  
  return newDate;
};

// Get calculation method ID based on user preference
const getCalculationMethodId = (method: CalculationMethod): number => {
  return CALCULATION_METHODS[method];
};

// Format date for API request (DD-MM-YYYY)
const formatDateForApi = (date: Date): string => {
  // Ensure we're working with a copy of the date to avoid modifying the original
  const dateCopy = new Date(date);
  
  // Get the date in the local timezone
  const day = dateCopy.getDate().toString().padStart(2, '0');
  const month = (dateCopy.getMonth() + 1).toString().padStart(2, '0');
  const year = dateCopy.getFullYear();
  
  const formatted = `${day}-${month}-${year}`;
  console.log(`Original date: ${date.toISOString()}, Formatted for API: ${formatted}`);
  
  return formatted;
};

// Fetch prayer times from Al-Adhan API
export const getPrayerTimes = async (
  latitude: number,
  longitude: number,
  date: Date,
  calculationMethod: CalculationMethod = 'karachi'
): Promise<PrayerTimes> => {
  try {
    const formattedDate = formatDateForApi(date);
    const methodId = getCalculationMethodId(calculationMethod);
    
    // Get the timezone for the user's location
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    console.log(`Fetching prayer times for: ${formattedDate} in timezone ${timezone}`);
    console.log(`Date object passed to API: ${date.toISOString()}`);
    
    // Build the API URL with more parameters for accuracy
    // 1 = Shafi (standard for Sunni)
    // adjustment = 1 for higher latitudes
    // tune=0,0,0,0,0,0,0,0,0 (no adjustments to prayer times)
    const url = `https://api.aladhan.com/v1/timings/${formattedDate}?latitude=${latitude}&longitude=${longitude}&method=${methodId}&school=1&adjustment=1&tune=0,0,0,0,0,0,0,0,0&timezone=${timezone}`;
    
    console.log(`API URL: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data: PrayerTimesResponse = await response.json();
    
    // Log the full API response for debugging
    console.log('API Response Data:', {
      gregorian: data.data.date.gregorian,
      hijri: data.data.date.hijri,
      timings: data.data.timings
    });
    
    // For Sehri time, we use Imsak (beginning of fasting)
    // For Iftar time, we use Maghrib (sunset)
    const sehriTime = convertTimeStringToDate(data.data.timings.Imsak, date);
    const iftarTime = convertTimeStringToDate(data.data.timings.Maghrib, date);
    
    console.log(`Sehri time: ${sehriTime.toLocaleString()}, Iftar time: ${iftarTime.toLocaleString()}`);
    
    // Format Hijri date from API response
    const hijriDay = data.data.date.hijri.day;
    const hijriMonth = data.data.date.hijri.month.en;
    const hijriYear = data.data.date.hijri.year;
    const hijriDate = `${hijriDay} ${hijriMonth}, ${hijriYear} AH`;
    
    // Arabic version of Hijri date
    const hijriMonthAr = data.data.date.hijri.month.ar;
    const hijriDateAr = `${hijriDay} ${hijriMonthAr}, ${hijriYear}`;
    
    // Format Gregorian date
    const gregorianDate = `${data.data.date.gregorian.weekday.en}, ${data.data.date.gregorian.day} ${data.data.date.gregorian.month.en} ${data.data.date.gregorian.year}`;
    
    console.log(`Gregorian date from API: ${gregorianDate}, Hijri date from API: ${hijriDate}`);
    
    return { 
      sehriTime, 
      iftarTime, 
      methodName: data.data.meta.method.name,
      methodId: data.data.meta.method.id,
      gregorianDate,
      hijriDate,
      hijriDateAr,
      timestamp: parseInt(data.data.date.timestamp),
      date: date
    };
  } catch (error) {
    console.error('Error fetching prayer times:', error);
    toast({
      title: 'Error fetching prayer times',
      description: 'Please check your internet connection and try again.',
      variant: 'destructive',
    });
    throw error;
  }
};

// Get prayer times for multiple days
export const getPrayerTimesForRange = async (
  latitude: number,
  longitude: number,
  startDate: Date,
  days: number = 2,
  calculationMethod: CalculationMethod = 'karachi'
): Promise<PrayerTimes[]> => {
  try {
    const results: PrayerTimes[] = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const prayerTimes = await getPrayerTimes(
        latitude,
        longitude,
        date,
        calculationMethod
      );
      
      results.push(prayerTimes);
    }
    
    return results;
  } catch (error) {
    console.error('Error fetching prayer times for range:', error);
    toast({
      title: 'Error fetching prayer times',
      description: 'Please check your internet connection and try again.',
      variant: 'destructive',
    });
    throw error;
  }
};

// Get prayer times for the current month (Ramadan)
export const getRamadanTimes = async (
  latitude: number,
  longitude: number,
  year: number,
  month: number,
  calculationMethod: CalculationMethod = 'karachi'
): Promise<PrayerTimes[]> => {
  try {
    const methodId = getCalculationMethodId(calculationMethod);
    
    // Get the timezone for the user's location
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    console.log(`Fetching Ramadan calendar for: ${month}-${year} in timezone ${timezone}`);
    
    // Build the API URL with more parameters for accuracy
    // 1 = Shafi (standard for Sunni)
    // adjustment = 1 for higher latitudes
    // tune=0,0,0,0,0,0,0,0,0 (no adjustments to prayer times)
    const url = `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${latitude}&longitude=${longitude}&method=${methodId}&school=1&adjustment=1&tune=0,0,0,0,0,0,0,0,0&timezone=${timezone}`;
    
    console.log(`API URL: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Map the response to an array of PrayerTimes objects
    const prayerTimes = data.data.map((day: any) => {
      const date = new Date(day.date.gregorian.year, day.date.gregorian.month.number - 1, day.date.gregorian.day);
      const sehriTime = convertTimeStringToDate(day.timings.Imsak, date);
      const iftarTime = convertTimeStringToDate(day.timings.Maghrib, date);
      
      // Format Hijri date from API response
      const hijriDay = day.date.hijri.day;
      const hijriMonth = day.date.hijri.month.en;
      const hijriYear = day.date.hijri.year;
      const hijriDate = `${hijriDay} ${hijriMonth}, ${hijriYear} AH`;
      
      // Arabic version of Hijri date
      const hijriMonthAr = day.date.hijri.month.ar;
      const hijriDateAr = `${hijriDay} ${hijriMonthAr}, ${hijriYear}`;
      
      // Format Gregorian date
      const gregorianDate = `${day.date.gregorian.weekday.en}, ${day.date.gregorian.day} ${day.date.gregorian.month.en} ${day.date.gregorian.year}`;
      
      return { 
        sehriTime, 
        iftarTime, 
        methodName: data.data[0].meta.method.name,
        methodId: data.data[0].meta.method.id,
        gregorianDate,
        hijriDate,
        hijriDateAr,
        timestamp: parseInt(day.date.timestamp),
        date: date
      };
    });
    
    return prayerTimes;
  } catch (error) {
    console.error('Error fetching Ramadan prayer times:', error);
    toast({
      title: 'Error fetching Ramadan calendar',
      description: 'Please check your internet connection and try again.',
      variant: 'destructive',
    });
    throw error;
  }
}; 