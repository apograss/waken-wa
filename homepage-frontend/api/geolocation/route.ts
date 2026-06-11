import { NextRequest, NextResponse } from 'next/server';

const IPINFO_API_KEY = 'a3b3be25941f14415ba93648ea46308cd5f9d6d7c256dc4753a351eaf8cc9b0e';
const IPINFO_BASE_URL = 'https://ipinfo.dkly.net/api/';

function isPublicIp(ip: string): boolean {
  if (!ip) return false;
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('fe80:') || ip.startsWith('fc') || ip.startsWith('fd')) {
    return false;
  }
  const v4 = ip.match(/^(\d+)\.(\d+)\.\d+\.\d+$/);
  if (v4) {
    const a = Number(v4[1]);
    const b = Number(v4[2]);
    if (a === 10 || a === 127 || a === 0) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && b === 168) return false;
    if (a === 169 && b === 254) return false;
    if (a === 100 && b >= 64 && b <= 127) return false; // CGNAT / Tailscale
  }
  return true;
}

function getVisitorIp(request: NextRequest): string | null {
  // 反代（OpenResty $proxy_add_x_forwarded_for）会把直连客户端追加到 XFF 末尾，
  // 所以从右往左取第一个公网 IP 最可信；最左值可被访客自带的头伪造。
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const chain = forwarded.split(',').map((item) => item.trim()).filter(Boolean);
    for (let i = chain.length - 1; i >= 0; i -= 1) {
      if (isPublicIp(chain[i])) return chain[i];
    }
  }
  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp && isPublicIp(realIp)) return realIp;
  return process.env.DEV_FALLBACK_IP || null;
}

export async function GET(request: NextRequest) {
  try {
    const ip = getVisitorIp(request);
    if (!ip) {
      return NextResponse.json({ error: 'geolocation_failed' }, { status: 502 });
    }

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

    const city = location.city || location.region?.name || 'Unknown';

    return NextResponse.json({ city, lat, lon });
  } catch {
    return NextResponse.json({ error: 'geolocation_failed' }, { status: 500 });
  }
}
