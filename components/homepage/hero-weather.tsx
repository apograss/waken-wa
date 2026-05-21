'use client';

import { useEffect, useState } from 'react';

interface WeatherData {
  temp: number;
  description: string;
  city: string;
  feelsLike?: number;
  humidity?: number;
  windSpeed?: string;
  iconName: string;
}

// Map HeFeng/GFS icon code or description to ColorfulClouds icon name
function resolveIconName(description: string, hour: number): string {
  const desc = (description || '').toLowerCase();
  const isNight = hour < 6 || hour >= 19;

  if (desc.includes('storm') || desc.includes('雷')) return 'STORM_RAIN';
  if (desc.includes('暴雨') || desc.includes('heavy rain')) return 'HEAVY_RAIN';
  if (desc.includes('中雨') || desc.includes('moderate rain')) return 'MODERATE_RAIN';
  if (desc.includes('小雨') || desc.includes('light rain') || desc.includes('rain') || desc.includes('雨')) return 'LIGHT_RAIN';

  if (desc.includes('暴雪') || desc.includes('heavy snow')) return 'HEAVY_SNOW';
  if (desc.includes('中雪')) return 'MODERATE_SNOW';
  if (desc.includes('snow') || desc.includes('雪')) return 'LIGHT_SNOW';

  if (desc.includes('雾') || desc.includes('fog')) return 'FOG';
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
  const [expanded, setExpanded] = useState(false);

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
        });
      } catch { /* silent */ }
    }
    load();
  }, []);

  if (!weather) {
    return (
      <div className="weather-card weather-card-loading">
        <span>--°</span>
      </div>
    );
  }

  return (
    <div
      className={`weather-card ${expanded ? 'weather-card-expanded' : ''}`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <img
        src={`/weather-icons/${weather.iconName}.svg`}
        alt={weather.description}
        className="weather-icon"
      />
      <span className="weather-temp">{weather.temp}°</span>

      {expanded && (
        <div className="weather-detail">
          <div className="weather-detail-row">
            <span className="weather-detail-city">{weather.city}</span>
            <span className="weather-detail-desc">{weather.description}</span>
          </div>
          {(weather.feelsLike !== undefined || weather.humidity !== undefined) && (
            <div className="weather-detail-row weather-detail-meta">
              {weather.feelsLike !== undefined && (
                <span>体感 {weather.feelsLike}°</span>
              )}
              {weather.humidity !== undefined && (
                <span>湿度 {weather.humidity}%</span>
              )}
              {weather.windSpeed && (
                <span>{weather.windSpeed}</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
