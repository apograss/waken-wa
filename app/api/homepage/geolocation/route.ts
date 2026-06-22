import { NextRequest, NextResponse } from 'next/server';

// 旧的第三方 IP 库，作为高德失败 / 海外 IP 的兜底。
const IPINFO_API_KEY = 'a3b3be25941f14415ba93648ea46308cd5f9d6d7c256dc4753a351eaf8cc9b0e';
const IPINFO_BASE_URL = 'https://ipinfo.dkly.net/api/';

interface GeoResult {
  city: string;
  lat: number;
  lon: number;
}

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
  // 站点位于「阿里云 ESA CDN → OpenResty → 应用」之后。
  // ESA 会把真实访客 IP 透传到 X-Forwarded-For，OpenResty 再把 ESA 节点 IP
  // 追加到末尾（$proxy_add_x_forwarded_for）。因此：
  //   XFF = "真实访客, ESA节点"
  // 真实访客 = 末位的前一个（ESA 判定的客户端，抗伪造也更稳）。
  // 否则会把 ESA 的深圳边缘节点当成访客，导致定位到深圳。
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const chain = forwarded.split(',').map((item) => item.trim()).filter(Boolean);
    if (chain.length >= 2 && isPublicIp(chain[chain.length - 2])) {
      return chain[chain.length - 2];
    }
    // 退化：直连 / 无 CDN 时取最左侧公网 IP
    for (const ip of chain) {
      if (isPublicIp(ip)) return ip;
    }
  }
  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp && isPublicIp(realIp)) return realIp;
  return process.env.DEV_FALLBACK_IP || null;
}

/** 高德 IP 定位：返回省市 + 矩形范围，取矩形中心点作为经纬度。仅对国内 IP 有效。 */
async function geocodeViaAmap(ip: string): Promise<GeoResult | null> {
  const key = process.env.AMAP_API_KEY;
  if (!key) return null;
  try {
    const url = `https://restapi.amap.com/v3/ip?key=${key}&ip=${encodeURIComponent(ip)}`;
    const response = await fetch(url, { next: { revalidate: 600 }, signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;
    const data = await response.json();
    if (data.status !== '1') return null;
    // 海外 / 无法定位时 rectangle 与 city 会是空数组
    const rectangle = typeof data.rectangle === 'string' ? data.rectangle.trim() : '';
    if (!rectangle) return null;
    const corners = rectangle
      .split(';')
      .map((pair: string) => pair.split(',').map((n) => parseFloat(n)));
    if (corners.length < 2 || corners.some((c: number[]) => c.length < 2 || c.some(Number.isNaN))) {
      return null;
    }
    const lon = (corners[0][0] + corners[1][0]) / 2;
    const lat = (corners[0][1] + corners[1][1]) / 2;
    if (!lat || !lon) return null;
    const city =
      (typeof data.city === 'string' && data.city.trim()) ||
      (typeof data.province === 'string' && data.province.trim()) ||
      'Unknown';
    return { city, lat, lon };
  } catch {
    return null;
  }
}

/** 兜底：第三方 IP 库（高德失败或海外 IP）。 */
async function geocodeViaIpinfo(ip: string): Promise<GeoResult | null> {
  try {
    const url = `${IPINFO_BASE_URL}?key=${IPINFO_API_KEY}&ip=${ip}`;
    const response = await fetch(url, { next: { revalidate: 600 } });
    if (!response.ok) return null;
    const data = await response.json();
    const location = data.location || {};
    const lat = parseFloat(location.latitude || '0');
    const lon = parseFloat(location.longitude || '0');
    if (!lat && !lon) return null;
    const city = location.city || location.region?.name || 'Unknown';
    return { city, lat, lon };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const ip = getVisitorIp(request);
    if (!ip) {
      return NextResponse.json({ error: 'geolocation_failed' }, { status: 502 });
    }

    let geo = await geocodeViaAmap(ip);
    if (!geo) {
      geo = await geocodeViaIpinfo(ip);
    }
    if (!geo) {
      return NextResponse.json({ error: 'geolocation_failed' }, { status: 502 });
    }

    return NextResponse.json(geo);
  } catch {
    return NextResponse.json({ error: 'geolocation_failed' }, { status: 500 });
  }
}
