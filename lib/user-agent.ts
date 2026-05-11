export type UserAgentPlatform = 'mobile' | 'windows' | 'macos' | 'linux' | 'unknown'

export function detectUserAgentPlatform(userAgent: string): UserAgentPlatform {
  const ua = String(userAgent ?? '').toLowerCase()
  if (!ua) return 'unknown'

  if (
    /android|iphone|ipad|ipod|mobile|windows phone|blackberry|iemobile|opera mini/.test(ua)
  ) {
    return 'mobile'
  }
  if (/windows|win32|win64/.test(ua)) return 'windows'
  if (/macintosh|mac os x|darwin/.test(ua)) return 'macos'
  if (/linux|x11|wayland/.test(ua)) return 'linux'
  return 'unknown'
}

export function detectBrowserUserAgentPlatform(): UserAgentPlatform {
  if (typeof navigator === 'undefined') return 'unknown'
  return detectUserAgentPlatform(navigator.userAgent)
}
