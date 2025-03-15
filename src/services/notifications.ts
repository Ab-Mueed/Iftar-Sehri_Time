// Check if browser supports notifications
export const isNotificationSupported = (): boolean => {
  return 'Notification' in window && 'serviceWorker' in navigator;
};

// Extended NotificationOptions interface to include vibrate property
interface ExtendedNotificationOptions extends NotificationOptions {
  vibrate?: number[];
}

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) {
    console.error('Notifications or Service Worker are not supported in this browser');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

// Register service worker for notifications
const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.error('Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    return registration;
  } catch (error) {
    console.error('Error getting service worker registration:', error);
    return null;
  }
};

// Send a notification
export const sendNotification = async (
  title: string,
  options: ExtendedNotificationOptions = {}
): Promise<boolean> => {
  if (!isNotificationSupported()) {
    console.error('Notifications are not supported in this browser');
    return false;
  }

  if (Notification.permission !== 'granted') {
    console.error('Notification permission not granted');
    return false;
  }

  try {
    // Try to use the service worker for notifications
    const registration = await registerServiceWorker();
    if (registration) {
      // Use type assertion to handle the vibrate property
      const notificationOptions = {
        ...options,
        icon: options.icon || '/icons/icon-192x192.png',
        badge: options.badge || '/icons/icon-192x192.png',
      } as NotificationOptions;
      
      // Add vibrate separately with type assertion
      if (options.vibrate) {
        (notificationOptions as any).vibrate = options.vibrate;
      } else {
        (notificationOptions as any).vibrate = [100, 50, 100];
      }
      
      await registration.showNotification(title, notificationOptions);
      return true;
    } else {
      // Fallback to regular notifications
      new Notification(title, options);
      return true;
    }
  } catch (error) {
    console.error('Error sending notification:', error);
    
    // Try fallback to regular Notification
    try {
      new Notification(title, options);
      return true;
    } catch (innerError) {
      console.error('Fallback notification also failed:', innerError);
      return false;
    }
  }
};

// Store scheduled notifications in localStorage to persist across page reloads
const storeScheduledNotification = (id: number, time: number, title: string, options: any): void => {
  const scheduledNotifications = JSON.parse(localStorage.getItem('scheduledNotifications') || '[]');
  scheduledNotifications.push({ id, time, title, options });
  localStorage.setItem('scheduledNotifications', JSON.stringify(scheduledNotifications));
};

const removeScheduledNotification = (id: number): void => {
  const scheduledNotifications = JSON.parse(localStorage.getItem('scheduledNotifications') || '[]');
  const filtered = scheduledNotifications.filter((notification: any) => notification.id !== id);
  localStorage.setItem('scheduledNotifications', JSON.stringify(filtered));
};

// Schedule a notification for a specific time
export const scheduleNotification = (
  title: string,
  scheduledTime: Date,
  options: ExtendedNotificationOptions = {}
): number => {
  const now = new Date();
  const timeUntilNotification = scheduledTime.getTime() - now.getTime();

  if (timeUntilNotification <= 0) {
    console.error('Cannot schedule notification in the past');
    return -1;
  }

  const id = window.setTimeout(async () => {
    await sendNotification(title, options);
    removeScheduledNotification(id);
  }, timeUntilNotification);

  storeScheduledNotification(id, scheduledTime.getTime(), title, options);
  return id;
};

// Cancel a scheduled notification
export const cancelScheduledNotification = (notificationId: number): void => {
  window.clearTimeout(notificationId);
  removeScheduledNotification(notificationId);
};

// Schedule Sehri notification
export const scheduleSehriNotification = (
  sehriTime: Date,
  minutesBefore: number,
  language: string
): number => {
  const notificationTime = new Date(sehriTime);
  notificationTime.setMinutes(notificationTime.getMinutes() - minutesBefore);

  const titles = {
    en: 'Sehri Time Approaching',
    ar: 'اقتراب وقت السحور',
    ur: 'سحری کا وقت قریب ہے',
    hi: 'सहरी का समय नज़दीक है'
  };

  const bodies = {
    en: `Sehri time is in ${minutesBefore} minutes. Prepare for your pre-dawn meal.`,
    ar: `وقت السحور بعد ${minutesBefore} دقائق. استعد لوجبة ما قبل الفجر.`,
    ur: `سحری کا وقت ${minutesBefore} منٹ میں ہے۔ سحری کی تیاری کریں۔`,
    hi: `सहरी का समय ${minutesBefore} मिनट में है। अपने भोजन के लिए तैयार हो जाएं।`
  };

  return scheduleNotification(titles[language as keyof typeof titles], notificationTime, {
    body: bodies[language as keyof typeof bodies],
    icon: '/icons/icon-192x192.png',
    vibrate: [100, 50, 100],
    badge: '/icons/icon-192x192.png',
    tag: 'sehri-notification' // Add a tag to replace existing notifications
  });
};

// Schedule Iftar notification
export const scheduleIftarNotification = (
  iftarTime: Date,
  minutesBefore: number,
  language: string
): number => {
  const notificationTime = new Date(iftarTime);
  notificationTime.setMinutes(notificationTime.getMinutes() - minutesBefore);

  const titles = {
    en: 'Iftar Time Approaching',
    ar: 'اقتراب وقت الإفطار',
    ur: 'افطار کا وقت قریب ہے',
    hi: 'इफ्तार का समय नज़दीक है'
  };

  const bodies = {
    en: `Iftar time is in ${minutesBefore} minutes. Prepare to break your fast.`,
    ar: `وقت الإفطار بعد ${minutesBefore} دقائق. استعد لكسر صيامك.`,
    ur: `افطار کا وقت ${minutesBefore} منٹ میں ہے۔ روزہ افطار کرنے کی تیاری کریں۔`,
    hi: `इफ्तार का समय ${minutesBefore} मिनट में है। रोज़ा खोलने की तैयारी करें।`
  };

  return scheduleNotification(titles[language as keyof typeof titles], notificationTime, {
    body: bodies[language as keyof typeof bodies],
    icon: '/icons/icon-192x192.png',
    vibrate: [100, 50, 100],
    badge: '/icons/icon-192x192.png',
    tag: 'iftar-notification' // Add a tag to replace existing notifications
  });
}; 