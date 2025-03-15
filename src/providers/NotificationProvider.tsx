'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { scheduleIftarNotification, scheduleSehriNotification } from '@/services/notifications';
import { useAppContext } from '@/context/AppContext';

interface NotificationContextType {
  notificationsEnabled: boolean;
  sehriNotificationEnabled: boolean;
  iftarNotificationEnabled: boolean;
  notificationTime: number;
  toggleNotifications: () => void;
  toggleSehriNotification: () => void;
  toggleIftarNotification: () => void;
  setNotificationTimeMinutes: (minutes: number) => void;
  requestPermission: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { t } = useTranslation();
  const { sehriTime, iftarTime, language } = useAppContext();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);
  const [sehriNotificationEnabled, setSehriNotificationEnabled] = useState<boolean>(false);
  const [iftarNotificationEnabled, setIftarNotificationEnabled] = useState<boolean>(false);
  const [notificationTime, setNotificationTime] = useState<number>(15); // Default 15 minutes before
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);

  // Check if notifications are supported and permission is granted
  useEffect(() => {
    const checkPermission = async () => {
      if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return;
      }

      if (Notification.permission === 'granted') {
        setPermissionGranted(true);
        
        // Load notification preferences from localStorage
        const storedNotificationsEnabled = localStorage.getItem('notificationsEnabled') === 'true';
        const storedSehriNotificationEnabled = localStorage.getItem('sehriNotificationEnabled') === 'true';
        const storedIftarNotificationEnabled = localStorage.getItem('iftarNotificationEnabled') === 'true';
        const storedNotificationTime = parseInt(localStorage.getItem('notificationTime') || '15', 10);
        
        setNotificationsEnabled(storedNotificationsEnabled);
        setSehriNotificationEnabled(storedSehriNotificationEnabled);
        setIftarNotificationEnabled(storedIftarNotificationEnabled);
        setNotificationTime(storedNotificationTime);
      }
    };

    checkPermission();
  }, []);

  // Schedule notifications when settings or times change
  useEffect(() => {
    if (notificationsEnabled && permissionGranted) {
      if (sehriNotificationEnabled && sehriTime) {
        scheduleSehriNotification(sehriTime, notificationTime, language);
      }
      
      if (iftarNotificationEnabled && iftarTime) {
        scheduleIftarNotification(iftarTime, notificationTime, language);
      }
    }
  }, [
    notificationsEnabled, 
    sehriNotificationEnabled, 
    iftarNotificationEnabled, 
    notificationTime, 
    sehriTime, 
    iftarTime, 
    permissionGranted,
    language
  ]);

  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      setPermissionGranted(true);
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setPermissionGranted(granted);
      return granted;
    }

    return false;
  };

  const toggleNotifications = () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    localStorage.setItem('notificationsEnabled', String(newValue));
  };

  const toggleSehriNotification = () => {
    const newValue = !sehriNotificationEnabled;
    setSehriNotificationEnabled(newValue);
    localStorage.setItem('sehriNotificationEnabled', String(newValue));
  };

  const toggleIftarNotification = () => {
    const newValue = !iftarNotificationEnabled;
    setIftarNotificationEnabled(newValue);
    localStorage.setItem('iftarNotificationEnabled', String(newValue));
  };

  const setNotificationTimeMinutes = (minutes: number) => {
    setNotificationTime(minutes);
    localStorage.setItem('notificationTime', String(minutes));
  };

  const value = {
    notificationsEnabled,
    sehriNotificationEnabled,
    iftarNotificationEnabled,
    notificationTime,
    toggleNotifications,
    toggleSehriNotification,
    toggleIftarNotification,
    setNotificationTimeMinutes,
    requestPermission,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export default NotificationProvider; 