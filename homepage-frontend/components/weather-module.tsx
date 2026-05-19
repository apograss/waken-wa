'use client';

import { useEffect, useState } from 'react';

interface WeatherState {
  status: 'loading' | 'success' | 'error';
  temp?: number;
  icon?: string;
  description?: string;
  city?: string;
  feelsLike?: number;
  humidity?: number;
  windSpeed?: string;
  error?: string;
}

export function WeatherModule() {
  const [weather, setWeather] = useState<WeatherState>({ status: 'loading' });
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchWeather() {
      try {
        // Step 1: Get geolocation
        const geoRes = await fetch('/api/homepage/geolocation');
        if (!geoRes.ok) {
          setWeather({ status: 'error', error: 'locationFailed' });
          return;
        }
        const geo = await geoRes.json();
        if (geo.error) {
          setWeather({ status: 'error', error: 'locationFailed' });
          return;
        }

        // Step 2: Get weather
        const weatherRes = await fetch(`/api/homepage/weather?lat=${geo.lat}&lon=${geo.lon}`);
        if (!weatherRes.ok) {
          setWeather({ status: 'error', error: 'fetchFailed' });
          return;
        }
        const data = await weatherRes.json();
        if (data.error) {
          setWeather({ status: 'error', error: 'fetchFailed' });
          return;
        }

        setWeather({
          status: 'success',
          temp: data.temp,
          icon: data.icon,
          description: data.description,
          city: geo.city,
          feelsLike: data.feelsLike,
          humidity: data.humidity,
          windSpeed: data.windSpeed,
        });
      } catch {
        setWeather({ status: 'error', error: 'fetchFailed' });
      }
    }

    fetchWeather();
  }, []);

  // HeFeng weather icon URL
  const iconUrl = weather.icon
    ? `https://a.hecdn.net/img/common/icon/202106d/${weather.icon}.png`
    : undefined;

  return (
    <div
      className="absolute top-4 left-4 z-10"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background/30 backdrop-blur-sm border border-border/20 transition-all duration-300 cursor-default">
        {weather.status === 'loading' && (
          <span className="text-sm text-muted-foreground animate-pulse">...</span>
        )}

        {weather.status === 'error' && (
          <span className="text-sm text-muted-foreground">--°</span>
        )}

        {weather.status === 'success' && (
          <>
            {iconUrl && (
              <img src={iconUrl} alt={weather.description} className="w-5 h-5" />
            )}
            <span className="text-sm font-medium text-foreground/80">
              {weather.temp}°
            </span>
          </>
        )}

        {/* Expanded details */}
        {expanded && weather.status === 'success' && (
          <div className="flex items-center gap-2 overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200">
            <span className="text-sm text-muted-foreground">
              {weather.city}
            </span>
            <span className="text-sm text-muted-foreground">
              {weather.description}
            </span>
            {weather.feelsLike !== undefined && (
              <span className="text-xs text-muted-foreground/70">
                体感 {weather.feelsLike}°
              </span>
            )}
          </div>
        )}

        {expanded && weather.status === 'error' && (
          <span className="text-sm text-muted-foreground animate-in fade-in duration-200">
            {weather.error === 'locationFailed' ? '定位失败' : '天气不可用'}
          </span>
        )}
      </div>
    </div>
  );
}
