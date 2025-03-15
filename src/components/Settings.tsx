'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '@/context/AppContext';
import { useNotification } from '@/providers/NotificationProvider';
import { Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CALCULATION_METHODS, CALCULATION_METHOD_NAMES, CalculationMethod } from '@/services/prayerTimes';

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const {
    language,
    setLanguage,
    theme,
    setThemeValue,
    calculationMethod,
    calculationMethodName,
    setCalculationMethod,
    requestLocationPermission,
    locationPermissionGranted,
    hijriAdjustment,
    setHijriAdjustment,
  } = useAppContext();

  const {
    notificationsEnabled,
    sehriNotificationEnabled,
    iftarNotificationEnabled,
    notificationTime,
    toggleNotifications,
    toggleSehriNotification,
    toggleIftarNotification,
    setNotificationTimeMinutes,
    requestPermission,
  } = useNotification();

  const [open, setOpen] = useState(false);

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
  };

  const handleThemeChange = (value: string) => {
    setThemeValue(value);
  };

  const handleNotificationTimeChange = (value: string) => {
    setNotificationTimeMinutes(parseInt(value, 10));
  };

  const handleCalculationMethodChange = (value: string) => {
    setCalculationMethod(value as CalculationMethod);
  };

  const handleNotificationPermission = async () => {
    await requestPermission();
  };

  const handleHijriAdjustmentChange = (value: string) => {
    setHijriAdjustment(parseInt(value, 10));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('settings')}>
          <SettingsIcon className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('settings')}</DialogTitle>
          <DialogDescription>
            Customize your Ramadan Timer experience
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Language Settings */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="language" className="text-right">
              {t('language')}
            </Label>
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger id="language" className="col-span-3">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">العربية</SelectItem>
                <SelectItem value="ur">اردو</SelectItem>
                <SelectItem value="hi">हिन्दी</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Theme Settings */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="theme" className="text-right">
              {t('theme')}
            </Label>
            <Select value={theme} onValueChange={handleThemeChange}>
              <SelectTrigger id="theme" className="col-span-3">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">{t('light')}</SelectItem>
                <SelectItem value="dark">{t('dark')}</SelectItem>
                <SelectItem value="system">{t('system')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Calculation Method */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="calculation" className="text-right">
              {t('calculation_method')}
            </Label>
            <Select value={calculationMethod} onValueChange={handleCalculationMethodChange}>
              <SelectTrigger id="calculation" className="col-span-3">
                <SelectValue placeholder="Select calculation method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="karachi">{CALCULATION_METHOD_NAMES.karachi}</SelectItem>
                <SelectItem value="isna">{CALCULATION_METHOD_NAMES.isna}</SelectItem>
                <SelectItem value="mwl">{CALCULATION_METHOD_NAMES.mwl}</SelectItem>
                <SelectItem value="makkah">{CALCULATION_METHOD_NAMES.makkah}</SelectItem>
                <SelectItem value="egypt">{CALCULATION_METHOD_NAMES.egypt}</SelectItem>
                <SelectItem value="tehran">{CALCULATION_METHOD_NAMES.tehran}</SelectItem>
                <SelectItem value="shia">{CALCULATION_METHOD_NAMES.shia}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Notification Settings */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notifications" className="text-right">
              {t('notifications')}
            </Label>
            <div className="col-span-3 flex items-center space-x-2">
              <Switch
                id="notifications"
                checked={notificationsEnabled}
                onCheckedChange={toggleNotifications}
              />
              <Label htmlFor="notifications">Enable</Label>
            </div>
          </div>
          
          {/* Sehri Notification */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sehriNotification" className="text-right">
              {t('enable_sehri_notification')}
            </Label>
            <div className="col-span-3 flex items-center space-x-2">
              <Switch
                id="sehriNotification"
                checked={sehriNotificationEnabled}
                onCheckedChange={toggleSehriNotification}
                disabled={!notificationsEnabled}
              />
              <Label htmlFor="sehriNotification">Enable</Label>
            </div>
          </div>
          
          {/* Iftar Notification */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="iftarNotification" className="text-right">
              {t('enable_iftar_notification')}
            </Label>
            <div className="col-span-3 flex items-center space-x-2">
              <Switch
                id="iftarNotification"
                checked={iftarNotificationEnabled}
                onCheckedChange={toggleIftarNotification}
                disabled={!notificationsEnabled}
              />
              <Label htmlFor="iftarNotification">Enable</Label>
            </div>
          </div>
          
          {/* Notification Time */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notificationTime" className="text-right">
              {t('notification_time')}
            </Label>
            <Select 
              value={notificationTime.toString()} 
              onValueChange={handleNotificationTimeChange}
              disabled={!notificationsEnabled}
            >
              <SelectTrigger id="notificationTime" className="col-span-3">
                <SelectValue placeholder="Select notification time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 {t('minutes_before')}</SelectItem>
                <SelectItem value="10">10 {t('minutes_before')}</SelectItem>
                <SelectItem value="15">15 {t('minutes_before')}</SelectItem>
                <SelectItem value="30">30 {t('minutes_before')}</SelectItem>
                <SelectItem value="60">60 {t('minutes_before')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Hijri Date Adjustment */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="hijriAdjustment" className="text-right">
              {t('hijri_adjustment')}
            </Label>
            <Select value={hijriAdjustment.toString()} onValueChange={handleHijriAdjustmentChange}>
              <SelectTrigger id="hijriAdjustment" className="col-span-3">
                <SelectValue placeholder="Select Hijri date adjustment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-2">-2 {t('days')}</SelectItem>
                <SelectItem value="-1">-1 {t('day')}</SelectItem>
                <SelectItem value="0">0 {t('days')}</SelectItem>
                <SelectItem value="1">+1 {t('day')}</SelectItem>
                <SelectItem value="2">+2 {t('days')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Location Permission */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">
              {t('location_permission')}
            </Label>
            <div className="col-span-3">
              {locationPermissionGranted ? (
                <div className="text-green-500 text-sm">✓ {t('location_permission')} granted</div>
              ) : (
                <Button onClick={requestLocationPermission} variant="outline">
                  {t('grant_permission')}
                </Button>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => setOpen(false)}>
            {t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Settings; 