import { getAvatarProxyUrl, getConfiguredAvatarProxyUrl, isRemoteAvatarUrl } from '@/lib/avatar-url'
import { isDataSiteIconUrl, SITE_ICON_API_PATH } from '@/lib/site-icon'
import { parseThemeCustomSurface } from '@/lib/theme-custom-surface'

const THEME_IMAGE_ROUTE_PREFIX = '/api/theme/image/'

export type ThemeImageKind = 'background' | 'pool' | 'palette-seed'

function isDataImageUrl(value: unknown): value is string {
  return typeof value === 'string' && /^data:image\//i.test(value.trim())
}

function toTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function getAdminAvatarProxyUrl(rawUrl: string): string {
  return getAvatarProxyUrl(rawUrl)
}

export function getAvatarClientFacingUrl(
  rawUrl: unknown,
  fetchByServer?: boolean | null,
  mode: 'public' | 'admin' = 'public',
): string {
  const normalized = toTrimmedString(rawUrl)
  if (!normalized) return ''

  if (isDataImageUrl(normalized)) {
    return SITE_IMAGE_URLS.avatar
  }

  if (fetchByServer && isRemoteAvatarUrl(normalized)) {
    return mode === 'admin' ? normalized : getConfiguredAvatarProxyUrl()
  }

  return normalized
}

export function getSiteIconClientFacingUrl(rawUrl: unknown): string | null {
  const normalized = toTrimmedString(rawUrl)
  if (!normalized) return null
  return isDataSiteIconUrl(normalized) ? SITE_ICON_API_PATH : normalized
}

export function buildThemeImageUrl(kind: ThemeImageKind, index?: number): string {
  if (kind === 'pool') {
    const safeIndex = Number.isFinite(index) && typeof index === 'number' && index >= 0 ? index : 0
    return `${THEME_IMAGE_ROUTE_PREFIX}${kind}/${safeIndex}`
  }
  return `${THEME_IMAGE_ROUTE_PREFIX}${kind}`
}

export function readThemeImageSourceByKind(
  rawThemeCustomSurface: unknown,
  kind: ThemeImageKind,
  index?: number,
): string {
  const parsed = parseThemeCustomSurface(rawThemeCustomSurface)
  if (kind === 'background') {
    return toTrimmedString(parsed.backgroundImageUrl)
  }
  if (kind === 'palette-seed') {
    return toTrimmedString(parsed.paletteSeedImageUrl)
  }
  const pool = Array.isArray(parsed.backgroundImagePool) ? parsed.backgroundImagePool : []
  const safeIndex = Number.isFinite(index) && typeof index === 'number' ? Math.trunc(index) : 0
  return toTrimmedString(pool[safeIndex])
}

export function getThemeImageClientFacingUrl(
  rawThemeCustomSurface: unknown,
  kind: ThemeImageKind,
  index?: number,
): string {
  const source = readThemeImageSourceByKind(rawThemeCustomSurface, kind, index)
  if (!source) return ''
  return isDataImageUrl(source) ? buildThemeImageUrl(kind, index) : source
}

export function sanitizeThemeCustomSurfaceForClient(
  rawThemeCustomSurface: unknown,
): Record<string, unknown> {
  const parsed = parseThemeCustomSurface(rawThemeCustomSurface)
  const pool = Array.isArray(parsed.backgroundImagePool) ? parsed.backgroundImagePool : []

  return {
    ...parsed,
    backgroundImageUrl: getThemeImageClientFacingUrl(parsed, 'background'),
    backgroundImagePool: pool.map((_, index) => getThemeImageClientFacingUrl(parsed, 'pool', index)),
    paletteSeedImageUrl: getThemeImageClientFacingUrl(parsed, 'palette-seed'),
  }
}

export function unsanitizeThemeImageInput(
  input: unknown,
  existingThemeCustomSurface: unknown,
  kind: ThemeImageKind,
  index?: number,
): string {
  const raw = toTrimmedString(input)
  if (!raw) return ''
  if (raw === buildThemeImageUrl(kind, index)) {
    return readThemeImageSourceByKind(existingThemeCustomSurface, kind, index)
  }
  return raw
}

export function unsanitizeThemeCustomSurfaceInput(
  input: unknown,
  existingThemeCustomSurface: unknown,
): unknown {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return input
  }

  const next = { ...(input as Record<string, unknown>) }
  if ('backgroundImageUrl' in next) {
    next.backgroundImageUrl = unsanitizeThemeImageInput(
      next.backgroundImageUrl,
      existingThemeCustomSurface,
      'background',
    )
  }
  if ('paletteSeedImageUrl' in next) {
    next.paletteSeedImageUrl = unsanitizeThemeImageInput(
      next.paletteSeedImageUrl,
      existingThemeCustomSurface,
      'palette-seed',
    )
  }
  if (Array.isArray(next.backgroundImagePool)) {
    next.backgroundImagePool = next.backgroundImagePool.map((value, index) =>
      unsanitizeThemeImageInput(value, existingThemeCustomSurface, 'pool', index),
    )
  }
  return next
}

export function sanitizeSiteConfigImagesForClient(
  config: Record<string, unknown>,
  mode: 'public' | 'admin' = 'public',
): Record<string, unknown> {
  const next = { ...config }

  if ('siteIconUrl' in config) {
    next.siteIconUrl = getSiteIconClientFacingUrl(config.siteIconUrl)
  }
  if ('avatarUrl' in config) {
    next.avatarUrl = getAvatarClientFacingUrl(
      config.avatarUrl,
      config.avatarFetchByServerEnabled === true,
      mode,
    )
  }

  if ('themeCustomSurface' in config) {
    next.themeCustomSurface = sanitizeThemeCustomSurfaceForClient(config.themeCustomSurface)
  }

  return next
}

export function unsanitizeSiteConfigImageInputs(
  body: Record<string, unknown>,
  existing: Record<string, unknown> | null,
): Record<string, unknown> {
  const next = { ...body }

  if (next.siteIconUrl === SITE_ICON_API_PATH) {
    next.siteIconUrl = existing?.siteIconUrl ?? ''
  }

  if ('avatarUrl' in next) {
    const avatarInput = toTrimmedString(next.avatarUrl)
    if (avatarInput === SITE_IMAGE_URLS.avatar) {
      next.avatarUrl = existing?.avatarUrl ?? ''
    } else if (
      avatarInput &&
      avatarInput === getConfiguredAvatarProxyUrl() &&
      typeof existing?.avatarUrl === 'string'
    ) {
      next.avatarUrl = existing.avatarUrl
    } else if (
      avatarInput &&
      typeof existing?.avatarUrl === 'string' &&
      avatarInput === getAdminAvatarProxyUrl(existing.avatarUrl)
    ) {
      next.avatarUrl = existing.avatarUrl
    }
  }

  if ('themeCustomSurface' in next) {
    next.themeCustomSurface = unsanitizeThemeCustomSurfaceInput(
      next.themeCustomSurface,
      existing?.themeCustomSurface,
    )
  }

  return next
}

export const SITE_IMAGE_URLS = {
  avatar: '/api/avatar',
} as const
