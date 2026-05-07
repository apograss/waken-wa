export type StatusCardVariant = 'classic' | 'aurora' | 'cover' | 'signature'

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function getTrimmedText(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''
}

function normalizeHexColor(value: unknown): string | null {
  const raw = typeof value === 'string' ? value.trim() : ''
  const short = /^#([0-9a-f]{3})$/i.exec(raw)
  if (short?.[1]) {
    return `#${short[1]
      .split('')
      .map((char) => `${char}${char}`)
      .join('')}`.toUpperCase()
  }
  if (/^#[0-9a-f]{6}$/i.test(raw)) return raw.toUpperCase()
  return null
}

export function normalizeStatusCardVariant(value: unknown): StatusCardVariant {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (normalized === 'signature') return 'signature'
  if (normalized === 'cover') return 'cover'
  return normalized === 'classic' ? 'classic' : 'aurora'
}

export function normalizeStatusCardCoverKey(value: unknown): string | null {
  const normalized = getTrimmedText(value).slice(0, 96)
  return /^[0-9a-f-]{16,64}$/i.test(normalized) ? normalized : null
}

export function normalizeStatusCardHexColor(value: unknown, fallback: string): string {
  return normalizeHexColor(value) ?? fallback
}

export function normalizeStatusCardDimension(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) return fallback
  return clampNumber(Math.round(numberValue), min, max)
}

export function normalizeStatusCardCoverRev(value: unknown): string {
  return getTrimmedText(value).slice(0, 64).replace(/[^0-9a-z-]/gi, '')
}

export function normalizeStatusCardTag(value: unknown): string {
  const normalized = getTrimmedText(value).slice(0, 32)
  if (!normalized) return ''
  return normalized.startsWith('#') ? normalized : `#${normalized}`
}
