'use client';

import { useEffect, useState } from 'react';

interface WeatherData {
  temp: number;
  description: string;
  city: string;
}

export function HeroWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const geoRes = await fetch('/api/homepage/geolocation');
        if (!geoRes.ok) return;
        const geo = await geoRes.json();
        if (geo.error) return;

        const wRes = await fetch(`/api/homepage/weather?lat=${geo.lat}&lon=${geo.lon}`);
        if (!wRes.ok) return;
        const data = await wRes.json();
        if (data.error) return;

        setWeather({ temp: data.temp, description: data.description, city: geo.city });
      } catch { /* silent */ }
    }
    load();
  }, []);

  if (!weather) return <span>--° · --</span>;

  return (
    <span>☀ {weather.temp}°  <span className="sep">·</span>  {weather.description}  <span className="sep">·</span>  {weather.city}</span>
  );
}
