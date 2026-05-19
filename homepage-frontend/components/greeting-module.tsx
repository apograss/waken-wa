'use client';

import { useEffect, useState } from 'react';
import { getTimePeriod } from './constants';

const GREETINGS: Record<string, string> = {
  morning: '早上好',
  afternoon: '下午好',
  evening: '晚上好',
};

/**
 * Simple greeting based on time of day.
 * Does NOT fetch hitokoto — waken-wa's UserProfileNoteSection already handles that.
 */
export function GreetingModule() {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    const period = getTimePeriod(hour);
    setGreeting(GREETINGS[period]);
  }, []);

  if (!greeting) return null;

  return (
    <div className="text-center mt-3">
      <p className="text-base text-foreground/60 font-light">
        {greeting}
      </p>
    </div>
  );
}
