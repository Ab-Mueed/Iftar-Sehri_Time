'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface CountdownTimerProps {
  targetTime: Date | null;
  onComplete?: () => void;
}

interface TimeRemaining {
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetTime, onComplete }) => {
  const { t } = useTranslation();
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
  });
  const [completed, setCompleted] = useState(false);
  const completedRef = useRef(false);

  useEffect(() => {
    if (!targetTime) return;
    
    // Reset completed state when target time changes
    setCompleted(false);
    completedRef.current = false;

    const calculateTimeRemaining = (): TimeRemaining => {
      const now = new Date();
      const difference = targetTime.getTime() - now.getTime();
      
      // If the target time is in the past, return zeros
      if (difference <= 0) {
        return {
          hours: 0,
          minutes: 0,
          seconds: 0,
          total: 0,
        };
      }
      
      // Calculate hours, minutes, and seconds
      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      return {
        hours,
        minutes,
        seconds,
        total: difference,
      };
    };

    // Initial calculation
    const initialRemaining = calculateTimeRemaining();
    setTimeRemaining(initialRemaining);
    
    // If already completed at initialization, trigger onComplete
    if (initialRemaining.total <= 0 && !completedRef.current) {
      setCompleted(true);
      completedRef.current = true;
      if (onComplete) {
        onComplete();
      }
      return;
    }

    // Update the countdown every second
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);
      
      // Check if countdown is complete and hasn't been marked as completed yet
      if (remaining.total <= 0 && !completedRef.current) {
        clearInterval(interval);
        setCompleted(true);
        completedRef.current = true;
        if (onComplete) {
          onComplete();
        }
      }
    }, 1000);

    // Clean up the interval on unmount
    return () => clearInterval(interval);
  }, [targetTime, onComplete]);

  return (
    <div className="w-full">
      <h3 className="text-lg font-medium mb-2">{t('time_remaining')}</h3>
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center">
          <div className="text-3xl font-bold">{timeRemaining.hours.toString().padStart(2, '0')}</div>
          <div className="text-xs">{t('hours')}</div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-3xl font-bold">{timeRemaining.minutes.toString().padStart(2, '0')}</div>
          <div className="text-xs">{t('minutes')}</div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-3xl font-bold">{timeRemaining.seconds.toString().padStart(2, '0')}</div>
          <div className="text-xs">{t('seconds')}</div>
        </div>
      </div>
      {completed && (
        <div className="mt-2 text-center text-sm text-primary">
          {t('time_completed')}
        </div>
      )}
    </div>
  );
};

export default CountdownTimer; 