import { parseIntegerInRangeForWrite } from '@/lib/site-config-constants'

export type StatusCardVariant = 'classic' | 'aurora' | 'cover' | 'signature'

export type StatusCardSettings = {
  statusCardEnabled: boolean
  statusCardVariant: StatusCardVariant
  statusCardTag: string
  statusCardBackgroundKey: string
  statusCardBackgroundRev: string
  statusCardCoverKey: string
  statusCardCoverRev: string
  statusCardShowHeader: boolean
  statusCardShowAvatar: boolean
  statusCardShowName: boolean
  statusCardShowBio: boolean
  statusCardShowNote: boolean
  statusCardPreferGame: boolean
  statusCardShowInClassStatus: boolean
  statusCardWidth: number
  statusCardHeight: number
  statusCardRadius: number
  statusCardBg: string
  statusCardSignatureBg: string
  statusCardFg: string
  statusCardMuted: string
  statusCardAccent: string
  statusCardBorder: string
}

const STATUS_CARD_DEFAULTS: StatusCardSettings = {
  statusCardEnabled: false,
  statusCardVariant: 'aurora',
  statusCardTag: '',
  statusCardBackgroundKey: '',
  statusCardBackgroundRev: '',
  statusCardCoverKey: '',
  statusCardCoverRev: '',
  statusCardShowHeader: true,
  statusCardShowAvatar: true,
  statusCardShowName: true,
  statusCardShowBio: true,
  statusCardShowNote: false,
  statusCardPreferGame: false,
  statusCardShowInClassStatus: false,
  statusCardWidth: 520,
  statusCardHeight: 310,
  statusCardRadius: 20,
  statusCardBg: '#FFFFFF',
  statusCardSignatureBg: '#F4F0FF',
  statusCardFg: '#111827',
  statusCardMuted: '#6B7280',
  statusCardAccent: '#22C55E',
  statusCardBorder: '#E5E7EB',
}

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

type StatusCardDimensionParser = (
  value: unknown,
  fallback: number,
  min: number,
  max: number,
  key: string,
) => number

function resolveStatusCardValue<T>(
  source: Record<string, unknown>,
  fallback: Partial<StatusCardSettings>,
  key: keyof StatusCardSettings,
  defaultValue: T,
): T {
  const value = source[key as string]
  if (value !== undefined && value !== null) return value as T
  const fallbackValue = fallback[key]
  if (fallbackValue !== undefined && fallbackValue !== null) return fallbackValue as T
  return defaultValue
}

export function normalizeStatusCardSettings(
  source: Record<string, unknown>,
  fallback: Partial<StatusCardSettings> = {},
  options?: {
    parseDimension?: StatusCardDimensionParser
  },
): StatusCardSettings {
  const parseDimension = options?.parseDimension ?? normalizeStatusCardDimension
  return {
    statusCardEnabled: Boolean(
      resolveStatusCardValue(source, fallback, 'statusCardEnabled', STATUS_CARD_DEFAULTS.statusCardEnabled),
    ),
    statusCardVariant: normalizeStatusCardVariant(
      resolveStatusCardValue(source, fallback, 'statusCardVariant', STATUS_CARD_DEFAULTS.statusCardVariant),
    ),
    statusCardTag: normalizeStatusCardTag(
      resolveStatusCardValue(source, fallback, 'statusCardTag', STATUS_CARD_DEFAULTS.statusCardTag),
    ),
    statusCardBackgroundKey:
      normalizeStatusCardCoverKey(
        resolveStatusCardValue(
          source,
          fallback,
          'statusCardBackgroundKey',
          STATUS_CARD_DEFAULTS.statusCardBackgroundKey,
        ),
      ) ?? '',
    statusCardBackgroundRev: normalizeStatusCardCoverRev(
      resolveStatusCardValue(
        source,
        fallback,
        'statusCardBackgroundRev',
        STATUS_CARD_DEFAULTS.statusCardBackgroundRev,
      ),
    ),
    statusCardCoverKey:
      normalizeStatusCardCoverKey(
        resolveStatusCardValue(source, fallback, 'statusCardCoverKey', STATUS_CARD_DEFAULTS.statusCardCoverKey),
      ) ?? '',
    statusCardCoverRev: normalizeStatusCardCoverRev(
      resolveStatusCardValue(source, fallback, 'statusCardCoverRev', STATUS_CARD_DEFAULTS.statusCardCoverRev),
    ),
    statusCardShowHeader: Boolean(
      resolveStatusCardValue(
        source,
        fallback,
        'statusCardShowHeader',
        STATUS_CARD_DEFAULTS.statusCardShowHeader,
      ),
    ),
    statusCardShowAvatar: Boolean(
      resolveStatusCardValue(
        source,
        fallback,
        'statusCardShowAvatar',
        STATUS_CARD_DEFAULTS.statusCardShowAvatar,
      ),
    ),
    statusCardShowName: Boolean(
      resolveStatusCardValue(
        source,
        fallback,
        'statusCardShowName',
        STATUS_CARD_DEFAULTS.statusCardShowName,
      ),
    ),
    statusCardShowBio: Boolean(
      resolveStatusCardValue(
        source,
        fallback,
        'statusCardShowBio',
        STATUS_CARD_DEFAULTS.statusCardShowBio,
      ),
    ),
    statusCardShowNote: Boolean(
      resolveStatusCardValue(
        source,
        fallback,
        'statusCardShowNote',
        STATUS_CARD_DEFAULTS.statusCardShowNote,
      ),
    ),
    statusCardPreferGame: Boolean(
      resolveStatusCardValue(
        source,
        fallback,
        'statusCardPreferGame',
        STATUS_CARD_DEFAULTS.statusCardPreferGame,
      ),
    ),
    statusCardShowInClassStatus: Boolean(
      resolveStatusCardValue(
        source,
        fallback,
        'statusCardShowInClassStatus',
        STATUS_CARD_DEFAULTS.statusCardShowInClassStatus,
      ),
    ),
    statusCardWidth: parseDimension(
      resolveStatusCardValue(source, fallback, 'statusCardWidth', STATUS_CARD_DEFAULTS.statusCardWidth),
      fallback.statusCardWidth ?? STATUS_CARD_DEFAULTS.statusCardWidth,
      280,
      1200,
      'statusCardWidth',
    ),
    statusCardHeight: parseDimension(
      resolveStatusCardValue(source, fallback, 'statusCardHeight', STATUS_CARD_DEFAULTS.statusCardHeight),
      fallback.statusCardHeight ?? STATUS_CARD_DEFAULTS.statusCardHeight,
      1,
      720,
      'statusCardHeight',
    ),
    statusCardRadius: parseDimension(
      resolveStatusCardValue(source, fallback, 'statusCardRadius', STATUS_CARD_DEFAULTS.statusCardRadius),
      fallback.statusCardRadius ?? STATUS_CARD_DEFAULTS.statusCardRadius,
      0,
      80,
      'statusCardRadius',
    ),
    statusCardBg: normalizeStatusCardHexColor(
      resolveStatusCardValue(source, fallback, 'statusCardBg', STATUS_CARD_DEFAULTS.statusCardBg),
      STATUS_CARD_DEFAULTS.statusCardBg,
    ),
    statusCardSignatureBg: normalizeStatusCardHexColor(
      resolveStatusCardValue(
        source,
        fallback,
        'statusCardSignatureBg',
        STATUS_CARD_DEFAULTS.statusCardSignatureBg,
      ),
      STATUS_CARD_DEFAULTS.statusCardSignatureBg,
    ),
    statusCardFg: normalizeStatusCardHexColor(
      resolveStatusCardValue(source, fallback, 'statusCardFg', STATUS_CARD_DEFAULTS.statusCardFg),
      STATUS_CARD_DEFAULTS.statusCardFg,
    ),
    statusCardMuted: normalizeStatusCardHexColor(
      resolveStatusCardValue(source, fallback, 'statusCardMuted', STATUS_CARD_DEFAULTS.statusCardMuted),
      STATUS_CARD_DEFAULTS.statusCardMuted,
    ),
    statusCardAccent: normalizeStatusCardHexColor(
      resolveStatusCardValue(source, fallback, 'statusCardAccent', STATUS_CARD_DEFAULTS.statusCardAccent),
      STATUS_CARD_DEFAULTS.statusCardAccent,
    ),
    statusCardBorder: normalizeStatusCardHexColor(
      resolveStatusCardValue(source, fallback, 'statusCardBorder', STATUS_CARD_DEFAULTS.statusCardBorder),
      STATUS_CARD_DEFAULTS.statusCardBorder,
    ),
  }
}

export function parseStatusCardDimensionForWrite(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
  key: string,
): number {
  return parseIntegerInRangeForWrite(value, min, max, key) ?? fallback
}
