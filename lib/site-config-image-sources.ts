import 'server-only'

import {
  isInlineImageDataUrl,
  upsertImageSourceFromDataUrl,
} from '@/lib/image-source-store'

type SiteConfigImageRecord = Record<string, unknown>

async function storeImageValue(value: unknown, usageKey: string): Promise<unknown> {
  return isInlineImageDataUrl(value)
    ? upsertImageSourceFromDataUrl(value, { usageKey })
    : value
}

async function storeThemeCustomSurfaceImages(value: unknown): Promise<unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return value
  }

  const next = { ...(value as SiteConfigImageRecord) }
  if ('backgroundImageUrl' in next) {
    next.backgroundImageUrl = await storeImageValue(
      next.backgroundImageUrl,
      'theme.background',
    )
  }
  if ('paletteSeedImageUrl' in next) {
    next.paletteSeedImageUrl = await storeImageValue(
      next.paletteSeedImageUrl,
      'theme.palette-seed',
    )
  }
  if (Array.isArray(next.backgroundImagePool)) {
    next.backgroundImagePool = await Promise.all(
      next.backgroundImagePool.map((item, index) =>
        storeImageValue(item, `theme.pool.${index}`),
      ),
    )
  }
  return next
}

export async function storeSiteConfigInlineImageSources(
  body: SiteConfigImageRecord,
): Promise<SiteConfigImageRecord> {
  const next = { ...body }

  if ('avatarUrl' in next) {
    next.avatarUrl = await storeImageValue(next.avatarUrl, 'site.avatar')
  }
  if ('siteIconUrl' in next) {
    next.siteIconUrl = await storeImageValue(next.siteIconUrl, 'site.icon')
  }
  if ('homepageCoverImage' in next) {
    next.homepageCoverImage = await storeImageValue(next.homepageCoverImage, 'homepage.cover')
  }
  if ('themeCustomSurface' in next) {
    next.themeCustomSurface = await storeThemeCustomSurfaceImages(next.themeCustomSurface)
  }

  return next
}
