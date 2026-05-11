import 'server-only'

import { readFile } from 'node:fs/promises'
import path from 'node:path'

import {
  STATUS_CARD_AVATAR_FETCH_TIMEOUT_MS,
  STATUS_CARD_AVATAR_MAX_BYTES,
  STATUS_CARD_DEFAULT_HEADER_HEIGHT,
  STATUS_CARD_DEFAULT_RADIUS,
  STATUS_CARD_DEFAULT_STATUS_HEIGHT,
  STATUS_CARD_DEFAULT_WIDTH,
  STATUS_CARD_HITOKOTO_FETCH_TIMEOUT_MS,
  STATUS_CARD_SIGNATURE_HEIGHT,
  STATUS_CARD_SIGNATURE_WIDTH,
} from '@/constants/status-card'
import { isRemoteAvatarUrl } from '@/lib/avatar-url'
import {
  buildHitokotoRequestUrl,
  normalizeHitokotoCategories,
  normalizeHitokotoEncode,
} from '@/lib/hitokoto'
import {
  extractImageSourcePublicKey,
  readImageSourceDataUrl,
} from '@/lib/image-source-store'
import { decodeInlineImageDataUrl } from '@/lib/inline-image-data'
import { normalizeProfileOnlineAccentColor } from '@/lib/profile-online-accent-color'
import {
  getSteamGameName,
} from '@/lib/status-card-activity'
import {
  normalizeStatusCardCoverKey,
  normalizeStatusCardCoverRev,
  normalizeStatusCardDimension,
  normalizeStatusCardHexColor,
  normalizeStatusCardRawHexColor,
  normalizeStatusCardTag,
  normalizeStatusCardVariant,
} from '@/lib/status-card-options'
import { getTrimmedText } from '@/lib/status-card-text'
import type { ActivityFeedData, ActivityFeedItem } from '@/types/activity'
import type {
  StatusCardOptions,
  StatusCardProfile,
  StatusCardVariant,
} from '@/types/status-card'

function getHitokotoTextFromJson(value: unknown): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return ''
  const record = value as Record<string, unknown>
  const text = getTrimmedText(record.hitokoto)
  if (!text) return ''
  const from = getTrimmedText(record.from)
  return from ? `${text} —— ${from}` : text
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function parseIntegerParam(
  searchParams: URLSearchParams,
  key: string,
  fallback: number,
  min: number,
  max: number,
): number {
  const raw = searchParams.get(key)
  if (raw == null || raw.trim() === '') return fallback
  const value = Number(raw)
  if (!Number.isFinite(value)) return fallback
  return clampNumber(Math.round(value), min, max)
}

function parseIntegerParamWithAuto(
  searchParams: URLSearchParams,
  key: string,
  fallback: number,
  min: number,
  max: number,
): { value: number; auto: boolean } {
  const raw = searchParams.get(key)
  if (raw == null || raw.trim() === '') {
    return { value: fallback, auto: false }
  }
  if (raw.trim().toLowerCase() === 'auto') {
    return { value: fallback, auto: true }
  }
  return { value: parseIntegerParam(searchParams, key, fallback, min, max), auto: false }
}

function parseBooleanParam(
  searchParams: URLSearchParams,
  key: string,
  fallback: boolean,
): boolean {
  const raw = searchParams.get(key)
  if (raw == null) return fallback
  const value = raw.trim().toLowerCase()
  if (['1', 'true', 'yes', 'on'].includes(value)) return true
  if (['0', 'false', 'no', 'off'].includes(value)) return false
  return fallback
}

function getConfiguredBoolean(config: Record<string, unknown> | null | undefined, key: string, fallback: boolean): boolean {
  return typeof config?.[key] === 'boolean' ? config[key] === true : fallback
}

function getConfiguredColor(config: Record<string, unknown> | null | undefined, key: string, fallback: string): string {
  return normalizeStatusCardHexColor(config?.[key], fallback)
}

function getConfiguredNumber(
  config: Record<string, unknown> | null | undefined,
  key: string,
  fallback: number,
  min: number,
  max: number,
): number {
  const normalized = normalizeStatusCardDimension(config?.[key], fallback, min, max)
  return normalized === 'auto' ? fallback : normalized
}

function isConfiguredAuto(
  config: Record<string, unknown> | null | undefined,
  key: string,
): boolean {
  return typeof config?.[key] === 'string' && config[key].trim().toLowerCase() === 'auto'
}

function getDefaultStatusCardVariant(config?: Record<string, unknown> | null): StatusCardVariant {
  if (typeof config?.statusCardVariant === 'string') {
    return normalizeStatusCardVariant(config.statusCardVariant)
  }
  return 'classic'
}

function parseStatusCardVariantParam(searchParams: URLSearchParams, config?: Record<string, unknown> | null): StatusCardVariant {
  const raw = searchParams.get('variant')
  if (raw == null) return getDefaultStatusCardVariant(config)
  const value = raw.trim().toLowerCase()

  switch (value) {
    case 'signature':
      return 'signature'
    case 'cover':
      return 'cover'
    case 'aurora':
      return 'aurora'
    default:
      return 'classic'
  }
}

function parseColorParam(
  searchParams: URLSearchParams,
  key: string,
  fallback: string,
): string {
  return normalizeStatusCardRawHexColor(searchParams.get(key)) ?? fallback
}

function mimeFromPathname(pathname: string): string | null {
  const ext = path.extname(pathname).toLowerCase()

  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.png':
      return 'image/png'
    case '.gif':
      return 'image/gif'
    case '.webp':
      return 'image/webp'
    case '.avif':
      return 'image/avif'
    case '.svg':
      return 'image/svg+xml'
    default:
      return null
  }
}

function dataUriFromBuffer(mimeType: string, buffer: Uint8Array): string | null {
  if (!mimeType.toLowerCase().startsWith('image/')) return null
  if (buffer.byteLength <= 0 || buffer.byteLength > STATUS_CARD_AVATAR_MAX_BYTES) return null
  return `data:${mimeType};base64,${Buffer.from(buffer).toString('base64')}`
}

function normalizeImageDataUri(rawUrl: string): string | null {
  const decoded = decodeInlineImageDataUrl(rawUrl)
  if (!decoded) return null
  return dataUriFromBuffer(decoded.contentType, decoded.buffer)
}

async function fetchRemoteImageAsDataUri(rawUrl: string): Promise<string | null> {
  try {
    const response = await fetch(rawUrl, {
      cache: 'no-store',
      redirect: 'follow',
      signal: AbortSignal.timeout(STATUS_CARD_AVATAR_FETCH_TIMEOUT_MS),
      headers: {
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (compatible; WakenStatusCard/1.0)',
      },
    })
    if (!response.ok) return null
    const contentType = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()
    if (!contentType?.startsWith('image/')) return null
    const contentLength = Number(response.headers.get('content-length') ?? '')
    if (Number.isFinite(contentLength) && contentLength > STATUS_CARD_AVATAR_MAX_BYTES) return null
    const buffer = new Uint8Array(await response.arrayBuffer())
    return dataUriFromBuffer(contentType, buffer)
  } catch {
    return null
  }
}

async function readPublicImageAsDataUri(rawUrl: string): Promise<string | null> {
  const pathname = rawUrl.split(/[?#]/, 1)[0] ?? ''
  if (!pathname.startsWith('/') || pathname.startsWith('//')) return null
  if (pathname.startsWith('/api/')) return null
  if (pathname.split('/').some((part) => part === '..')) return null
  const normalized = path.posix.normalize(pathname)
  const mimeType = mimeFromPathname(normalized)
  if (!mimeType) return null

  try {
    const filePath = path.join(process.cwd(), 'public', normalized.slice(1))
    const buffer = await readFile(filePath)
    return dataUriFromBuffer(mimeType, buffer)
  } catch {
    return null
  }
}

export function parseStatusCardOptions(
  searchParams: URLSearchParams,
  config?: Record<string, unknown> | null,
): StatusCardOptions {
  const variant = parseStatusCardVariantParam(searchParams, config)
  const showHeader = parseBooleanParam(
    searchParams,
    'showHeader',
    getConfiguredBoolean(config, 'statusCardShowHeader', false),
  )
  const defaultAccent =
    normalizeStatusCardRawHexColor(searchParams.get('accent')) ??
    normalizeStatusCardRawHexColor(config?.statusCardAccent) ??
    normalizeProfileOnlineAccentColor(config?.profileOnlineAccentColor) ??
    '#22C55E'
  const defaultHeight = showHeader
    ? getConfiguredNumber(config, 'statusCardHeight', STATUS_CARD_DEFAULT_HEADER_HEIGHT, 1, 720)
    : STATUS_CARD_DEFAULT_STATUS_HEIGHT
  const defaultWidth = variant === 'signature'
    ? STATUS_CARD_SIGNATURE_WIDTH
    : getConfiguredNumber(config, 'statusCardWidth', STATUS_CARD_DEFAULT_WIDTH, 280, 1200)
  const fallbackHeight = variant === 'signature' ? STATUS_CARD_SIGNATURE_HEIGHT : defaultHeight
  const widthResult = parseIntegerParamWithAuto(searchParams, 'width', defaultWidth, 280, 1200)
  const heightResult = parseIntegerParamWithAuto(searchParams, 'height', fallbackHeight, 1, 720)
  const widthAuto =
    widthResult.auto ||
    (searchParams.get('width') == null && isConfiguredAuto(config, 'statusCardWidth'))
  const heightAuto =
    heightResult.auto ||
    (searchParams.get('height') == null && isConfiguredAuto(config, 'statusCardHeight'))
  const deviceIdRaw = searchParams.get('deviceId')
  const deviceId = deviceIdRaw == null || deviceIdRaw.trim() === ''
    ? null
    : Number(deviceIdRaw)

  return {
    variant,
    width: widthResult.value,
    widthAuto,
    height: heightResult.value,
    heightAuto,
    radius: parseIntegerParam(
      searchParams,
      'radius',
      getConfiguredNumber(config, 'statusCardRadius', STATUS_CARD_DEFAULT_RADIUS, 0, 80),
      0,
      80,
    ),
    bg: parseColorParam(searchParams, 'bg', getConfiguredColor(config, 'statusCardBg', '#FFFFFF')),
    signatureBg: parseColorParam(
      searchParams,
      'signatureBg',
      getConfiguredColor(config, 'statusCardSignatureBg', '#F4F0FF'),
    ),
    fg: parseColorParam(searchParams, 'fg', getConfiguredColor(config, 'statusCardFg', '#111827')),
    muted: parseColorParam(searchParams, 'muted', getConfiguredColor(config, 'statusCardMuted', '#6B7280')),
    accent: parseColorParam(searchParams, 'accent', defaultAccent),
    border: parseColorParam(searchParams, 'border', getConfiguredColor(config, 'statusCardBorder', '#E5E7EB')),
    showHeader,
    showAvatar: showHeader && parseBooleanParam(searchParams, 'showAvatar', getConfiguredBoolean(config, 'statusCardShowAvatar', true)),
    showName: showHeader && parseBooleanParam(searchParams, 'showName', getConfiguredBoolean(config, 'statusCardShowName', true)),
    showBio: showHeader && parseBooleanParam(searchParams, 'showBio', getConfiguredBoolean(config, 'statusCardShowBio', true)),
    showNote: showHeader && parseBooleanParam(searchParams, 'showNote', getConfiguredBoolean(config, 'statusCardShowNote', false)),
    preferGame: parseBooleanParam(searchParams, 'preferGame', getConfiguredBoolean(config, 'statusCardPreferGame', false)),
    showInClassStatus: parseBooleanParam(searchParams, 'showInClassStatus', getConfiguredBoolean(config, 'statusCardShowInClassStatus', false)),
    tag: normalizeStatusCardTag(searchParams.get('tag') ?? config?.statusCardTag),
    coverKey: normalizeStatusCardCoverKey(searchParams.get('cover')) ?? normalizeStatusCardCoverKey(config?.statusCardCoverKey),
    backgroundKey: normalizeStatusCardCoverKey(searchParams.get('bgImage')) ?? normalizeStatusCardCoverKey(config?.statusCardBackgroundKey),
    deviceId: Number.isFinite(deviceId) && Number(deviceId) > 0 ? Math.round(Number(deviceId)) : null,
    deviceKey: getTrimmedText(searchParams.get('deviceKey')).slice(0, 256) || null,
  }
}

export function getStatusCardProfile(config?: Record<string, unknown> | null): StatusCardProfile {
  return {
    name: getTrimmedText(config?.userName, 'Waken'),
    bio: getTrimmedText(config?.userBio),
    note: getTrimmedText(config?.userNote),
    avatarUrl: getTrimmedText(config?.avatarUrl),
    currentlyText: getTrimmedText(config?.currentlyText, '当前状态'),
  }
}

export async function resolveStatusCardProfileNote(
  config: Record<string, unknown> | null | undefined,
): Promise<string> {
  const fallbackNote = getTrimmedText(config?.userNote)
  if (config?.userNoteHitokotoEnabled !== true) return fallbackNote

  try {
    const categories = normalizeHitokotoCategories(config?.userNoteHitokotoCategories)
    const encode = normalizeHitokotoEncode(config?.userNoteHitokotoEncode)
    const response = await fetch(buildHitokotoRequestUrl(categories, encode), {
      cache: 'no-store',
      signal: AbortSignal.timeout(STATUS_CARD_HITOKOTO_FETCH_TIMEOUT_MS),
      headers: {
        Accept: encode === 'text' ? 'text/plain,*/*;q=0.8' : 'application/json,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (compatible; WakenStatusCard/1.0)',
      },
    })
    if (!response.ok) throw new Error(`Hitokoto HTTP ${response.status}`)
    const note = encode === 'text'
      ? getTrimmedText(await response.text())
      : getHitokotoTextFromJson(await response.json())
    if (note) return note
  } catch (error) {
    console.warn('[status-card] hitokoto fetch failed:', error)
  }

  return config?.userNoteHitokotoFallbackToNote === true ? fallbackNote : ''
}

export function selectStatusCardActivity(
  feed: ActivityFeedData,
  options: StatusCardOptions,
): ActivityFeedItem | null {
  const statuses = feed.activeStatuses ?? []
  if (options.deviceId !== null) {
    return statuses.find((item) => Number(item.deviceId) === options.deviceId) ?? null
  }
  if (options.deviceKey) {
    return statuses.find((item) => item.generatedHashKey === options.deviceKey) ?? null
  }
  if (options.preferGame) {
    const gameActivity = statuses.find((item) => getSteamGameName(item))
    if (gameActivity) return gameActivity
  }
  return statuses[0] ?? null
}

export async function resolveStatusCardAvatarDataUri(
  profile: StatusCardProfile,
): Promise<string | null> {
  const rawUrl = profile.avatarUrl
  if (!rawUrl) return null

  if (/^data:image\//i.test(rawUrl)) {
    return normalizeImageDataUri(rawUrl)
  }

  const imageSourceKey = extractImageSourcePublicKey(rawUrl)
  if (imageSourceKey) {
    const dataUrl = await readImageSourceDataUrl(imageSourceKey)
    return dataUrl ? normalizeImageDataUri(dataUrl) : null
  }

  if (isRemoteAvatarUrl(rawUrl)) {
    return fetchRemoteImageAsDataUri(rawUrl)
  }

  return readPublicImageAsDataUri(rawUrl)
}

export async function resolveStatusCardCoverDataUri(
  coverKey: string | null | undefined,
): Promise<string | null> {
  const normalized = normalizeStatusCardCoverKey(coverKey)
  if (!normalized) return null
  const dataUrl = await readImageSourceDataUrl(normalized)
  return dataUrl ? normalizeImageDataUri(dataUrl) : null
}

export async function resolveStatusCardBackgroundDataUri(
  backgroundKey: string | null | undefined,
): Promise<string | null> {
  return resolveStatusCardCoverDataUri(backgroundKey)
}
