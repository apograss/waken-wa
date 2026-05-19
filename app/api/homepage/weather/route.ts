import { NextRequest, NextResponse } from 'next/server';

// In-memory cache: key = "lat,lon" (rounded to 1 decimal), value = { data, timestamp }
const cache = new Map<string, { data: WeatherData; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

interface WeatherData {
  temp: number;
  icon: string;
  description: string;
  city: string;
}

function getCacheKey(lat: number, lon: number): string {
  return `${lat.toFixed(1)},${lon.toFixed(1)}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '');
    const lon = parseFloat(searchParams.get('lon') || '');

    if (isNaN(lat) || isNaN(lon)) {
      return NextResponse.json({ error: 'invalid_params' }, { status: 400 });
    }

    // Check cache
    const cacheKey = getCacheKey(lat, lon);
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cached.data);
    }

    // Call HeFeng Weather API
    const apiKey = process.env.HEFENG_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'weather_not_configured' }, { status: 500 });
    }

    const location = `${lon.toFixed(2)},${lat.toFixed(2)}`;
    const url = `https://devapi.qweather.com/v7/weather/now?location=${location}&key=${apiKey}&lang=zh`;

    const response = await fetch(url);
    if (!response.ok) {
      return NextResponse.json({ error: 'weather_fetch_failed' }, { status: 502 });
    }

    const json = await response.json();

    if (json.code !== '200' || !json.now) {
      return NextResponse.json({ error: 'weather_fetch_failed' }, { status: 502 });
    }

    const weatherData: WeatherData = {
      temp: parseInt(json.now.temp, 10),
      icon: json.now.icon,
      description: json.now.text,
      city: '', // City comes from geolocation, not weather API
    };

    // Store in cache
    cache.set(cacheKey, { data: weatherData, timestamp: Date.now() });

    // Clean old entries periodically
    if (cache.size > 100) {
      const now = Date.now();
      for (const [key, value] of cache) {
        if (now - value.timestamp > CACHE_TTL_MS) {
          cache.delete(key);
        }
      }
    }

    return NextResponse.json(weatherData);
  } catch {
    return NextResponse.json({ error: 'weather_fetch_failed' }, { status: 500 });
  }
}
