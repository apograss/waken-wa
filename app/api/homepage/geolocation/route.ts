import { NextRequest, NextResponse } from 'next/server';

const IPINFO_API_KEY = 'a3b3be25941f14415ba93648ea46308cd5f9d6d7c256dc4753a351eaf8cc9b0e';
const IPINFO_BASE_URL = 'https://ipinfo.dkly.net/api/';

function getVisitorIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const ip = forwarded.split(',')[0].trim();
    if (ip && ip !== '127.0.0.1' && ip !== '::1') return ip;
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp && realIp !== '127.0.0.1' && realIp !== '::1') {
    return realIp.trim();
  }
  return process.env.DEV_FALLBACK_IP || '27.45.145.145';
}

// Use OpenStreetMap Nominatim to get Chinese city name from coordinates
async function getChineseCityName(lat: number, lon: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=zh&zoom=10`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'apograss-homepage/1.0' },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return '';
    const data = await res.json();
    const addr = data.address || {};
    // Try city > district > county > state
    return addr.city || addr.district || addr.county || addr.state || '';
  } catch {
    return '';
  }
}

export async function GET(request: NextRequest) {
  try {
    const ip = getVisitorIp(request);

    const url = `${IPINFO_BASE_URL}?key=${IPINFO_API_KEY}&ip=${ip}`;
    const response = await fetch(url, { next: { revalidate: 600 } });

    if (!response.ok) {
      return NextResponse.json({ error: 'geolocation_failed' }, { status: 502 });
    }

    const data = await response.json();

    const location = data.location || {};
    const lat = parseFloat(location.latitude || '0');
    const lon = parseFloat(location.longitude || '0');

    if (!lat && !lon) {
      return NextResponse.json({ error: 'geolocation_failed' }, { status: 502 });
    }

    // Get Chinese city name (fallback to ipinfo's English name)
    const chineseCity = await getChineseCityName(lat, lon);
    const city = chineseCity || location.city || location.region?.name || '未知';

    return NextResponse.json({ city, lat, lon });
  } catch {
    return NextResponse.json({ error: 'geolocation_failed' }, { status: 500 });
  }
}
