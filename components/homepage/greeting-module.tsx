'use client';

import { useEffect, useState } from 'react';
import { getTimePeriod } from './constants';

const GREETINGS: Record<string, string> = {
  morning: '早上好',
  afternoon: '下午好',
  evening: '晚上好',
};

export function GreetingModule() {
  const [greeting, setGreeting] = useState('');
  const [subtitle, setSubtitle] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    const period = getTimePeriod(hour);
    setGreeting(GREETINGS[period]);

    // Fetch a hitokoto (one-liner) as subtitle
    fetchHitokoto();
  }, []);

  async function fetchHitokoto() {
    try {
      const res = await fetch('https://v1.hitokoto.cn/?c=d&c=i&c=k&encode=json');
      if (res.ok) {
        const data = await res.json();
        setSubtitle(data.hitokoto || '');
      }
    } catch {
      // Silently fail — greeting still shows without subtitle
    }
  }

  return (
    <div className="text-center mt-3 space-y-1">
      <p className="text-base text-foreground/70 font-light">
        {greeting}
        {subtitle && (
          <span className="text-muted-foreground/60">
            {'，'}
            {subtitle}
          </span>
        )}
      </p>
    </div>
  );
}
