import 'server-only'

import { eq } from 'drizzle-orm'

import { SITE_SETTINGS_SITE_CONFIG_ID } from '@/constants/site-settings'
import {
  SITE_SETTINGS_THEME_CUSTOM_SURFACE_BOOLEAN_KEYS,
  SITE_SETTINGS_THEME_CUSTOM_SURFACE_STRING_KEYS,
  SITE_SETTINGS_THEME_SCALAR_KEYS,
} from '@/constants/site-settings-storage'
import {
  siteSettingsV2ThemeCustomSurface,
  siteSettingsV2ThemeCustomSurfaceImagePool,
  siteSettingsV2ThemePublicFontOptions,
} from '@/lib/drizzle-schema'
import { normalizePublicPageFontOptions } from '@/lib/public-page-font'
import { omitRecordKeys } from '@/lib/site-settings-record'
import {
  BuildSiteSettingsScalarEntryRows,
  ReplaceSiteSettingsScalarEntries,
} from '@/lib/site-settings-write-entries'
import { NormalizeSiteSettingsStringOrNull } from '@/lib/site-settings-write-utils'
import { sqlTimestamp } from '@/lib/sql-timestamp'
import { parseThemeCustomSurface } from '@/lib/theme-custom-surface'
import type { SiteSettingsRecord } from '@/types/site-settings'

function BuildThemeCustomSurfaceRow(rawSurface: unknown): {
  row: SiteSettingsRecord | null
  imagePoolRows: SiteSettingsRecord[]
} {
  const surface = parseThemeCustomSurface(rawSurface)
  const now = sqlTimestamp()
  const row: SiteSettingsRecord = {
    siteConfigId: SITE_SETTINGS_SITE_CONFIG_ID,
    createdAt: now,
    updatedAt: now,
  }
  let hasRowValue = false

  for (const key of SITE_SETTINGS_THEME_CUSTOM_SURFACE_STRING_KEYS) {
    const value = NormalizeSiteSettingsStringOrNull(surface[key])
    row[key] = value
    if (value !== null) {
      hasRowValue = true
    }
  }

  for (const key of SITE_SETTINGS_THEME_CUSTOM_SURFACE_BOOLEAN_KEYS) {
    const value = typeof surface[key] === 'boolean' ? surface[key] : null
    row[key] = value
    if (value !== null) {
      hasRowValue = true
    }
  }

  const imagePool = Array.isArray(surface.backgroundImagePool)
    ? surface.backgroundImagePool.map((item) => String(item ?? '')).filter((item) => item.length > 0)
    : []

  const imagePoolRows = imagePool.map((imageUrl, position) => ({
    siteConfigId: SITE_SETTINGS_SITE_CONFIG_ID,
    imageUrl,
    position,
    createdAt: now,
    updatedAt: now,
  }))

  if (imagePoolRows.length > 0) {
    hasRowValue = true
  }

  return {
    row: hasRowValue ? row : null,
    imagePoolRows,
  }
}

export async function ReplaceThemeSettingsRows(
  executor: any,
  values: SiteSettingsRecord,
): Promise<void> {
  await ReplaceSiteSettingsScalarEntries(
    executor,
    'theme',
    BuildSiteSettingsScalarEntryRows('theme', values, SITE_SETTINGS_THEME_SCALAR_KEYS),
  )

  const { row, imagePoolRows } = BuildThemeCustomSurfaceRow(values.themeCustomSurface)

  await executor
    .delete(siteSettingsV2ThemeCustomSurfaceImagePool)
    .where(
      eq(siteSettingsV2ThemeCustomSurfaceImagePool.siteConfigId, SITE_SETTINGS_SITE_CONFIG_ID),
    )

  if (imagePoolRows.length > 0) {
    await executor.insert(siteSettingsV2ThemeCustomSurfaceImagePool).values(imagePoolRows as never)
  }

  if (!row) {
    await executor
      .delete(siteSettingsV2ThemeCustomSurface)
      .where(eq(siteSettingsV2ThemeCustomSurface.siteConfigId, SITE_SETTINGS_SITE_CONFIG_ID))
  } else {
    await executor
      .insert(siteSettingsV2ThemeCustomSurface)
      .values(row as never)
      .onConflictDoUpdate({
        target: siteSettingsV2ThemeCustomSurface.siteConfigId,
        set: {
          ...omitRecordKeys(row, ['siteConfigId', 'createdAt']),
          updatedAt: row.updatedAt,
        } as never,
      })
  }

  await executor
    .delete(siteSettingsV2ThemePublicFontOptions)
    .where(eq(siteSettingsV2ThemePublicFontOptions.siteConfigId, SITE_SETTINGS_SITE_CONFIG_ID))

  const publicFontOptions = normalizePublicPageFontOptions(values.publicFontOptions)
  if (publicFontOptions.length > 0) {
    const now = sqlTimestamp()
    await executor.insert(siteSettingsV2ThemePublicFontOptions).values(
      publicFontOptions.map((option, position) => ({
        siteConfigId: SITE_SETTINGS_SITE_CONFIG_ID,
        mode: option.mode,
        label: option.label,
        family: option.family,
        url: option.url ?? null,
        position,
        createdAt: now,
        updatedAt: now,
      })) as never,
    )
  }
}
