'use client';

import { useEffect, useRef, useState } from 'react';

interface WeatherData {
  temp: number;
  description: string;
  city: string;
  feelsLike?: number;
  humidity?: number;
  windSpeed?: string;
  iconName: string;
  lat: number;
  lon: number;
}

interface HourlyEntry {
  utcIso: string;
  temp: number;
  description: string;
  precipitation: number;
}

function resolveIconName(description: string, hour: number): string {
  const desc = (description || '').toLowerCase();
  const isNight = hour < 6 || hour >= 19;

  if (desc.includes('storm') || desc.includes('雷')) return 'STORM_RAIN';
  if (desc.includes('暴雨') || desc.includes('heavy rain')) return 'HEAVY_RAIN';
  if (desc.includes('中雨') || desc.includes('moderate rain')) return 'MODERATE_RAIN';
  if (
    desc.includes('小雨') ||
    desc.includes('毛毛雨') ||
    desc.includes('light rain') ||
    desc.includes('rain') ||
    desc.includes('雨')
  ) return 'LIGHT_RAIN';

  if (desc.includes('暴雪') || desc.includes('heavy snow')) return 'HEAVY_SNOW';
  if (desc.includes('中雪')) return 'MODERATE_SNOW';
  if (desc.includes('snow') || desc.includes('雪')) return 'LIGHT_SNOW';

  if (desc.includes('轻雾') || desc.includes('雾') || desc.includes('fog')) return 'FOG';
  if (desc.includes('沙尘') || desc.includes('dust') || desc.includes('沙')) return 'DUST';
  if (desc.includes('风') || desc.includes('wind')) return 'WIND';

  if (desc.includes('严重霾')) return 'HEAVY_HAZE';
  if (desc.includes('中度霾')) return 'MODERATE_HAZE';
  if (desc.includes('霾') || desc.includes('haze')) return 'LIGHT_HAZE';

  if (desc.includes('阴') || desc.includes('overcast')) return 'CLOUDY';
  if (desc.includes('多云') || desc.includes('partly cloud')) {
    return isNight ? 'PARTLY_CLOUDY_NIGHT' : 'PARTLY_CLOUDY_DAY';
  }
  if (desc.includes('cloud') || desc.includes('云')) return 'CLOUDY';

  return isNight ? 'CLEAR_NIGHT' : 'CLEAR_DAY';
}

export function HeroWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [open, setOpen] = useState(false);
  const [hourly, setHourly] = useState<HourlyEntry[] | null>(null);
  const [hourlyLoading, setHourlyLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

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

        const hour = new Date().getHours();
        setWeather({
          temp: data.temp,
          description: data.description,
          city: geo.city,
          feelsLike: data.feelsLike,
          humidity: data.humidity,
          windSpeed: data.windSpeed,
          iconName: resolveIconName(data.description, hour),
          lat: geo.lat,
          lon: geo.lon,
        });
      } catch { /* silent */ }
    }
    load();
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Fetch hourly when first opened
  useEffect(() => {
    if (!open || !weather || hourly || hourlyLoading) return;
    const { lat, lon } = weather;

    async function loadHourly() {
      setHourlyLoading(true);
      try {
        const response = await fetch(`/api/homepage/weather/hourly?lat=${lat}&lon=${lon}`);
        const data = response.ok ? await response.json() : null;
        if (data?.hourly) setHourly(data.hourly);
      } catch {
        /* silent */
      } finally {
        setHourlyLoading(false);
      }
    }

    void loadHourly();
  }, [open, weather, hourly, hourlyLoading]);

  if (!weather) {
    return (
      <div className="weather-card weather-card-loading">
        <span>--°</span>
      </div>
    );
  }

  return (
    <div ref={cardRef} className="weather-card-wrap">
      <button
        type="button"
        className={`weather-card ${open ? 'weather-card-open' : ''}`}
        onClick={() => setOpen(!open)}
        aria-label="天气详情"
      >
        <img
          src={`/weather-icons/${weather.iconName}.svg`}
          alt={weather.description}
          className="weather-icon"
        />
        <span className="weather-temp">{weather.temp}°</span>
        <span className="weather-city-inline">{weather.city}</span>
      </button>

      {open && (
        <div className="weather-popover">
          <div className="weather-popover-head">
            <div>
              <div className="weather-popover-city">{weather.city}</div>
              <div className="weather-popover-desc">
                {weather.description}
                {weather.feelsLike !== undefined && (
                  <span className="weather-popover-feels"> · 体感 {weather.feelsLike}°</span>
                )}
              </div>
            </div>
            <div className="weather-popover-temp">
              <img
                src={`/weather-icons/${weather.iconName}.svg`}
                alt=""
                className="weather-popover-icon"
              />
              <span>{weather.temp}°</span>
            </div>
          </div>

          {(weather.humidity !== undefined || weather.windSpeed) && (
            <div className="weather-popover-meta">
              {weather.humidity !== undefined && <span>湿度 {weather.humidity}%</span>}
              {weather.windSpeed && <span>{weather.windSpeed}</span>}
            </div>
          )}

          <div className="weather-hourly-title">未来 12 小时</div>
          {hourlyLoading && !hourly && (
            <div className="weather-hourly-loading">加载中…</div>
          )}
          {hourly && (
            <div className="weather-hourly">
              {hourly.map((h) => {
                const date = new Date(h.utcIso);
                const hr = date.getHours();
                const iconName = resolveIconName(h.description, hr);
                const timeLabel = `${String(hr).padStart(2, '0')}:00`;
                return (
                  <div key={h.utcIso} className="weather-hourly-item">
                    <div className="weather-hourly-time">{timeLabel}</div>
                    <img
                      src={`/weather-icons/${iconName}.svg`}
                      alt={h.description}
                      className="weather-hourly-icon"
                    />
                    <div className="weather-hourly-temp">{h.temp}°</div>
                    {h.precipitation > 0 && (
                      <div className="weather-hourly-precip">{h.precipitation.toFixed(1)}mm</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
