import { NextRequest, NextResponse } from 'next/server';

// In-memory cache: key = "lat,lon" (rounded to 1 decimal), value = { data, timestamp }
const cache = new Map<string, { data: WeatherData; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Track daily HeFeng usage to know when to fallback
let hefengDailyCount = 0;
let hefengCountResetDate = new Date().toDateString();
const HEFENG_DAILY_LIMIT = 950; // Leave some margin before 1000

interface WeatherData {
  temp: number;
  icon: string;
  description: string;
  city: string;
  feelsLike?: number;
  humidity?: number;
  windSpeed?: string;
  source: 'hefeng' | 'gfs';
}

function getCacheKey(lat: number, lon: number): string {
  return `${lat.toFixed(1)},${lon.toFixed(1)}`;
}

// Map GFS phenomenon to a simple weather icon code (HeFeng-compatible)
function phenomenonToIcon(phenomenon: string): string {
  const lower = phenomenon.toLowerCase();
  if (lower.includes('clear') || lower.includes('晴')) return '100';
  if (lower.includes('cloud') || lower.includes('多云')) return '101';
  if (lower.includes('overcast') || lower.includes('阴')) return '104';
  if (lower.includes('rain') || lower.includes('雨')) return '305';
  if (lower.includes('snow') || lower.includes('雪')) return '400';
  if (lower.includes('fog') || lower.includes('雾')) return '501';
  return '999'; // unknown
}

async function fetchFromHeFeng(lat: number, lon: number): Promise<WeatherData | null> {
  const apiKey = process.env.HEFENG_API_KEY;
  if (!apiKey) return null;

  // Check daily limit
  const today = new Date().toDateString();
  if (today !== hefengCountResetDate) {
    hefengDailyCount = 0;
    hefengCountResetDate = today;
  }
  if (hefengDailyCount >= HEFENG_DAILY_LIMIT) {
    return null; // Trigger fallback
  }

  try {
    const location = `${lon.toFixed(2)},${lat.toFixed(2)}`;
    const url = `https://devapi.qweather.com/v7/weather/now?location=${location}&key=${apiKey}&lang=zh`;

    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;

    const json = await response.json();
    if (json.code !== '200' || !json.now) return null;

    hefengDailyCount++;

    return {
      temp: parseInt(json.now.temp, 10),
      icon: json.now.icon,
      description: json.now.text,
      city: '',
      feelsLike: parseInt(json.now.feelsLike, 10),
      humidity: parseInt(json.now.humidity, 10),
      windSpeed: `${json.now.windDir} ${json.now.windScale}级`,
      source: 'hefeng',
    };
  } catch {
    return null;
  }
}

async function fetchFromGfsFallback(lat: number, lon: number): Promise<WeatherData | null> {
  const fallbackUrl = process.env.WEATHER_FALLBACK_URL || 'https://weather.spaceroute.cn/api/weather/current';

  try {
    const url = `${fallbackUrl}?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;

    const json = await response.json();
    if (!json.current) return null;

    const phenomenon = json.current.phenomenon || '';

    return {
      temp: Math.round(json.current.t2m),
      icon: phenomenonToIcon(phenomenon),
      description: phenomenon || '未知',
      city: '',
      feelsLike: json.current.feels_like ? Math.round(json.current.feels_like) : undefined,
      humidity: json.current.rh ? Math.round(json.current.rh) : undefined,
      windSpeed: json.current.wind_speed ? `${json.current.wind_speed.toFixed(1)} m/s` : undefined,
      source: 'gfs',
    };
  } catch {
    return null;
  }
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

    // Try HeFeng first, fallback to GFS
    let weatherData = await fetchFromHeFeng(lat, lon);
    if (!weatherData) {
      weatherData = await fetchFromGfsFallback(lat, lon);
    }

    if (!weatherData) {
      return NextResponse.json({ error: 'weather_fetch_failed' }, { status: 502 });
    }

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
