/**
 * Footer ICP / public-security (备案) info.
 *
 * Stored as one JSON column (`footer_beian`). Defaults are empty so the shared
 * template never ships a specific site's filing numbers; the footer renders an
 * item only when its text is non-empty. Links are derived from the text:
 *   - ICP        -> https://beian.miit.gov.cn/
 *   - 公安备案    -> https://beian.mps.gov.cn/#/query/webSearch?code=<digits>
 */

export type FooterBeianFields = {
  /** e.g. 粤ICP备2025507839号-1 (empty = hidden) */
  icpText: string
  /** e.g. 粤公网安备44060602003083号 (empty = hidden) */
  publicSecurityText: string
}

export const FOOTER_BEIAN_DEFAULTS: FooterBeianFields = {
  icpText: '',
  publicSecurityText: '',
}

export const ICP_BEIAN_URL = 'https://beian.miit.gov.cn/'

const MAX_LEN = 80

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

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, MAX_LEN) : ''
}

export function parseFooterBeian(raw: unknown): FooterBeianFields {
  const o = parseRaw(raw)
  if (!o) return { ...FOOTER_BEIAN_DEFAULTS }
  return {
    icpText: str(o.icpText),
    publicSecurityText: str(o.publicSecurityText),
  }
}

/** Build the MPS public-security query URL from the digits in the filing text. */
export function publicSecurityBeianUrl(text: string): string {
  const code = String(text ?? '').replace(/\D/g, '')
  return code
    ? `https://beian.mps.gov.cn/#/query/webSearch?code=${code}`
    : 'https://beian.mps.gov.cn/'
}
