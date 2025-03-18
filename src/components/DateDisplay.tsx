import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

const DateDisplay = () => {
  const { t } = useTranslation();
  const { isNextDay, gregorianDate, hijriDate } = useAppContext();

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-primary" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">{gregorianDate}</span>
              <span className="text-xs text-muted-foreground">{hijriDate}</span>
            </div>
          </div>
          <div className="flex items-center">
            <span className="text-xs sm:text-sm font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">
              {isNextDay ? t('showing_tomorrow') : t('showing_today')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DateDisplay; 