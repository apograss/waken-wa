import 'server-only'

import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { getMediaDisplay } from '@/lib/activity-media'
import { isRemoteAvatarUrl } from '@/lib/avatar-url'
import {
  extractImageSourcePublicKey,
  readImageSourceDataUrl,
} from '@/lib/image-source-store'
import { decodeInlineImageDataUrl } from '@/lib/inline-image-data'
import { normalizeProfileOnlineAccentColor } from '@/lib/profile-online-accent-color'
import type { ActivityFeedData, ActivityFeedItem } from '@/types/activity'

const DEFAULT_WIDTH = 520
const DEFAULT_STATUS_HEIGHT = 180
const DEFAULT_HEADER_HEIGHT = 310
const DEFAULT_RADIUS = 20
const DEFAULT_FOOTER_TEXT = 'Powered By Waken-Wa✨'
const AVATAR_MAX_BYTES = 512 * 1024
const AVATAR_FETCH_TIMEOUT_MS = 2500

type StatusCardState = 'active' | 'empty' | 'locked' | 'disabled'
type StatusCardIcon =
  | 'app'
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
  width: number
  height: number
  radius: number
  bg: string
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
  const showHeader = parseBooleanParam(searchParams, 'showHeader', false)
  const defaultAccent =
    normalizeHexColor(searchParams.get('accent')) ??
    normalizeProfileOnlineAccentColor(config?.profileOnlineAccentColor) ??
    '#22C55E'
  const width = parseIntegerParam(searchParams, 'width', DEFAULT_WIDTH, 280, 1200)
  const height = parseIntegerParam(
    searchParams,
    'height',
    showHeader ? DEFAULT_HEADER_HEIGHT : DEFAULT_STATUS_HEIGHT,
    1,
    720,
  )
  const deviceIdRaw = searchParams.get('deviceId')
  const deviceId = deviceIdRaw == null || deviceIdRaw.trim() === ''
    ? null
    : Number(deviceIdRaw)

  return {
    width,
    height,
    radius: parseIntegerParam(searchParams, 'radius', DEFAULT_RADIUS, 0, 80),
    bg: parseColorParam(searchParams, 'bg', '#FFFFFF'),
    fg: parseColorParam(searchParams, 'fg', '#111827'),
    muted: parseColorParam(searchParams, 'muted', '#6B7280'),
    accent: parseColorParam(searchParams, 'accent', defaultAccent),
    border: parseColorParam(searchParams, 'border', '#E5E7EB'),
    showHeader,
    showAvatar: showHeader && parseBooleanParam(searchParams, 'showAvatar', true),
    showName: showHeader && parseBooleanParam(searchParams, 'showName', true),
    showBio: showHeader && parseBooleanParam(searchParams, 'showBio', true),
    showNote: showHeader && parseBooleanParam(searchParams, 'showNote', false),
    preferGame: parseBooleanParam(searchParams, 'preferGame', false),
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
  anchor?: 'start' | 'middle'
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

function multilineTextElement({
  x,
  y,
  fill,
  className,
  lines,
  lineHeight,
  dominantBaseline,
}: {
  x: number
  y: number
  fill: string
  className: string
  lines: string[]
  lineHeight: number
  dominantBaseline?: 'middle'
}): string {
  const tspans = lines
    .map((line, index) => (
      `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`
    ))
    .join('')
  const baselineAttr = dominantBaseline ? ` dominant-baseline="${dominantBaseline}"` : ''
  return `<text x="${x}" y="${y}" fill="${fill}" class="${className}"${baselineAttr}>${tspans}</text>`
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
      radius: 8,
      fill: options.muted,
      stroke: options.border,
      opacity: 0.09,
      strokeOpacity: 0.55,
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

export function renderStatusCardSvg({
  options,
  profile,
  activity,
  avatarDataUri,
  statusPageUrl,
  state,
}: {
  options: StatusCardOptions
  profile: StatusCardProfile
  activity: ActivityFeedItem | null
  avatarDataUri?: string | null
  statusPageUrl: string
  state: StatusCardState
}): string {
  const width = options.width
  let height = options.height
  const padding = 24
  const innerWidth = width - padding * 2
  const headerEnabled = options.showHeader
  const avatarSize = 54
  const avatarX = padding
  const avatarY = padding
  const headerTextX = options.showAvatar ? avatarX + avatarSize + 14 : padding
  const textMaxChars = Math.max(18, Math.floor((width - headerTextX - padding) / 8))
  const fullTextMaxChars = Math.max(18, Math.floor(innerWidth / 8))
  const defs: string[] = []
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

  const contentTop = headerEnabled ? headerBottom + 18 : padding + 8
  const steamLine = state === 'active' ? getSteamGameName(activity) : ''
  const appLine = state === 'active' ? getStatusLine(activity) : ''
  const shouldPrioritizeGame = Boolean(options.preferGame && steamLine)
  const statusLine = state === 'locked'
    ? 'Status locked'
    : state === 'disabled'
      ? 'Status card disabled'
    : state === 'empty'
      ? 'No active status'
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
  const deviceCardHeight = 36
  const statusCardY = showDeviceSection
    ? deviceCardY + deviceCardHeight + 10
    : sectionTitleY + 14
  const statusIcon = shouldPrioritizeGame
    ? 'gamepad'
    : getStatusIcon(state, activity, statusLine) ?? (state === 'active' ? 'app' : null)
  const deviceIcon = state === 'active'
    ? getDeviceType(deviceLine, activity?.metadata)
    : 'desktop'
  const statusDeviceLine = truncateText(deviceLine, fullTextMaxChars)
  const statusTextX = statusIcon ? padding + 36 : padding + 12
  const statusTextWidth = statusIcon ? innerWidth - 48 : innerWidth - 24
  const statusLineMaxUnits = Math.max(16, Math.floor(statusTextWidth / 9))
  const statusLines = [truncateTextByUnits(statusLine, statusLineMaxUnits)]
  const statusLineHeight = 18
  const statusCardHeight = 48
  const statusTextY = statusCardY + statusCardHeight / 2 + 2
  const statusIconY = statusTextY + ((statusLines.length - 1) * statusLineHeight) / 2 - 8
  const detailRowsHeight = detailLayouts.length > 0
    ? 16 + detailLayouts.reduce((total, item) => total + item.height + 8, 0)
    : 0
  const requiredContentBottom = statusCardY + statusCardHeight + detailRowsHeight
  height = Math.max(height, requiredContentBottom + reservedFooterHeight + padding)
  const contentBottom = height - padding
  const detailsBottom = contentBottom - reservedFooterHeight

  nodes.push(
    `<line x1="${padding}" y1="${contentTop - 18}" x2="${width - padding}" y2="${contentTop - 18}" stroke="${options.border}" stroke-width="1" opacity="${headerEnabled ? '1' : '0'}"/>`,
  )

  nodes.push(textElement({
    x: padding,
    y: sectionTitleY,
    fill: options.fg,
    className: 'sectionLabel',
    text: sectionTitleText,
  }))

  if (showDeviceSection) {
    nodes.push(roundedRectElement({
      x: padding,
      y: deviceCardY,
      width: innerWidth,
      height: deviceCardHeight,
      radius: 8,
      fill: options.muted,
      stroke: options.border,
      opacity: 0.09,
      strokeOpacity: 0.5,
    }))
    nodes.push(iconElement({
      type: deviceIcon,
      x: padding + 12,
      y: deviceCardY + 10,
      size: 16,
      stroke: options.muted,
      opacity: 0.72,
    }))
    nodes.push(textElement({
      x: padding + 36,
      y: deviceCardY + 24,
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
    radius: 8,
    fill: options.muted,
    stroke: options.border,
    opacity: 0.12,
    strokeOpacity: 0.55,
  }))
  if (statusIcon) {
    nodes.push(iconElement({
      type: statusIcon,
      x: padding + 12,
      y: statusIconY,
      size: 16,
      stroke: options.accent,
      opacity: 0.82,
    }))
  }
  nodes.push(multilineTextElement({
    x: statusTextX,
    y: statusTextY,
    fill: options.fg,
    className: 'status',
    lines: statusLines,
    lineHeight: statusLineHeight,
    dominantBaseline: 'middle',
  }))

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
      `<line x1="${padding}" y1="${contentBottom - 18}" x2="${width - padding}" y2="${contentBottom - 18}" stroke="${options.border}" stroke-width="1" opacity="0.75"/>`,
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
    '.status{font-size:14px;font-weight:680}',
    '.pillValue{font-size:13px;font-weight:600}',
    '.deviceLine{font-size:13px;font-weight:600}',
    '.meta,.bio,.note{font-size:13px;font-weight:500}',
    '.footer{font-size:11px;font-weight:600}',
    '.name{font-size:17px;font-weight:700}',
    '.avatarInitials{font-size:17px;font-weight:800}',
    '</style>',
    defs.length ? `<defs>${defs.join('')}</defs>` : '',
    `<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${options.radius}" fill="${options.bg}" stroke="${options.border}"/>`,
    `<rect x="1" y="1" width="${width - 2}" height="${Math.max(0, height * 0.45)}" rx="${Math.max(0, options.radius - 1)}" fill="${options.accent}" opacity="0.04"/>`,
    ...nodes,
    '</svg>',
  ].join('')
}
