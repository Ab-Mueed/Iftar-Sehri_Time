'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import CountdownTimer from './CountdownTimer';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface TimerCardProps {
  title: 'sehri' | 'iftar';
  time: Date | null;
  isActive: boolean;
  onComplete?: () => void;
}

const TimerCard: React.FC<TimerCardProps> = ({ 
  title, 
  time, 
  isActive, 
  onComplete
}) => {
  const { t } = useTranslation();
  
  // Define background colors based on active state and title
  const getBgColor = () => {
    if (!isActive) return '';
    return title === 'sehri' 
      ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800' 
      : 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800';
  };
  
  // Define text colors based on active state and title
  const getTextColor = () => {
    if (!isActive) return 'text-muted-foreground';
    return title === 'sehri' 
      ? 'text-blue-700 dark:text-blue-300' 
      : 'text-orange-700 dark:text-orange-300';
  };
  
  return (
    <Card className={cn("transition-colors duration-300 w-full", getBgColor())}>
      <CardHeader>
        <CardTitle className={cn("text-center", getTextColor())}>
          {t(title)}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        {time ? (
          <div className={cn("text-xl font-semibold mb-4", getTextColor())}>
            {format(time, 'hh:mm a')}
          </div>
        ) : (
          <div className={cn("text-xl font-semibold mb-4", getTextColor())}>
            --:--
          </div>
        )}
        
        {isActive && (
          <CountdownTimer targetTime={time} onComplete={onComplete} />
        )}
      </CardContent>
    </Card>
  );
};

export default TimerCard; 