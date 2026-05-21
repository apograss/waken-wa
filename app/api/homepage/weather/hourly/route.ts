import { NextRequest, NextResponse } from 'next/server';

interface HourlyEntry {
  utcIso: string; // ISO UTC for client-side formatting
  temp: number;
  description: string;
  precipitation: number;
}

const cache = new Map<string, { data: HourlyEntry[]; timestamp: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

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

    const cacheKey = getCacheKey(lat, lon);
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({ hourly: cached.data });
    }

    const url = `https://weather.spaceroute.cn/api/weather/hourly?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) {
      return NextResponse.json({ error: 'hourly_fetch_failed' }, { status: 502 });
    }

    const json = await response.json();
    if (!Array.isArray(json.hourly)) {
      return NextResponse.json({ error: 'hourly_fetch_failed' }, { status: 502 });
    }

    // valid_time is in format "YYYY-MM-DD HH:MM" (UTC). Convert to ISO UTC.
    const hourly: HourlyEntry[] = json.hourly.slice(0, 12).map((entry: {
      valid_time: string;
      t2m: number;
      phenomenon: string;
      tp: number;
    }) => {
      const utc = new Date(entry.valid_time.replace(' ', 'T') + ':00Z');
      return {
        utcIso: utc.toISOString(),
        temp: Math.round(entry.t2m),
        description: entry.phenomenon || '',
        precipitation: entry.tp || 0,
      };
    });

    cache.set(cacheKey, { data: hourly, timestamp: Date.now() });

    return NextResponse.json({ hourly });
  } catch {
    return NextResponse.json({ error: 'hourly_fetch_failed' }, { status: 500 });
  }
}
