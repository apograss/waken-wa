'use client';

import { useEffect, useState } from 'react';

export function HeroSubtitle() {
  const [text, setText] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('https://v1.hitokoto.cn/?c=d&c=i&c=k&encode=json');
        if (res.ok) {
          const data = await res.json();
          setText(data.hitokoto || '');
        }
      } catch { /* silent */ }
    }
    load();
  }, []);

  if (!text) return <p className="hero-subtitle">&nbsp;</p>;

  return <p className="hero-subtitle">{text}</p>;
}
