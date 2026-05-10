import 'server-only'

import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { getMediaDisplay } from '@/lib/activity-media'
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
import type { ScheduleOccurrence } from '@/lib/schedule-courses'
import {
  normalizeStatusCardCoverKey,
  normalizeStatusCardCoverRev,
  normalizeStatusCardDimension,
  normalizeStatusCardHexColor,
  normalizeStatusCardTag,
  normalizeStatusCardVariant,
  type StatusCardVariant,
} from '@/lib/status-card-options'
import type { ActivityFeedData, ActivityFeedItem } from '@/types/activity'

const DEFAULT_WIDTH = 520
const DEFAULT_STATUS_HEIGHT = 180
const DEFAULT_HEADER_HEIGHT = 310
const SIGNATURE_WIDTH = 700
const SIGNATURE_HEIGHT = 220
const DEFAULT_RADIUS = 20
const DEFAULT_FOOTER_TEXT = 'Powered By Waken-Wa✨'
const AVATAR_MAX_BYTES = 512 * 1024
const AVATAR_FETCH_TIMEOUT_MS = 2500
const HITOKOTO_FETCH_TIMEOUT_MS = 2200

type StatusCardState = 'active' | 'empty' | 'locked' | 'disabled'
type StatusCardIcon =
  | 'app'
  | 'bookOpen'
  | 'desktop'
  | 'gamepad'
  | 'hourglass'
  | 'lock'
  | 'mobile'
  | 'moon'
  | 'music'
  | 'tablet'
type StatusCardDetailRow = {
  label: string
  value: string
  icon: StatusCardIcon
}

export type StatusCardOptions = {
  variant: StatusCardVariant
  width: number
  widthAuto: boolean
  height: number
  heightAuto: boolean
  radius: number
  bg: string
  signatureBg: string
  fg: string
  muted: string
  accent: string
  border: string
  showHeader: boolean
  showAvatar: boolean
  showName: boolean
  showBio: boolean
  showNote: boolean
  preferGame: boolean
  showInClassStatus: boolean
  tag: string
  coverKey: string | null
  backgroundKey: string | null
  deviceId: number | null
  deviceKey: string | null
}

type StatusCardProfile = {
  name: string
  bio: string
  note: string
  avatarUrl: string
  currentlyText: string
}

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
  return normalizeStatusCardDimension(config?.[key], fallback, min, max)
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
  if (value === 'signature') return 'signature'
  if (value === 'cover') return 'cover'
  return value === 'aurora' ? 'aurora' : 'classic'
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

function parseColorParam(
  searchParams: URLSearchParams,
  key: string,
  fallback: string,
): string {
  return normalizeHexColor(searchParams.get(key)) ?? fallback
}

function getTrimmedText(value: unknown, fallback = ''): string {
  const text = typeof value === 'string' ? value : fallback
  return text.replace(/\s+/g, ' ').trim()
}

function getDeviceType(
  deviceName: string,
  metadata: Record<string, unknown> | null | undefined,
): Extract<StatusCardIcon, 'desktop' | 'mobile' | 'tablet'> {
  const explicit = String(metadata?.deviceType ?? '').trim().toLowerCase()
  if (explicit === 'mobile' || explicit === 'tablet' || explicit === 'desktop') return explicit

  const source = deviceName.toLowerCase()
  if (/ipad|tablet|tab|平板/.test(source)) return 'tablet'
  if (/iphone|android|mobile|phone|手机/.test(source)) return 'mobile'
  return 'desktop'
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function truncateText(value: string, maxChars: number): string {
  const text = getTrimmedText(value)
  if (text.length <= maxChars) return text
  return `${text.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`
}

function truncateTextByUnits(value: string, maxUnits: number): string {
  const text = getTrimmedText(value)
  if (!text) return ''

  let currentUnits = 0
  let output = ''
  for (const char of Array.from(text)) {
    const units = getTextUnit(char)
    if (output && currentUnits + units > maxUnits) {
      return `${output.trimEnd()}…`
    }
    if (!output && units > maxUnits) {
      return '…'
    }
    output += char
    currentUnits += units
  }
  return output
}

function getTextUnit(char: string): number {
  const codePoint = char.codePointAt(0) ?? 0
  if (
    codePoint > 0xffff ||
    (codePoint >= 0x1100 && codePoint <= 0x11ff) ||
    (codePoint >= 0x2e80 && codePoint <= 0xa4cf) ||
    (codePoint >= 0xac00 && codePoint <= 0xd7af) ||
    (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
    (codePoint >= 0xff01 && codePoint <= 0xff60)
  ) {
    return 2
  }
  if (/\s/.test(char)) return 0.5
  return 1
}

function estimateTextUnits(value: string): number {
  return Array.from(getTrimmedText(value)).reduce((total, char) => total + getTextUnit(char), 0)
}

function wrapTextLines(value: string, maxUnits: number, maxLines: number): string[] {
  const source = getTrimmedText(value)
  if (!source) return []

  const lines: string[] = []
  let line = ''
  let lineUnits = 0
  for (const char of Array.from(source)) {
    const units = getTextUnit(char)
    if (line && lineUnits + units > maxUnits) {
      lines.push(line.trimEnd())
      line = ''
      lineUnits = 0
      if (lines.length >= maxLines) break
    }
    line += char
    lineUnits += units
  }
  if (line && lines.length < maxLines) {
    lines.push(line.trimEnd())
  }

  const consumed = lines.join('').length
  if (consumed < source.length && lines.length > 0) {
    const lastIndex = lines.length - 1
    lines[lastIndex] = `${lines[lastIndex]!.replace(/\s+$/, '').replace(/.$/u, '')}…`
  }
  return lines
}

function escapeAttr(value: string): string {
  return escapeXml(value)
}

function mimeFromPathname(pathname: string): string | null {
  const ext = path.extname(pathname).toLowerCase()
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.png') return 'image/png'
  if (ext === '.gif') return 'image/gif'
  if (ext === '.webp') return 'image/webp'
  if (ext === '.avif') return 'image/avif'
  if (ext === '.svg') return 'image/svg+xml'
  return null
}

function dataUriFromBuffer(mimeType: string, buffer: Uint8Array): string | null {
  if (!mimeType.toLowerCase().startsWith('image/')) return null
  if (buffer.byteLength <= 0 || buffer.byteLength > AVATAR_MAX_BYTES) return null
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
      signal: AbortSignal.timeout(AVATAR_FETCH_TIMEOUT_MS),
      headers: {
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (compatible; WakenStatusCard/1.0)',
      },
    })
    if (!response.ok) return null
    const contentType = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()
    if (!contentType?.startsWith('image/')) return null
    const contentLength = Number(response.headers.get('content-length') ?? '')
    if (Number.isFinite(contentLength) && contentLength > AVATAR_MAX_BYTES) return null
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
    normalizeHexColor(searchParams.get('accent')) ??
    normalizeHexColor(config?.statusCardAccent) ??
    normalizeProfileOnlineAccentColor(config?.profileOnlineAccentColor) ??
    '#22C55E'
  const defaultHeight = showHeader
    ? getConfiguredNumber(config, 'statusCardHeight', DEFAULT_HEADER_HEIGHT, 1, 720)
    : DEFAULT_STATUS_HEIGHT
  const defaultWidth = variant === 'signature'
    ? SIGNATURE_WIDTH
    : getConfiguredNumber(config, 'statusCardWidth', DEFAULT_WIDTH, 280, 1200)
  const fallbackHeight = variant === 'signature' ? SIGNATURE_HEIGHT : defaultHeight
  const widthResult = parseIntegerParamWithAuto(searchParams, 'width', defaultWidth, 280, 1200)
  const heightResult = parseIntegerParamWithAuto(searchParams, 'height', fallbackHeight, 1, 720)
  const deviceIdRaw = searchParams.get('deviceId')
  const deviceId = deviceIdRaw == null || deviceIdRaw.trim() === ''
    ? null
    : Number(deviceIdRaw)

  return {
    variant,
    width: widthResult.value,
    widthAuto: widthResult.auto,
    height: heightResult.value,
    heightAuto: heightResult.auto,
    radius: parseIntegerParam(
      searchParams,
      'radius',
      getConfiguredNumber(config, 'statusCardRadius', DEFAULT_RADIUS, 0, 80),
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

function estimateStatusCardWidth(
  texts: string[],
  minWidth: number,
  maxWidth: number,
  basePadding: number,
  pixelsPerUnit: number,
): number {
  const widest = texts.reduce((max, text) => Math.max(max, estimateTextUnits(text) * pixelsPerUnit), 0)
  return clampNumber(Math.round(widest + basePadding), minWidth, maxWidth)
}

export function resolveStatusCardAutoDimensions(
  options: StatusCardOptions,
  profile: StatusCardProfile,
  activity: ActivityFeedItem | null,
  state: StatusCardState,
  inClassStatusActive = false,
  inClassOccurrence: ScheduleOccurrence | null = null,
): Pick<StatusCardOptions, 'width' | 'height'> {
  if (!options.widthAuto && !options.heightAuto) {
    return { width: options.width, height: options.height }
  }

  const steamLine = state === 'active' ? getSteamGameName(activity) : ''
  const appLine = state === 'active' ? getStatusLine(activity) : ''
  const shouldPrioritizeGame = Boolean(options.preferGame && steamLine)
  const shouldUseInClassStatus = Boolean(
    inClassStatusActive &&
    options.showInClassStatus &&
    state === 'active',
  )
  const statusLine = state === 'locked'
    ? 'Status locked'
    : state === 'disabled'
      ? 'Status card disabled'
      : state === 'empty'
        ? 'No active status'
        : shouldUseInClassStatus
          ? getInClassStatusLine(inClassOccurrence)
          : shouldPrioritizeGame
            ? steamLine
            : appLine
  const deviceLine = state === 'active' && activity
    ? shouldPrioritizeGame
      ? `Steam · ${getTrimmedText(activity.device, 'Unknown device')}`
      : getTrimmedText(activity.device, 'Unknown device')
    : state === 'locked'
      ? 'Unlock the site to view this card'
      : state === 'disabled'
        ? 'Enable the status card in admin settings'
        : 'Waiting for the next activity report'
  const mediaLine = state === 'active' ? getMediaLine(activity) : ''
  const bio = getTrimmedText(profile.bio)
  const note = getTrimmedText(profile.note)
  const name = getTrimmedText(profile.name || 'Waken')
  const commonTexts = [name, bio, note, statusLine, deviceLine, mediaLine, steamLine]

  let width = options.width
  let height = options.height

  if (options.variant === 'signature') {
    width = SIGNATURE_WIDTH
    height = options.heightAuto ? 0 : options.height
    return { width, height }
  }

  if (options.variant === 'cover') {
    if (options.widthAuto) {
      width = estimateStatusCardWidth(commonTexts, 320, 1200, 180, 8.2)
    }
    height = options.heightAuto ? 0 : options.height
    return { width, height }
  }

  if (options.variant === 'aurora') {
    if (options.widthAuto) {
      width = estimateStatusCardWidth(commonTexts, 320, 1200, 160, 8.4)
    }
    height = options.heightAuto ? 0 : options.height
    return { width, height }
  }

  if (options.widthAuto) {
    width = estimateStatusCardWidth(commonTexts, 280, 1200, 140, 8.8)
  }
  height = options.heightAuto ? 0 : options.height
  return { width, height }
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
      signal: AbortSignal.timeout(HITOKOTO_FETCH_TIMEOUT_MS),
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

function getStatusLine(activity: ActivityFeedItem | null): string {
  if (!activity) return 'No active status'
  const statusText = getTrimmedText(activity.statusText)
  if (statusText) return statusText
  return getProcessLine(activity) || 'Active now'
}

function getProcessLine(activity: ActivityFeedItem | null): string {
  if (!activity) return ''
  const processTitle = getTrimmedText(activity.processTitle)
  const processName = getTrimmedText(activity.processName)
  if (processTitle && processName && processTitle !== processName) {
    return `${processTitle} | ${processName}`
  }
  return processTitle || processName
}

function getMediaLine(activity: ActivityFeedItem | null): string {
  if (!activity) return ''
  const media = getMediaDisplay(activity.metadata)
  if (!media) return ''
  return media.singer ? `${media.title} · ${media.singer}` : media.title
}

function getSteamGameName(activity: ActivityFeedItem | null): string {
  const name = getTrimmedText(activity?.steamNowPlaying?.name)
  return name || ''
}

function getInitials(name: string): string {
  const normalized = getTrimmedText(name, 'W')
  const parts = normalized.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase()
  return normalized.slice(0, 2).toUpperCase()
}

function textElement({
  x,
  y,
  fill,
  className,
  text,
  anchor = 'start',
}: {
  x: number
  y: number
  fill: string
  className: string
  text: string
  anchor?: 'start' | 'middle' | 'end'
}): string {
  return `<text x="${x}" y="${y}" fill="${fill}" class="${className}" text-anchor="${anchor}">${escapeXml(text)}</text>`
}

function roundedRectElement({
  x,
  y,
  width,
  height,
  radius,
  fill,
  stroke,
  opacity = 1,
  strokeOpacity = 1,
}: {
  x: number
  y: number
  width: number
  height: number
  radius: number
  fill: string
  stroke?: string
  opacity?: number
  strokeOpacity?: number
}): string {
  return [
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}"`,
    ` fill="${fill}" opacity="${opacity}"`,
    stroke ? ` stroke="${stroke}" stroke-opacity="${strokeOpacity}"` : '',
    '/>',
  ].join('')
}

function iconElement({
  type,
  x,
  y,
  size,
  stroke,
  opacity = 1,
}: {
  type: StatusCardIcon
  x: number
  y: number
  size: number
  stroke: string
  opacity?: number
}): string {
  const common = `fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"`
  const paths: Record<StatusCardIcon, string> = {
    app: [
      '<rect x="3" y="5" width="18" height="14" rx="2"/>',
      '<path d="M3 9h18"/>',
      '<path d="M8 14h.01"/>',
      '<path d="M12 14h4"/>',
    ].join(''),
    bookOpen: [
      '<path d="M12 7v14"/>',
      '<path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3Z"/>',
    ].join(''),
    desktop: [
      '<rect x="3" y="4" width="18" height="12" rx="2"/>',
      '<path d="M8 20h8"/>',
      '<path d="M12 16v4"/>',
    ].join(''),
    gamepad: [
      '<path d="M6 11h4"/>',
      '<path d="M8 9v4"/>',
      '<path d="M15 12h.01"/>',
      '<path d="M18 10h.01"/>',
      '<path d="M17.3 6H6.7a4 4 0 0 0-3.9 3.2l-1 5A3 3 0 0 0 6.7 17L9 15h6l2.3 2a3 3 0 0 0 4.9-2.8l-1-5A4 4 0 0 0 17.3 6Z"/>',
    ].join(''),
    hourglass: [
      '<path d="M5 22h14"/>',
      '<path d="M5 2h14"/>',
      '<path d="M17 22v-4.2a4 4 0 0 0-1.2-2.8L13 12l2.8-3a4 4 0 0 0 1.2-2.8V2"/>',
      '<path d="M7 2v4.2A4 4 0 0 0 8.2 9L11 12l-2.8 3A4 4 0 0 0 7 17.8V22"/>',
    ].join(''),
    lock: [
      '<rect x="3" y="11" width="18" height="11" rx="2"/>',
      '<path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    ].join(''),
    mobile: [
      '<rect x="7" y="2" width="10" height="20" rx="2"/>',
      '<path d="M11 18h2"/>',
    ].join(''),
    moon: [
      '<path d="M12 3a6 6 0 0 0 9 7.5A9 9 0 1 1 12 3Z"/>',
    ].join(''),
    music: [
      '<path d="M9 18V5l12-2v13"/>',
      '<circle cx="6" cy="18" r="3"/>',
      '<circle cx="18" cy="16" r="3"/>',
    ].join(''),
    tablet: [
      '<rect x="5" y="2" width="14" height="20" rx="2"/>',
      '<path d="M12 18h.01"/>',
    ].join(''),
  }
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" ${common}>${paths[type]}</svg>`
}

function getStatusIcon(
  state: StatusCardState,
  activity: ActivityFeedItem | null,
  statusLine: string,
): StatusCardIcon | null {
  if (state === 'locked') return 'lock'
  if (state === 'empty') return 'hourglass'
  if (state !== 'active' || !activity) return null
  if (activity.isCustomLockStatus) return 'lock'
  if (!activity.isCustomOfflineStatus) return null

  const source = statusLine.toLowerCase()
  if (/待机|暂离|离开|idle|standby|away|afk/.test(source)) return 'hourglass'
  if (/休眠|睡觉|睡眠|睡了|晚安|sleep|sleeping|asleep|hibernate/.test(source)) return 'moon'
  return 'moon'
}

function formatTimeHm(value: Date): string {
  return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`
}

function getInClassStatusLine(occurrence?: ScheduleOccurrence | null): string {
  if (!occurrence) return '在上课中'
  return `${occurrence.title} - ${formatTimeHm(occurrence.start)}-${formatTimeHm(occurrence.end)}`
}

export function shouldApplyStatusCardInClassOverride(
  activity: ActivityFeedItem | null,
): boolean {
  if (!activity) return false
  if (activity.isCustomOfflineStatus || activity.isCustomLockStatus) return true
  const source = [
    activity.statusText,
    activity.processTitle,
    activity.processName,
  ].map((value) => getTrimmedText(value)).join(' ').toLowerCase()
  return /锁屏|锁定|lock|locked|待机|暂离|离开|idle|standby|away|afk|休眠|睡觉|睡眠|睡了|晚安|sleep|sleeping|asleep|hibernate/.test(source)
}

function multilineTextElement({
  x,
  y,
  fill,
  className,
  lines,
  lineHeight,
  dominantBaseline,
  textAnchor,
}: {
  x: number
  y: number
  fill: string
  className: string
  lines: string[]
  lineHeight: number
  dominantBaseline?: 'middle'
  textAnchor?: 'start' | 'middle' | 'end'
}): string {
  const tspans = lines
    .map((line, index) => (
      `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`
    ))
    .join('')
  const baselineAttr = dominantBaseline ? ` dominant-baseline="${dominantBaseline}"` : ''
  const anchorAttr = textAnchor ? ` text-anchor="${textAnchor}"` : ''
  return `<text x="${x}" y="${y}" fill="${fill}" class="${className}"${baselineAttr}${anchorAttr}>${tspans}</text>`
}

function linkElement(href: string, child: string): string {
  return `<a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer">${child}</a>`
}

function detailPillElement({
  x,
  y,
  width,
  height,
  options,
  row,
  valueLines,
}: {
  x: number
  y: number
  width: number
  height: number
  options: StatusCardOptions
  row: StatusCardDetailRow
  valueLines: string[]
}): string[] {
  const showLabel = row.label.length > 0
  const valueX = showLabel ? x + Math.min(94, Math.max(60, row.label.length * 7 + 36)) + 12 : x + 34
  return [
    roundedRectElement({
      x,
      y,
      width,
      height,
      radius: 12,
      fill: options.bg,
      stroke: options.border,
      opacity: 0.72,
      strokeOpacity: 0.62,
    }),
    iconElement({
      type: row.icon,
      x: x + 10,
      y: y + 8,
      size: 16,
      stroke: options.accent,
      opacity: 0.92,
    }),
    showLabel
      ? textElement({
          x: x + 34,
          y: y + 20,
          fill: options.muted,
          className: 'pillLabel',
          text: row.label,
        })
      : '',
    multilineTextElement({
      x: valueX,
      y: y + 20,
      fill: options.fg,
      className: 'pillValue',
      lines: valueLines,
      lineHeight: 17,
    }),
  ]
}

function renderAuroraStatusCardSvg({
  options,
  profile,
  activity,
  avatarDataUri,
  inClassStatusActive = false,
  inClassOccurrence,
  statusPageUrl,
  state,
}: {
  options: StatusCardOptions
  profile: StatusCardProfile
  activity: ActivityFeedItem | null
  avatarDataUri?: string | null
  inClassStatusActive?: boolean
  inClassOccurrence?: ScheduleOccurrence | null
  statusPageUrl: string
  state: StatusCardState
}): string {
  const width = options.width
  const padding = Math.max(20, Math.min(32, Math.round(width * 0.055)))
  const innerWidth = width - padding * 2
  const fullTextMaxChars = Math.max(18, Math.floor(innerWidth / 8))
  const steamLine = state === 'active' ? getSteamGameName(activity) : ''
  const appLine = state === 'active' ? getStatusLine(activity) : ''
  const shouldPrioritizeGame = Boolean(options.preferGame && steamLine)
  const shouldUseInClassStatus = Boolean(
    inClassStatusActive &&
    options.showInClassStatus &&
    state === 'active',
  )
  const statusLine = state === 'locked'
    ? 'Status locked'
    : state === 'disabled'
      ? 'Status card disabled'
    : state === 'empty'
      ? 'No active status'
      : shouldUseInClassStatus
        ? getInClassStatusLine(inClassOccurrence)
      : shouldPrioritizeGame
        ? steamLine
        : appLine
  const deviceLine = state === 'active' && activity
    ? shouldPrioritizeGame
      ? `Steam · ${getTrimmedText(activity.device, 'Unknown device')}`
      : getTrimmedText(activity.device, 'Unknown device')
    : state === 'locked'
      ? 'Unlock the site to view this card'
      : state === 'disabled'
        ? 'Enable the status card in admin settings'
      : 'Waiting for the next activity report'
  const mediaLine = state === 'active' ? getMediaLine(activity) : ''
  const sectionTitle = state === 'locked'
    ? 'PRIVATE STATUS'
    : state === 'disabled'
      ? 'STATUS CARD'
      : truncateText(profile.currentlyText || '当前状态', fullTextMaxChars)
  const statusIcon = shouldUseInClassStatus
    ? 'bookOpen'
    : shouldPrioritizeGame
      ? 'gamepad'
      : getStatusIcon(state, activity, statusLine) ?? (state === 'active' ? 'app' : 'hourglass')
  const deviceIcon = state === 'active'
    ? getDeviceType(deviceLine, activity?.metadata)
    : 'desktop'
  const detailRows: StatusCardDetailRow[] = [
    { label: '', value: deviceLine, icon: deviceIcon },
  ]
  if (mediaLine) {
    detailRows.push({ label: '', value: mediaLine, icon: 'music' })
  }
  if (steamLine && !shouldPrioritizeGame) {
    detailRows.push({ label: 'Game', value: steamLine, icon: 'gamepad' })
  }

  const nodes: string[] = []
  const defs: string[] = [
    `<linearGradient id="auroraBg" x1="0" y1="0" x2="${width}" y2="${options.height}">
      <stop offset="0%" stop-color="${options.bg}"/>
      <stop offset="54%" stop-color="${options.bg}"/>
      <stop offset="100%" stop-color="${options.accent}" stop-opacity="0.16"/>
    </linearGradient>`,
    `<radialGradient id="auroraGlowA" cx="18%" cy="10%" r="75%">
      <stop offset="0%" stop-color="${options.accent}" stop-opacity="0.34"/>
      <stop offset="46%" stop-color="${options.accent}" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="${options.accent}" stop-opacity="0"/>
    </radialGradient>`,
    `<radialGradient id="auroraGlowB" cx="88%" cy="82%" r="72%">
      <stop offset="0%" stop-color="${options.muted}" stop-opacity="0.2"/>
      <stop offset="58%" stop-color="${options.muted}" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="${options.muted}" stop-opacity="0"/>
    </radialGradient>`,
    `<linearGradient id="auroraSheen" x1="0" y1="0" x2="${width}" y2="0">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0"/>
      <stop offset="42%" stop-color="#FFFFFF" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
    </linearGradient>`,
    '<filter id="auroraShadow" x="-16%" y="-18%" width="132%" height="140%"><feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#0F172A" flood-opacity="0.14"/></filter>',
  ]

  let cursorY = padding
  if (options.showHeader) {
    const avatarSize = 58
    const avatarX = padding
    const avatarY = padding
    const headerTextX = options.showAvatar ? avatarX + avatarSize + 16 : padding
    const headerTextMaxChars = Math.max(16, Math.floor((width - headerTextX - padding) / 7.6))

    if (options.showAvatar) {
      defs.push(
        `<clipPath id="auroraAvatarClip"><circle cx="${avatarX + avatarSize / 2}" cy="${avatarY + avatarSize / 2}" r="${avatarSize / 2}"/></clipPath>`,
      )
      nodes.push(
        `<circle cx="${avatarX + avatarSize / 2}" cy="${avatarY + avatarSize / 2}" r="${avatarSize / 2 + 5}" fill="${options.accent}" opacity="0.13"/>`,
      )
      nodes.push(
        `<circle cx="${avatarX + avatarSize / 2}" cy="${avatarY + avatarSize / 2}" r="${avatarSize / 2 + 1}" fill="#FFFFFF" opacity="0.72"/>`,
      )
      if (avatarDataUri) {
        nodes.push(
          `<image href="${escapeAttr(avatarDataUri)}" x="${avatarX}" y="${avatarY}" width="${avatarSize}" height="${avatarSize}" preserveAspectRatio="xMidYMid slice" clip-path="url(#auroraAvatarClip)"/>`,
        )
      } else {
        nodes.push(
          `<text x="${avatarX + avatarSize / 2}" y="${avatarY + 38}" fill="${options.accent}" class="auroraAvatarInitials" text-anchor="middle">${escapeXml(getInitials(profile.name))}</text>`,
        )
      }
      nodes.push(
        `<circle cx="${avatarX + avatarSize - 6}" cy="${avatarY + avatarSize - 8}" r="6.5" fill="${state === 'active' ? options.accent : options.muted}" stroke="${options.bg}" stroke-width="3"/>`,
      )
    }

    let headerTextY = avatarY + 17
    if (options.showName) {
      nodes.push(textElement({
        x: headerTextX,
        y: headerTextY,
        fill: options.fg,
        className: 'auroraName',
        text: truncateText(profile.name || 'Waken', headerTextMaxChars),
      }))
      headerTextY += 21
    }
    if (options.showBio && profile.bio) {
      nodes.push(textElement({
        x: headerTextX,
        y: headerTextY,
        fill: options.muted,
        className: 'auroraBio',
        text: truncateText(profile.bio, headerTextMaxChars),
      }))
      headerTextY += 19
    }
    cursorY = Math.max(avatarY + avatarSize, headerTextY) + 22

    if (options.showNote && profile.note) {
      const noteLines = wrapTextLines(profile.note, Math.max(22, Math.floor(innerWidth / 7.4)), 2)
      nodes.push(
        roundedRectElement({
          x: padding,
          y: cursorY - 4,
          width: innerWidth,
          height: noteLines.length > 1 ? 52 : 34,
          radius: 14,
          fill: '#FFFFFF',
          stroke: options.border,
          opacity: 0.38,
          strokeOpacity: 0.44,
        }),
      )
      nodes.push(multilineTextElement({
        x: padding + 14,
        y: cursorY + 17,
        fill: options.muted,
        className: 'auroraNote',
        lines: noteLines,
        lineHeight: 17,
      }))
      cursorY += noteLines.length > 1 ? 62 : 44
    }
  }

  const heroY = cursorY
  const heroHeight = 94
  const heroIconX = padding + 20
  const heroIconY = heroY + 35
  const heroTextX = padding + 58
  const heroTextWidth = innerWidth - 76
  const statusTextMaxUnits = Math.max(18, Math.floor((innerWidth - 76) / 9.2))
  nodes.push(
    `<rect x="${padding}" y="${heroY}" width="${innerWidth}" height="${heroHeight}" rx="22" fill="#FFFFFF" opacity="0.48" stroke="${options.border}" stroke-opacity="0.5" filter="url(#auroraShadow)"/>`,
  )
  nodes.push(
    `<rect x="${padding + 1}" y="${heroY + 1}" width="${innerWidth - 2}" height="${Math.floor(heroHeight * 0.52)}" rx="21" fill="url(#auroraSheen)" opacity="0.75"/>`,
  )
  nodes.push(
    `<rect x="${heroIconX - 4}" y="${heroIconY - 4}" width="28" height="28" rx="10" fill="${options.accent}" opacity="0.12"/>`,
  )
  nodes.push(iconElement({
    type: statusIcon,
    x: heroIconX,
    y: heroIconY,
    size: 20,
    stroke: options.accent,
    opacity: 0.88,
  }))
  nodes.push(textElement({
    x: heroTextX,
    y: heroY + 35,
    fill: options.muted,
    className: 'auroraKicker',
    text: sectionTitle,
  }))
  nodes.push(multilineTextElement({
    x: heroTextX,
    y: heroY + 62,
    fill: options.fg,
    className: 'auroraStatus',
    lines: [truncateTextByUnits(statusLine, Math.max(18, Math.floor(heroTextWidth / 9.2)))],
    lineHeight: 22,
    dominantBaseline: 'middle',
  }))

  let detailY = heroY + heroHeight + 14
  const detailHeight = 36
  const footerHeight = 28
  const minHeight = detailY + detailRows.length * (detailHeight + 8) + footerHeight + padding
  const height = Math.max(options.height, minHeight, options.showHeader ? 310 : 218)
  const detailBottom = height - padding - footerHeight
  for (const row of detailRows) {
    if (detailY + detailHeight > detailBottom) break
    const showLabel = row.label.length > 0
    const labelWidth = showLabel ? Math.min(104, Math.max(60, row.label.length * 6.8 + 34)) : 0
    const valueX = showLabel ? padding + labelWidth + 18 : padding + 38
    const valueMaxUnits = Math.max(12, Math.floor((innerWidth - labelWidth - (showLabel ? 52 : 44)) / 8))
    nodes.push(
      `<rect x="${padding}" y="${detailY}" width="${innerWidth}" height="${detailHeight}" rx="18" fill="${options.bg}" opacity="0.58" stroke="${options.border}" stroke-opacity="0.42"/>`,
    )
    nodes.push(iconElement({
      type: row.icon,
      x: padding + 14,
      y: detailY + 10,
      size: 16,
      stroke: row.icon === 'music' || row.icon === 'gamepad' ? options.accent : options.muted,
      opacity: 0.82,
    }))
    if (showLabel) {
      nodes.push(textElement({
        x: padding + 38,
        y: detailY + 23,
        fill: options.muted,
        className: 'auroraPillLabel',
        text: row.label,
      }))
    }
    nodes.push(textElement({
      x: valueX,
      y: detailY + 23,
      fill: options.fg,
      className: 'auroraPillValue',
      text: truncateTextByUnits(row.value, valueMaxUnits),
    }))
    detailY += detailHeight + 8
  }

  const footerY = height - padding + 1
  nodes.push(
    `<line x1="${padding}" y1="${footerY - 19}" x2="${width - padding}" y2="${footerY - 19}" stroke="${options.border}" stroke-width="1" opacity="0.42"/>`,
  )
  nodes.push(linkElement(
    statusPageUrl,
    textElement({
      x: padding,
      y: footerY,
      fill: options.muted,
      className: 'auroraFooter',
      text: truncateText(DEFAULT_FOOTER_TEXT, fullTextMaxChars),
    }),
  ))
  nodes.push(
    `<circle cx="${padding + 126}" cy="${footerY - 4}" r="3.5" fill="${state === 'active' ? options.accent : options.muted}" opacity="0.72"/>`,
  )

  const ariaLabel = state === 'active'
    ? `${profile.currentlyText || '当前状态'}: ${statusLine}${steamLine ? `. Playing: ${steamLine}` : ''}${mediaLine ? `. Listening: ${mediaLine}` : ''}`
    : statusLine

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttr(ariaLabel)}">`,
    '<style>',
    'text{font-family:"SF Pro Rounded","Segoe UI",ui-rounded,-apple-system,BlinkMacSystemFont,sans-serif;letter-spacing:0}',
    '.auroraKicker{font-size:11px;font-weight:780;letter-spacing:.12em;text-transform:uppercase}',
    '.auroraStatus{font-size:17px;font-weight:760;letter-spacing:-.01em}',
    '.auroraName{font-size:18px;font-weight:800;letter-spacing:-.01em}',
    '.auroraBio,.auroraNote{font-size:13px;font-weight:560}',
    '.auroraPillLabel{font-size:11px;font-weight:760;letter-spacing:.04em}',
    '.auroraPillValue{font-size:13px;font-weight:680}',
    '.auroraFooter{font-size:10.5px;font-weight:700;letter-spacing:.03em}',
    '.auroraAvatarInitials{font-size:18px;font-weight:850}',
    '</style>',
    `<defs>${defs.join('')}</defs>`,
    `<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${options.radius}" fill="url(#auroraBg)" stroke="${options.border}" stroke-opacity="0.72"/>`,
    `<rect x="0" y="0" width="${width}" height="${height}" rx="${options.radius}" fill="url(#auroraGlowA)"/>`,
    `<rect x="0" y="0" width="${width}" height="${height}" rx="${options.radius}" fill="url(#auroraGlowB)"/>`,
    `<path d="M${Math.round(width * 0.56)} -18 C ${Math.round(width * 0.76)} ${Math.round(height * 0.18)}, ${Math.round(width * 0.32)} ${Math.round(height * 0.36)}, ${width + 22} ${Math.round(height * 0.58)}" fill="none" stroke="${options.accent}" stroke-width="28" stroke-opacity="0.055" stroke-linecap="round"/>`,
    ...nodes,
    '</svg>',
  ].join('')
}

function renderCoverStatusCardSvg({
  options,
  profile,
  activity,
  avatarDataUri,
  coverDataUri,
  inClassStatusActive = false,
  inClassOccurrence,
  statusPageUrl,
  state,
}: {
  options: StatusCardOptions
  profile: StatusCardProfile
  activity: ActivityFeedItem | null
  avatarDataUri?: string | null
  coverDataUri?: string | null
  inClassStatusActive?: boolean
  inClassOccurrence?: ScheduleOccurrence | null
  statusPageUrl: string
  state: StatusCardState
}): string {
  const width = options.width
  let height = Math.max(options.height, options.showHeader ? 400 : 320)
  const padding = 24
  const innerWidth = width - padding * 2
  const coverHeight = Math.max(86, Math.min(128, Math.round(height * 0.31)))
  const avatarSize = options.showHeader && options.showAvatar ? 66 : 0
  const avatarX = padding
  const avatarY = coverHeight - Math.round(avatarSize * 0.45)
  const fullTextMaxChars = Math.max(18, Math.floor(innerWidth / 8))
  let contentTop = options.showHeader
    ? Math.max(coverHeight + 24, avatarY + avatarSize + 16)
    : coverHeight + 22
  const steamLine = state === 'active' ? getSteamGameName(activity) : ''
  const appLine = state === 'active' ? getStatusLine(activity) : ''
  const shouldPrioritizeGame = Boolean(options.preferGame && steamLine)
  const shouldUseInClassStatus = Boolean(
    inClassStatusActive &&
    options.showInClassStatus &&
    state === 'active',
  )
  const statusLine = state === 'locked'
    ? 'Status locked'
    : state === 'disabled'
      ? 'Status card disabled'
    : state === 'empty'
      ? 'No active status'
      : shouldUseInClassStatus
        ? getInClassStatusLine(inClassOccurrence)
      : shouldPrioritizeGame
        ? steamLine
        : appLine
  const deviceLine = state === 'active' && activity
    ? shouldPrioritizeGame
      ? `Steam · ${getTrimmedText(activity.device, 'Unknown device')}`
      : getTrimmedText(activity.device, 'Unknown device')
    : state === 'locked'
      ? 'Unlock the site to view this card'
      : state === 'disabled'
        ? 'Enable the status card in admin settings'
      : 'Waiting for the next activity report'
  const mediaLine = state === 'active' ? getMediaLine(activity) : ''
  const statusIcon = shouldUseInClassStatus
    ? 'bookOpen'
    : shouldPrioritizeGame
      ? 'gamepad'
      : getStatusIcon(state, activity, statusLine) ?? (state === 'active' ? 'app' : 'hourglass')
  const deviceIcon = state === 'active'
    ? getDeviceType(deviceLine, activity?.metadata)
    : 'desktop'
  const sectionTitle = state === 'locked'
    ? 'PRIVATE STATUS'
    : state === 'disabled'
      ? 'STATUS CARD'
      : truncateText(profile.currentlyText || '当前状态', fullTextMaxChars)
  const defs: string[] = [
    `<clipPath id="coverCardClip"><rect x="0" y="0" width="${width}" height="${height}" rx="${options.radius}"/></clipPath>`,
    `<linearGradient id="coverFallback" x1="0" y1="0" x2="${width}" y2="${coverHeight}">
      <stop offset="0%" stop-color="${options.accent}" stop-opacity="0.86"/>
      <stop offset="100%" stop-color="${options.muted}" stop-opacity="0.72"/>
    </linearGradient>`,
    '<linearGradient id="coverShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0F172A" stop-opacity="0.08"/><stop offset="100%" stop-color="#0F172A" stop-opacity="0.42"/></linearGradient>',
    '<filter id="coverAvatarShadow" x="-28%" y="-28%" width="156%" height="156%"><feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#0F172A" flood-opacity="0.24"/></filter>',
    '<filter id="coverPanelShadow" x="-8%" y="-16%" width="116%" height="132%"><feDropShadow dx="0" dy="7" stdDeviation="9" flood-color="#0F172A" flood-opacity="0.12"/></filter>',
  ]
  if (avatarSize > 0) {
    defs.push(
      `<clipPath id="coverAvatarClip"><circle cx="${avatarX + avatarSize / 2}" cy="${avatarY + avatarSize / 2}" r="${avatarSize / 2}"/></clipPath>`,
    )
  }

  const nodes: string[] = [
    `<g clip-path="url(#coverCardClip)">`,
    coverDataUri
      ? `<image href="${escapeAttr(coverDataUri)}" x="0" y="0" width="${width}" height="${coverHeight}" preserveAspectRatio="xMidYMid slice"/>`
      : `<rect x="0" y="0" width="${width}" height="${coverHeight}" fill="url(#coverFallback)"/>`,
    `<rect x="0" y="0" width="${width}" height="${coverHeight}" fill="url(#coverShade)"/>`,
    `<line x1="0" y1="${coverHeight}" x2="${width}" y2="${coverHeight}" stroke="${options.border}" stroke-width="1.2" opacity="0.72"/>`,
    '</g>',
  ]

  if (options.showHeader) {
    if (avatarSize > 0) {
      nodes.push(
        `<circle cx="${avatarX + avatarSize / 2}" cy="${avatarY + avatarSize / 2}" r="${avatarSize / 2 + 4}" fill="${options.bg}" filter="url(#coverAvatarShadow)"/>`,
      )
      if (avatarDataUri) {
        nodes.push(
          `<image href="${escapeAttr(avatarDataUri)}" x="${avatarX}" y="${avatarY}" width="${avatarSize}" height="${avatarSize}" preserveAspectRatio="xMidYMid slice" clip-path="url(#coverAvatarClip)"/>`,
        )
      } else {
        nodes.push(
          `<circle cx="${avatarX + avatarSize / 2}" cy="${avatarY + avatarSize / 2}" r="${avatarSize / 2}" fill="${options.accent}" opacity="0.16"/>`,
          `<text x="${avatarX + avatarSize / 2}" y="${avatarY + 42}" fill="${options.accent}" class="coverAvatarInitials" text-anchor="middle">${escapeXml(getInitials(profile.name))}</text>`,
        )
      }
      nodes.push(
        `<circle cx="${avatarX + avatarSize - 7}" cy="${avatarY + avatarSize - 9}" r="7" fill="${state === 'active' ? options.accent : options.muted}" stroke="${options.bg}" stroke-width="3"/>`,
      )
    }

    const headerX = avatarSize > 0 ? avatarX + avatarSize + 16 : padding
    const headerY = coverHeight + 23
    const headerMaxChars = Math.max(14, Math.floor((width - headerX - padding) / 8))
    let headerBottom = headerY
    if (options.showName) {
      nodes.push(textElement({
        x: headerX,
        y: headerY,
        fill: options.fg,
        className: 'coverName',
        text: truncateText(profile.name || 'Waken', headerMaxChars),
      }))
      headerBottom = Math.max(headerBottom, headerY + 4)
    }
    if (options.showBio && profile.bio) {
      nodes.push(textElement({
        x: headerX,
        y: headerY + 20,
        fill: options.muted,
        className: 'coverBio',
        text: truncateText(profile.bio, headerMaxChars),
      }))
      headerBottom = Math.max(headerBottom, headerY + 24)
    }
    if (options.showNote && profile.note) {
      const noteLines = wrapTextLines(profile.note, Math.max(24, Math.floor(innerWidth / 7.4)), 2)
      const noteY = Math.max(avatarY + avatarSize + 18, headerBottom + 18)
      nodes.push(multilineTextElement({
        x: padding,
        y: noteY,
        fill: options.muted,
        className: 'coverNote',
        lines: noteLines,
        lineHeight: 17,
      }))
      contentTop = Math.max(contentTop, noteY + noteLines.length * 17 + 12)
    }
  }

  const panelY = contentTop
  const panelHeight = 76
  nodes.push(
    `<rect x="${padding}" y="${panelY}" width="${innerWidth}" height="${panelHeight}" rx="16" fill="${options.bg}" stroke="${options.border}" stroke-width="1.1" filter="url(#coverPanelShadow)"/>`,
  )
  nodes.push(
    `<rect x="${padding}" y="${panelY}" width="5" height="${panelHeight}" rx="2.5" fill="${options.accent}" opacity="0.9"/>`,
  )
  nodes.push(iconElement({
    type: statusIcon,
    x: padding + 22,
    y: panelY + 44,
    size: 16,
    stroke: options.accent,
    opacity: 0.72,
  }))
  nodes.push(textElement({
    x: padding + 48,
    y: panelY + 27,
    fill: options.muted,
    className: 'coverKicker',
    text: sectionTitle,
  }))
  nodes.push(multilineTextElement({
    x: padding + 48,
    y: panelY + 53,
    fill: options.fg,
    className: 'coverStatus',
    lines: [truncateTextByUnits(statusLine, Math.max(18, Math.floor((innerWidth - 68) / 9)))],
    lineHeight: 20,
    dominantBaseline: 'middle',
  }))

  const metaY = panelY + panelHeight + 10
  const metaItems = [
    { icon: deviceIcon, text: deviceLine },
    ...(mediaLine ? [{ icon: 'music' as const, text: mediaLine }] : []),
    ...(steamLine && !shouldPrioritizeGame ? [{ icon: 'gamepad' as const, text: steamLine }] : []),
  ]
  const requiredMetaBottom = metaItems.length > 0
    ? metaY + metaItems.length * 31
    : metaY
  height = Math.max(height, requiredMetaBottom + padding + 28)
  let cursorY = metaY
  for (const item of metaItems) {
    if (cursorY + 31 > height - padding - 28) break
    nodes.push(
      `<line x1="${padding}" y1="${cursorY}" x2="${width - padding}" y2="${cursorY}" stroke="${options.border}" stroke-width="1" opacity="0.58"/>`,
    )
    nodes.push(iconElement({
      type: item.icon,
      x: padding,
      y: cursorY + 9,
      size: 14,
      stroke: options.muted,
      opacity: 0.62,
    }))
    nodes.push(textElement({
      x: padding + 22,
      y: cursorY + 21,
      fill: options.muted,
      className: 'coverMeta',
      text: truncateTextByUnits(item.text, Math.max(18, Math.floor((innerWidth - 28) / 7.4))),
    }))
    cursorY += 31
  }

  const footerY = height - padding + 2
  nodes.push(
    `<line x1="${padding}" y1="${footerY - 18}" x2="${width - padding}" y2="${footerY - 18}" stroke="${options.border}" stroke-width="1" opacity="0.62"/>`,
  )
  nodes.push(linkElement(
    statusPageUrl,
    textElement({
      x: padding,
      y: footerY,
      fill: options.muted,
      className: 'coverFooter',
      text: truncateText(DEFAULT_FOOTER_TEXT, fullTextMaxChars),
    }),
  ))

  const ariaLabel = state === 'active'
    ? `${profile.currentlyText || '当前状态'}: ${statusLine}${steamLine ? `. Playing: ${steamLine}` : ''}${mediaLine ? `. Listening: ${mediaLine}` : ''}`
    : statusLine

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttr(ariaLabel)}">`,
    '<style>',
    'text{font-family:"SF Pro Rounded","Segoe UI",ui-rounded,-apple-system,BlinkMacSystemFont,sans-serif;letter-spacing:0}',
    '.coverName{font-size:18px;font-weight:800;letter-spacing:-.01em}',
    '.coverBio,.coverNote{font-size:13px;font-weight:560}',
    '.coverKicker{font-size:11px;font-weight:780;letter-spacing:.12em;text-transform:uppercase}',
    '.coverStatus{font-size:16px;font-weight:760;letter-spacing:-.01em}',
    '.coverMeta{font-size:12px;font-weight:560}',
    '.coverFooter{font-size:10.5px;font-weight:700;letter-spacing:.03em}',
    '.coverAvatarInitials{font-size:19px;font-weight:850}',
    '</style>',
    `<defs>${defs.join('')}</defs>`,
    `<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${options.radius}" fill="${options.bg}" stroke="${options.border}" stroke-width="1.25"/>`,
    ...nodes,
    '</svg>',
  ].join('')
}

function renderSignatureStatusCardSvg({
  options,
  profile,
  activity,
  avatarDataUri,
  backgroundDataUri,
  inClassStatusActive = false,
  inClassOccurrence,
  statusPageUrl,
  state,
}: {
  options: StatusCardOptions
  profile: StatusCardProfile
  activity: ActivityFeedItem | null
  avatarDataUri?: string | null
  backgroundDataUri?: string | null
  inClassStatusActive?: boolean
  inClassOccurrence?: ScheduleOccurrence | null
  statusPageUrl: string
  state: StatusCardState
}): string {
  const width = 700
  const height = SIGNATURE_HEIGHT
  const avatarSize = 58
  const leftInset = 36
  const leftWidth = 270
  const dividerX = leftWidth
  const rightX = dividerX + 28
  const rightWidth = width - rightX - 34
  const leftCenterX = leftWidth / 2
  const leftTextWidth = leftWidth - leftInset * 2
  const avatarX = leftCenterX - avatarSize / 2
  const avatarY = 30
  const nameY = 116
  const tagPillY = 124
  const bioY = options.tag ? tagPillY + 40 : nameY + 25
  const centerY = height / 2
  const steamLine = state === 'active' ? getSteamGameName(activity) : ''
  const mediaLine = state === 'active' ? getMediaLine(activity) : ''
  const statusPanelY = 36
  const statusPanelHeight = 58
  const appLine = state === 'active' ? getStatusLine(activity) : ''
  const shouldPrioritizeGame = Boolean(options.preferGame && steamLine)
  const shouldUseInClassStatus = Boolean(
    inClassStatusActive &&
    options.showInClassStatus &&
    state === 'active',
  )
  const statusLine = state === 'locked'
    ? 'Status locked'
    : state === 'disabled'
      ? 'Status card disabled'
    : state === 'empty'
      ? 'No active status'
      : shouldUseInClassStatus
        ? getInClassStatusLine(inClassOccurrence)
      : shouldPrioritizeGame
        ? steamLine
        : appLine
  const deviceLine = state === 'active' && activity
    ? shouldPrioritizeGame
      ? `Steam · ${getTrimmedText(activity.device, 'Unknown device')}`
      : getTrimmedText(activity.device, 'Unknown device')
    : state === 'locked'
      ? 'Unlock the site to view this card'
      : state === 'disabled'
        ? 'Enable the status card in admin settings'
      : 'Waiting for the next activity report'
  const deviceIcon = state === 'active'
    ? getDeviceType(deviceLine, activity?.metadata)
    : 'desktop'
  const defs: string[] = [
    `<linearGradient id="signatureBg" x1="0" y1="0" x2="${width}" y2="${height}">
      <stop offset="0%" stop-color="${options.signatureBg}"/>
      <stop offset="58%" stop-color="${options.signatureBg}"/>
      <stop offset="100%" stop-color="${options.bg}"/>
    </linearGradient>`,
    `<linearGradient id="signatureBeam" x1="74" y1="0" x2="${width - 74}" y2="${height}">
      <stop offset="0%" stop-color="${options.bg}" stop-opacity="0"/>
      <stop offset="42%" stop-color="#A78BFA" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="#F9A8D4" stop-opacity="0.08"/>
    </linearGradient>`,
    `<linearGradient id="signatureDividerFade" x1="${dividerX}" y1="44" x2="${dividerX}" y2="${height - 38}">
      <stop offset="0%" stop-color="#C4B5FD" stop-opacity="0"/>
      <stop offset="18%" stop-color="#C4B5FD" stop-opacity="0.5"/>
      <stop offset="82%" stop-color="#C4B5FD" stop-opacity="0.38"/>
      <stop offset="100%" stop-color="#C4B5FD" stop-opacity="0"/>
    </linearGradient>`,
    `<linearGradient id="signaturePanel" x1="${rightX}" y1="${statusPanelY}" x2="${rightX + rightWidth}" y2="${statusPanelY + statusPanelHeight}">
      <stop offset="0%" stop-color="${options.bg}" stop-opacity="0.96"/>
      <stop offset="58%" stop-color="${options.bg}" stop-opacity="0.84"/>
      <stop offset="100%" stop-color="#A78BFA" stop-opacity="0.08"/>
    </linearGradient>`,
    '<filter id="signatureShadow" x="-8%" y="-18%" width="116%" height="136%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#0F172A" flood-opacity="0.1"/></filter>',
    '<filter id="signatureMetaShadow" x="-4%" y="-40%" width="108%" height="180%"><feDropShadow dx="0" dy="1.5" stdDeviation="1.6" flood-color="#1E1B4B" flood-opacity="0.1"/></filter>',
    '<filter id="signatureAvatarGlow" x="-70%" y="-70%" width="240%" height="240%"><feGaussianBlur stdDeviation="12" result="blur"/><feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.55 0 0 0 0 0.42 0 0 0 0 0.95 0 0 0 0.28 0"/></filter>',
    `<clipPath id="signatureCardClip"><rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${options.radius}"/></clipPath>`,
    `<clipPath id="signatureAvatarClip"><circle cx="${avatarX + avatarSize / 2}" cy="${avatarY + avatarSize / 2}" r="${avatarSize / 2}"/></clipPath>`,
  ]
  const nodes: string[] = []

  nodes.push(
    `<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${options.radius}" fill="url(#signatureBg)" stroke="#D9CCFF" stroke-width="1.2" filter="url(#signatureShadow)"/>`,
  )
  if (backgroundDataUri) {
    nodes.push(
      `<image href="${escapeAttr(backgroundDataUri)}" x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" preserveAspectRatio="xMidYMid slice" opacity="0.34" clip-path="url(#signatureCardClip)"/>`,
    )
    nodes.push(`<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${options.radius}" fill="${options.signatureBg}" opacity="0.34"/>`)
    nodes.push(`<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${options.radius}" fill="url(#signatureBg)" opacity="0.48"/>`)
  }
  nodes.push(`<path d="M82 -18 C178 72 286 91 425 34 C518 -4 601 14 726 90 L726 0 L82 0 Z" fill="url(#signatureBeam)" opacity="0.68"/>`)
  nodes.push(`<circle cx="${width - 104}" cy="44" r="54" fill="#F9A8D4" opacity="0.12"/>`)
  nodes.push(`<circle cx="${width - 58}" cy="86" r="34" fill="#A78BFA" opacity="0.1"/>`)
  nodes.push(`<path d="M${width - 188} 34 C ${width - 138} 20, ${width - 90} 31, ${width - 42} 18" fill="none" stroke="#FFFFFF" stroke-width="1.4" stroke-linecap="round" opacity="0.5"/>`)
  nodes.push(
    `<line x1="${dividerX}" y1="44" x2="${dividerX}" y2="${height - 38}" stroke="url(#signatureDividerFade)" stroke-width="1.2"/>`,
  )

  nodes.push(`<circle cx="${avatarX + avatarSize / 2}" cy="${avatarY + avatarSize / 2}" r="41" fill="#8B5CF6" opacity="0.42" filter="url(#signatureAvatarGlow)"/>`)
  nodes.push(`<circle cx="${avatarX + avatarSize / 2 - 16}" cy="${avatarY + avatarSize / 2 - 14}" r="18" fill="#C4B5FD" opacity="0.24"/>`)
  nodes.push(`<circle cx="${avatarX + avatarSize / 2}" cy="${avatarY + avatarSize / 2}" r="${avatarSize / 2 + 3}" fill="${options.bg}" opacity="0.8"/>`)
  nodes.push(`<circle cx="${avatarX + avatarSize / 2}" cy="${avatarY + avatarSize / 2}" r="${avatarSize / 2}" fill="${options.accent}" opacity="0.16"/>`)
  if (avatarDataUri) {
    nodes.push(
      `<image href="${escapeAttr(avatarDataUri)}" x="${avatarX}" y="${avatarY}" width="${avatarSize}" height="${avatarSize}" preserveAspectRatio="xMidYMid slice" clip-path="url(#signatureAvatarClip)"/>`,
    )
  } else {
    nodes.push(
      `<text x="${avatarX + avatarSize / 2}" y="${avatarY + 34}" fill="${options.accent}" class="signatureAvatarInitials" text-anchor="middle">${escapeXml(getInitials(profile.name))}</text>`,
    )
  }

  const leftTextX = leftInset
  const leftTextMaxChars = Math.max(18, Math.floor(leftTextWidth / 7.4))
  const tagText = options.tag
  nodes.push(textElement({
    x: leftCenterX,
    y: nameY,
    fill: options.fg,
    className: 'signatureName',
    text: truncateText(profile.name || 'Waken', leftTextMaxChars),
    anchor: 'middle',
  }))
  if (tagText) {
    const tagMaxChars = Math.max(10, Math.floor(leftTextWidth / 6.8))
    const tagPillWidth = 112
    const tagPillX = leftCenterX - tagPillWidth / 2
    nodes.push(`<rect x="${tagPillX}" y="${tagPillY}" width="${tagPillWidth}" height="24" rx="12" fill="#FFFFFF" opacity="0.36" stroke="#8B5CF6" stroke-width="0.8" stroke-opacity="0.54" filter="url(#signatureMetaShadow)"/>`)
    nodes.push(`<svg x="${tagPillX + 17}" y="${tagPillY + 7}" width="10" height="10" viewBox="0 0 512 512" aria-hidden="true" fill="#8B5CF6" opacity="0.74"><path d="M0 252.118V48C0 21.49 21.49 0 48 0h204.118a48 48 0 0 1 33.941 14.059l211.882 211.882c18.745 18.745 18.745 49.137 0 67.882L293.823 497.941c-18.745 18.745-49.137 18.745-67.882 0L14.059 286.059A48 48 0 0 1 0 252.118zM112 64c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.49-48-48-48z"/></svg>`)
    nodes.push(textElement({
      x: tagPillX + 36,
      y: tagPillY + 16.5,
      fill: '#7C3AED',
      className: 'signatureTag',
      text: truncateText(tagText, tagMaxChars),
    }))
  }
  if (profile.bio) {
    nodes.push(multilineTextElement({
      x: leftCenterX,
      y: bioY,
      fill: options.muted,
      className: 'signatureBio',
      lines: wrapTextLines(profile.bio, Math.max(26, Math.floor(leftTextWidth / 5.8)), 2),
      lineHeight: 14,
      textAnchor: 'middle',
    }))
  }
  const statusContentX = rightX + 34
  nodes.push(
    `<rect x="${rightX}" y="${statusPanelY}" width="${rightWidth}" height="${statusPanelHeight}" rx="12" fill="url(#signaturePanel)" stroke="#A78BFA" stroke-opacity="0.86"/>`,
  )
  nodes.push(`<rect x="${rightX + 1}" y="${statusPanelY + 1}" width="${rightWidth - 2}" height="${statusPanelHeight - 2}" rx="11" fill="#FFFFFF" opacity="0.18"/>`)
  nodes.push(`<path d="M${rightX + 16} ${statusPanelY + 1} H${rightX + rightWidth - 18}" stroke="#FFFFFF" stroke-width="1" stroke-linecap="round" opacity="0.62"/>`)
  nodes.push(`<circle cx="${rightX + 18}" cy="${statusPanelY + statusPanelHeight / 2}" r="3.2" fill="${options.accent}" opacity="0.9"/>`)
  nodes.push(textElement({
    x: statusContentX,
    y: statusPanelY + 20,
    fill: options.muted,
    className: 'signatureKicker',
    text: truncateText(profile.currentlyText || '当前状态', Math.max(12, Math.floor((rightWidth - 44) / 8))),
  }))
  nodes.push(multilineTextElement({
    x: statusContentX,
    y: statusPanelY + 40,
    fill: options.fg,
    className: 'signatureStatus',
    lines: [truncateTextByUnits(statusLine, Math.max(30, Math.floor((rightWidth - 44) / 7.2)))],
    lineHeight: 20,
    dominantBaseline: 'middle',
  }))

  const metaItems = [
    { value: deviceLine, icon: deviceIcon },
    ...(mediaLine ? [{ value: mediaLine, icon: 'music' as const }] : []),
    ...(steamLine && !shouldPrioritizeGame ? [{ value: steamLine, icon: 'gamepad' as const }] : []),
  ].slice(0, 2)
  const metaY = statusPanelY + statusPanelHeight + 12
  const metaPillHeight = 30
  const metaRowGap = 7
  for (const [index, item] of metaItems.entries()) {
    const itemTop = metaY + index * (metaPillHeight + metaRowGap)
    const itemCenterY = itemTop + metaPillHeight / 2
    const itemWidth = rightWidth
    const iconColor = item.icon === 'music' || item.icon === 'gamepad' ? '#8B5CF6' : '#A78BFA'
    nodes.push(
      `<rect x="${rightX}" y="${itemTop}" width="${itemWidth}" height="${metaPillHeight}" rx="12" fill="#FFFFFF" opacity="0.38" stroke="#8B5CF6" stroke-width="1" stroke-opacity="0.78" filter="url(#signatureMetaShadow)"/>`,
    )
    nodes.push(iconElement({
      type: item.icon,
      x: rightX + 12,
      y: itemCenterY - 6,
      size: 12,
      stroke: iconColor,
      opacity: 0.68,
    }))
    nodes.push(textElement({
      x: rightX + 32,
      y: itemCenterY + 3.5,
      fill: '#7C3AED',
      className: 'signatureMeta',
      text: truncateTextByUnits(item.value, Math.max(10, Math.floor((itemWidth - 44) / 5.7))),
    }))
  }

  nodes.push(linkElement(
    statusPageUrl,
    [
      `<line x1="${width - 102}" y1="${height - 20}" x2="${width - 88}" y2="${height - 20}" stroke="#E8B4A0" stroke-width="1.4" stroke-linecap="round" opacity="0.6"/>`,
      textElement({
        x: width - 34,
        y: height - 16,
        fill: options.muted,
        className: 'signatureFooter',
        text: truncateText(DEFAULT_FOOTER_TEXT, Math.max(22, Math.floor(rightWidth / 7.5))),
        anchor: 'end',
      }),
    ].join(''),
  ))

  const ariaLabel = state === 'active'
    ? `${profile.currentlyText || '当前状态'}: ${statusLine}${steamLine ? `. Playing: ${steamLine}` : ''}${mediaLine ? `. Listening: ${mediaLine}` : ''}`
    : statusLine

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttr(ariaLabel)}">`,
    '<style>',
    'text{font-family:"SF Pro Rounded","Segoe UI",ui-rounded,-apple-system,BlinkMacSystemFont,sans-serif;letter-spacing:0}',
    '.signatureName{font-size:15px;font-weight:800;letter-spacing:-.01em}',
    '.signatureTag{font-size:11px;font-weight:720}',
    '.signatureBio{font-size:11.5px;font-weight:660}',
    '.signatureKicker{font-size:10px;font-weight:780;letter-spacing:.02em}',
    '.signatureStatus{font-size:14.4px;font-weight:800;letter-spacing:-.01em}',
    '.signatureMeta{font-size:10px;font-weight:650}',
    '.signatureFooter{font-size:10px;font-weight:680;letter-spacing:.02em}',
    '.signatureAvatarInitials{font-size:17px;font-weight:850}',
    '</style>',
    `<defs>${defs.join('')}</defs>`,
    ...nodes,
    '</svg>',
  ].join('')
}

export function renderStatusCardSvg({
  options,
  profile,
  activity,
  avatarDataUri,
  coverDataUri,
  backgroundDataUri,
  inClassStatusActive = false,
  inClassOccurrence,
  statusPageUrl,
  state,
}: {
  options: StatusCardOptions
  profile: StatusCardProfile
  activity: ActivityFeedItem | null
  avatarDataUri?: string | null
  coverDataUri?: string | null
  backgroundDataUri?: string | null
  inClassStatusActive?: boolean
  inClassOccurrence?: ScheduleOccurrence | null
  statusPageUrl: string
  state: StatusCardState
}): string {
  const resolvedDimensions = resolveStatusCardAutoDimensions(
    options,
    profile,
    activity,
    state,
    inClassStatusActive,
    inClassOccurrence,
  )
  const resolvedOptions: StatusCardOptions = {
    ...options,
    width: resolvedDimensions.width,
    height: resolvedDimensions.height,
    widthAuto: false,
    heightAuto: false,
  }

  if (resolvedOptions.variant === 'signature') {
    return renderSignatureStatusCardSvg({
      options: resolvedOptions,
      profile,
      activity,
      avatarDataUri,
      backgroundDataUri,
      inClassStatusActive,
      inClassOccurrence,
      statusPageUrl,
      state,
    })
  }

  if (resolvedOptions.variant === 'cover') {
    return renderCoverStatusCardSvg({
      options: resolvedOptions,
      profile,
      activity,
      avatarDataUri,
      coverDataUri,
      inClassStatusActive,
      inClassOccurrence,
      statusPageUrl,
      state,
    })
  }

  if (resolvedOptions.variant === 'aurora') {
    return renderAuroraStatusCardSvg({
      options: resolvedOptions,
      profile,
      activity,
      avatarDataUri,
      inClassStatusActive,
      inClassOccurrence,
      statusPageUrl,
      state,
    })
  }

  const width = resolvedOptions.width
  let height = resolvedOptions.height
  const padding = 24
  const innerWidth = width - padding * 2
  const headerEnabled = options.showHeader
  const avatarSize = 54
  const avatarX = padding
  const avatarY = padding
  const headerTextX = options.showAvatar ? avatarX + avatarSize + 14 : padding
  const textMaxChars = Math.max(18, Math.floor((width - headerTextX - padding) / 8))
  const fullTextMaxChars = Math.max(18, Math.floor(innerWidth / 8))
  const defs: string[] = [
    '<filter id="classicCardShadow" x="-6%" y="-8%" width="112%" height="116%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#0F172A" flood-opacity="0.16"/></filter>',
    '<filter id="classicInsetShadow" x="-8%" y="-16%" width="116%" height="132%"><feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#0F172A" flood-opacity="0.11"/></filter>',
  ]
  const nodes: string[] = []
  let headerBottom = headerEnabled ? avatarY + avatarSize : padding

  if (headerEnabled) {
    if (options.showAvatar) {
      defs.push(
        `<clipPath id="avatarClip"><circle cx="${avatarX + avatarSize / 2}" cy="${avatarY + avatarSize / 2}" r="${avatarSize / 2}"/></clipPath>`,
      )
      nodes.push(
        `<circle cx="${avatarX + avatarSize / 2}" cy="${avatarY + avatarSize / 2}" r="${avatarSize / 2}" fill="${options.accent}" opacity="0.14"/>`,
      )
      if (avatarDataUri) {
        nodes.push(
          `<image href="${escapeAttr(avatarDataUri)}" x="${avatarX}" y="${avatarY}" width="${avatarSize}" height="${avatarSize}" preserveAspectRatio="xMidYMid slice" clip-path="url(#avatarClip)"/>`,
        )
      } else {
        nodes.push(
          `<text x="${avatarX + avatarSize / 2}" y="${avatarY + 35}" fill="${options.accent}" class="avatarInitials" text-anchor="middle">${escapeXml(getInitials(profile.name))}</text>`,
        )
      }
      nodes.push(
        `<circle cx="${avatarX + avatarSize - 7}" cy="${avatarY + avatarSize - 7}" r="6" fill="${state === 'active' ? options.accent : options.muted}" stroke="${options.bg}" stroke-width="3"/>`,
      )
    }

    let headerY = avatarY + 17
    let headerTextBottom = avatarY
    if (options.showName) {
      nodes.push(textElement({
        x: headerTextX,
        y: headerY,
        fill: options.fg,
        className: 'name',
        text: truncateText(profile.name || 'Waken', textMaxChars),
      }))
      headerY += 19
      headerTextBottom = headerY - 5
    }
    if (options.showBio && profile.bio) {
      nodes.push(textElement({
        x: headerTextX,
        y: headerY,
        fill: options.muted,
        className: 'bio',
        text: truncateText(profile.bio, textMaxChars),
      }))
      headerY += 18
      headerTextBottom = headerY - 5
    }
    headerBottom = Math.max(headerBottom, headerTextBottom)

    if (options.showNote && profile.note) {
      const noteLineHeight = 17
      const noteLines = wrapTextLines(profile.note, Math.max(24, Math.floor(innerWidth / 7)), 2)
      const noteY = options.showAvatar
        ? Math.max(headerBottom + 16, avatarY + avatarSize + 16)
        : headerBottom + 14
      nodes.push(multilineTextElement({
        x: padding,
        y: noteY,
        fill: options.muted,
        className: 'note',
        lines: noteLines,
        lineHeight: noteLineHeight,
      }))
      headerBottom = noteY + (noteLines.length - 1) * noteLineHeight + 4
    }
  }

  const contentTop = headerEnabled ? headerBottom + 34 : padding + 8
  const steamLine = state === 'active' ? getSteamGameName(activity) : ''
  const appLine = state === 'active' ? getStatusLine(activity) : ''
  const shouldPrioritizeGame = Boolean(options.preferGame && steamLine)
  const shouldUseInClassStatus = Boolean(
    inClassStatusActive &&
    options.showInClassStatus &&
    state === 'active',
  )
  const statusLine = state === 'locked'
    ? 'Status locked'
    : state === 'disabled'
      ? 'Status card disabled'
    : state === 'empty'
      ? 'No active status'
      : shouldUseInClassStatus
        ? getInClassStatusLine(inClassOccurrence)
      : shouldPrioritizeGame
        ? steamLine
        : appLine
  const deviceLine = state === 'active' && activity
    ? shouldPrioritizeGame
      ? `Steam · ${getTrimmedText(activity.device, 'Unknown device')}`
      : getTrimmedText(activity.device, 'Unknown device')
    : state === 'locked'
      ? 'Unlock the site to view this card'
      : state === 'disabled'
        ? 'Enable the status card in admin settings'
      : 'Waiting for the next activity report'
  const mediaLine = state === 'active' ? getMediaLine(activity) : ''
  const footerText = DEFAULT_FOOTER_TEXT
  const sectionTitle = truncateText(profile.currentlyText || '当前状态', fullTextMaxChars)
  const detailRows: StatusCardDetailRow[] = []
  if (mediaLine) {
    detailRows.push({ label: '', value: mediaLine, icon: 'music' })
  }
  if (steamLine && !shouldPrioritizeGame) {
    detailRows.push({ label: 'Playing', value: steamLine, icon: 'gamepad' })
  }
  const detailLayouts = detailRows.map((row) => {
    const labelWidth = row.label.length > 0
      ? Math.min(94, Math.max(60, row.label.length * 7 + 36))
      : 0
    const valueWidth = Math.max(40, innerWidth - labelWidth - (row.label.length > 0 ? 26 : 48))
    const maxUnits = Math.max(12, Math.floor(valueWidth / 8))
    return {
      row,
      valueLines: [truncateTextByUnits(row.value, maxUnits)],
      height: 32,
    }
  })
  const reservedFooterHeight = footerText ? 34 : 0
  const sectionTitleText = state === 'locked'
    ? 'PRIVATE STATUS'
    : state === 'disabled'
      ? 'STATUS CARD'
      : sectionTitle
  const sectionTitleY = contentTop
  const showDeviceSection = state === 'active' && Boolean(deviceLine)
  const deviceCardY = sectionTitleY + 14
  const deviceCardHeight = 38
  const statusCardY = showDeviceSection
    ? deviceCardY + deviceCardHeight + 8
    : sectionTitleY + 14
  const statusIcon = shouldUseInClassStatus
    ? 'bookOpen'
    : shouldPrioritizeGame
    ? 'gamepad'
    : getStatusIcon(state, activity, statusLine) ?? (state === 'active' ? 'app' : null)
  const deviceIcon = state === 'active'
    ? getDeviceType(deviceLine, activity?.metadata)
    : 'desktop'
  const statusDeviceLine = truncateText(deviceLine, fullTextMaxChars)
  const statusTextX = statusIcon ? padding + 42 : padding + 14
  const statusTextWidth = statusIcon ? innerWidth - 58 : innerWidth - 28
  const statusLineMaxUnits = Math.max(16, Math.floor(statusTextWidth / 8.8))
  const statusLines = [truncateTextByUnits(statusLine, statusLineMaxUnits)]
  const statusLineHeight = 18
  const statusCardHeight = 58
  const statusLabelY = showDeviceSection ? deviceCardY - 8 : statusCardY - 8
  const statusTextY = statusCardY + 31
  const statusIconY = statusTextY + ((statusLines.length - 1) * statusLineHeight) / 2 - 10
  const detailRowsHeight = detailLayouts.length > 0
    ? 16 + detailLayouts.reduce((total, item) => total + item.height + 8, 0)
    : 0
  const requiredContentBottom = statusCardY + statusCardHeight + detailRowsHeight
  height = Math.max(height, requiredContentBottom + reservedFooterHeight + padding)
  const contentBottom = height - padding
  const detailsBottom = contentBottom - reservedFooterHeight

  nodes.push(
    `<line x1="${padding}" y1="${contentTop - 22}" x2="${width - padding}" y2="${contentTop - 22}" stroke="${options.border}" stroke-width="1.2" opacity="${headerEnabled ? '0.72' : '0'}"/>`,
  )

  if (showDeviceSection) {
    nodes.push(roundedRectElement({
      x: padding,
      y: deviceCardY,
      width: innerWidth,
      height: deviceCardHeight,
      radius: 12,
      fill: options.bg,
      stroke: options.border,
      opacity: 0.74,
      strokeOpacity: 0.62,
    }))
    nodes.push(iconElement({
      type: deviceIcon,
      x: padding + 12,
      y: deviceCardY + 11,
      size: 16,
      stroke: options.muted,
      opacity: 0.72,
    }))
    nodes.push(textElement({
      x: padding + 36,
      y: deviceCardY + 25,
      fill: options.muted,
      className: 'deviceLine',
      text: statusDeviceLine,
    }))
  }

  nodes.push(roundedRectElement({
    x: padding,
    y: statusCardY,
    width: innerWidth,
    height: statusCardHeight,
    radius: 14,
    fill: options.accent,
    stroke: options.accent,
    opacity: 0.075,
    strokeOpacity: 0.36,
  }))
  nodes.push(
    `<rect x="${padding + 0.5}" y="${statusCardY + 0.5}" width="${innerWidth - 1}" height="${statusCardHeight - 1}" rx="13.5" fill="none" stroke="#0F172A" stroke-opacity="0.11" filter="url(#classicInsetShadow)"/>`,
  )
  nodes.push(
    `<rect x="${padding}" y="${statusCardY + 9}" width="3.5" height="${statusCardHeight - 18}" rx="1.75" fill="${options.accent}" opacity="0.82"/>`,
  )
  nodes.push(
    `<circle cx="${padding + 24}" cy="${statusTextY - 2}" r="16" fill="${options.accent}" opacity="${statusIcon ? '0.1' : '0'}"/>`,
  )
  nodes.push(textElement({
    x: padding + 2,
    y: statusLabelY,
    fill: options.muted,
    className: 'sectionLabel',
    text: sectionTitleText,
  }))
  if (statusIcon) {
    nodes.push(iconElement({
      type: statusIcon,
      x: padding + 15,
      y: statusIconY,
      size: 19,
      stroke: options.accent,
      opacity: 0.88,
    }))
  }
  nodes.push(
    `<text x="${statusTextX}" y="${statusTextY}" fill="${options.fg}" class="status" dominant-baseline="middle">${escapeXml(statusLines[0])}</text>`,
  )

  let detailY = statusCardY + statusCardHeight + 16
  for (const layout of detailLayouts) {
    if (detailY + layout.height > detailsBottom) break
    nodes.push(...detailPillElement({
      x: padding,
      y: detailY,
      width: innerWidth,
      height: layout.height,
      options,
      row: layout.row,
      valueLines: layout.valueLines,
    }))
    detailY += layout.height + 8
  }

  if (footerText && contentBottom - 4 > contentTop + 64) {
    nodes.push(
      `<line x1="${padding}" y1="${contentBottom - 18}" x2="${width - padding}" y2="${contentBottom - 18}" stroke="${options.border}" stroke-width="1.1" opacity="0.66"/>`,
    )
    nodes.push(linkElement(
      statusPageUrl,
      textElement({
        x: padding,
        y: contentBottom + 1,
        fill: options.muted,
        className: 'footer',
        text: truncateText(footerText, fullTextMaxChars),
      }),
    ))
  }

  const ariaLabel = state === 'active'
    ? `${profile.currentlyText || '当前状态'}: ${statusLine}${steamLine ? `. Playing: ${steamLine}` : ''}${mediaLine ? `. Listening: ${mediaLine}` : ''}`
    : statusLine

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttr(ariaLabel)}">`,
    '<style>',
    'text{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;letter-spacing:0}',
    '.sectionLabel{font-size:12px;font-weight:760}',
    '.subLabel,.pillLabel{font-size:11px;font-weight:650}',
    '.status{font-size:15px;font-weight:720;letter-spacing:-.01em}',
    '.pillValue{font-size:13px;font-weight:600}',
    '.deviceLine{font-size:13px;font-weight:600}',
    '.meta,.bio,.note{font-size:13px;font-weight:500}',
    '.footer{font-size:11px;font-weight:600}',
    '.name{font-size:17px;font-weight:700}',
    '.avatarInitials{font-size:17px;font-weight:800}',
    '</style>',
    defs.length ? `<defs>${defs.join('')}</defs>` : '',
    `<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${options.radius}" fill="${options.bg}" stroke="${options.border}" stroke-width="1.35" filter="url(#classicCardShadow)"/>`,
    `<rect x="4.5" y="4.5" width="${width - 9}" height="${height - 9}" rx="${Math.max(0, options.radius - 5)}" fill="none" stroke="#0F172A" stroke-opacity="0.13"/>`,
    `<rect x="1" y="1" width="${width - 2}" height="${Math.max(0, height * 0.45)}" rx="${Math.max(0, options.radius - 1)}" fill="${options.accent}" opacity="0.04"/>`,
    ...nodes,
    '</svg>',
  ].join('')
}
