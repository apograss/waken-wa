'use client';

import { useEffect, useState } from 'react';
import { getTimePeriod } from './constants';

const GREETINGS: Record<string, string> = {
  morning: '早上好',
  afternoon: '下午好',
  evening: '晚上好',
};

export function HeroGreeting() {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(GREETINGS[getTimePeriod(hour)]);
  }, []);

  return <h1 className="hero-greeting">{greeting || '\u00A0'}</h1>;
}
