'use client';

import { useEffect, useState } from 'react';

function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function DigitalClock() {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    // Set initial time immediately
    setTime(formatTime(new Date()));

    const interval = setInterval(() => {
      setTime(formatTime(new Date()));
    }, 1000);

    // Re-sync when page becomes visible again
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        setTime(formatTime(new Date()));
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return (
    <div className="text-6xl font-mono font-light tracking-wider text-foreground/90 select-none">
      {time || '\u00A0'}
    </div>
  );
}
