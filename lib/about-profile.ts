/**
 * "关于我" (section 01) editable content.
 *
 * Stored as a single JSON column (`about_profile`) so the whole section threads
 * through the config pipeline as one field, mirroring `themeCustomSurface`.
 * The status pill reuses the existing today-status fields, so it has only a
 * toggle here (no duplicated status content).
 */

export type AboutProfileFields = {
  domain: string
  domainEnabled: boolean
  city: string
  cityEnabled: boolean
  email: string
  emailEnabled: boolean
  githubUrl: string
  githubLabel: string
  githubEnabled: boolean
  /** Show the today-status pill inside section 01 (content comes from today-status). */
  statusEnabled: boolean
  quoteEnabled: boolean
  quoteText: string
  quoteSource: string
  figureEnabled: boolean
  /** Uploaded image URL (empty = use the bundled companion illustration). */
  figureImage: string
  figureLabel: string
  figureCaption: string
}

export const ABOUT_PROFILE_DEFAULTS: AboutProfileFields = {
  domain: 'apograss.cn',
  domainEnabled: true,
  city: '深圳 · 福田',
  cityEnabled: true,
  email: '',
  emailEnabled: false,
  githubUrl: 'https://github.com/apograss',
  githubLabel: 'github.com/apograss',
  githubEnabled: true,
  statusEnabled: true,
  quoteEnabled: true,
  quoteText: '所谓自由，是能在下雨的星期天，一个人写完一段不被催促的字。',
  quoteSource: '— hitokoto · 子集',
  figureEnabled: true,
  figureImage: '',
  figureLabel: 'profile · 2026 spring',
  figureCaption: '2026 · 春',
}

const MAX_SHORT = 60
const MAX_LABEL = 80
const MAX_EMAIL = 120
const MAX_URL = 300
const MAX_QUOTE = 300
const MAX_CAPTION = 40
const MAX_IMAGE = 4096

function parseRaw(raw: unknown): Record<string, unknown> | null {
  let value: unknown = raw
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (!trimmed) return null
    try {
      value = JSON.parse(trimmed)
    } catch {
      return null
    }
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function str(value: unknown, fallback: string, maxLen: number): string {
  if (typeof value !== 'string') return fallback
  return value.trim().slice(0, maxLen)
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

/** Normalize stored/submitted About-profile data into a complete, safe object. */
export function parseAboutProfile(raw: unknown): AboutProfileFields {
  const o = parseRaw(raw)
  if (!o) return { ...ABOUT_PROFILE_DEFAULTS }

  return {
    domain: str(o.domain, ABOUT_PROFILE_DEFAULTS.domain, MAX_SHORT),
    domainEnabled: bool(o.domainEnabled, ABOUT_PROFILE_DEFAULTS.domainEnabled),
    city: str(o.city, ABOUT_PROFILE_DEFAULTS.city, MAX_SHORT),
    cityEnabled: bool(o.cityEnabled, ABOUT_PROFILE_DEFAULTS.cityEnabled),
    email: str(o.email, ABOUT_PROFILE_DEFAULTS.email, MAX_EMAIL),
    emailEnabled: bool(o.emailEnabled, ABOUT_PROFILE_DEFAULTS.emailEnabled),
    githubUrl: str(o.githubUrl, ABOUT_PROFILE_DEFAULTS.githubUrl, MAX_URL),
    githubLabel: str(o.githubLabel, ABOUT_PROFILE_DEFAULTS.githubLabel, MAX_LABEL),
    githubEnabled: bool(o.githubEnabled, ABOUT_PROFILE_DEFAULTS.githubEnabled),
    statusEnabled: bool(o.statusEnabled, ABOUT_PROFILE_DEFAULTS.statusEnabled),
    quoteEnabled: bool(o.quoteEnabled, ABOUT_PROFILE_DEFAULTS.quoteEnabled),
    quoteText: str(o.quoteText, ABOUT_PROFILE_DEFAULTS.quoteText, MAX_QUOTE),
    quoteSource: str(o.quoteSource, ABOUT_PROFILE_DEFAULTS.quoteSource, MAX_SHORT),
    figureEnabled: bool(o.figureEnabled, ABOUT_PROFILE_DEFAULTS.figureEnabled),
    figureImage: str(o.figureImage, ABOUT_PROFILE_DEFAULTS.figureImage, MAX_IMAGE),
    figureLabel: str(o.figureLabel, ABOUT_PROFILE_DEFAULTS.figureLabel, MAX_SHORT),
    figureCaption: str(o.figureCaption, ABOUT_PROFILE_DEFAULTS.figureCaption, MAX_CAPTION),
  }
}
