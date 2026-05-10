import 'server-only'

import { and, eq } from 'drizzle-orm'

import { SITE_SETTINGS_SITE_CONFIG_ID } from '@/constants/site-settings'
import {
  siteSettingsV2ListEntries,
  siteSettingsV2ValueEntries,
} from '@/lib/drizzle-schema'
import { normalizeMediaPlaySourceRules } from '@/lib/media-play-source-rules'
import { sqlTimestamp } from '@/lib/sql-timestamp'
import type {
  SiteSettingsManagedCategory,
  SiteSettingsRecord,
  SiteSettingsScalarValueKind,
} from '@/types/site-settings'

function NormalizeSiteSettingsScalarValue(
  value: unknown,
): {
  valueKind: SiteSettingsScalarValueKind
  stringValue?: string | null
  numberValue?: number | null
  booleanValue?: boolean | null
} | null {
  if (typeof value === 'string') {
    return {
      valueKind: 'string',
      stringValue: value,
      numberValue: null,
      booleanValue: null,
    }
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return {
      valueKind: 'number',
      stringValue: null,
      numberValue: value,
      booleanValue: null,
    }
  }
  if (typeof value === 'boolean') {
    return {
      valueKind: 'boolean',
      stringValue: null,
      numberValue: null,
      booleanValue: value,
    }
  }
  if (value instanceof Date) {
    return {
      valueKind: 'string',
      stringValue: value.toISOString(),
      numberValue: null,
      booleanValue: null,
    }
  }
  return null
}

export function BuildSiteSettingsScalarEntryRows(
  category: SiteSettingsManagedCategory,
  values: SiteSettingsRecord,
  keys: readonly string[],
): SiteSettingsRecord[] {
  const now = sqlTimestamp()
  const rows: SiteSettingsRecord[] = []

  for (const settingKey of keys) {
    if (!(settingKey in values)) continue
    const encoded = NormalizeSiteSettingsScalarValue(values[settingKey])
    if (!encoded) continue
    rows.push({
      siteConfigId: SITE_SETTINGS_SITE_CONFIG_ID,
      category,
      settingKey,
      ...encoded,
      createdAt: now,
      updatedAt: now,
    })
  }

  return rows
}

export async function ReplaceSiteSettingsScalarEntries(
  executor: any,
  category: SiteSettingsManagedCategory,
  rows: SiteSettingsRecord[],
): Promise<void> {
  await executor
    .delete(siteSettingsV2ValueEntries)
    .where(
      and(
        eq(siteSettingsV2ValueEntries.siteConfigId, SITE_SETTINGS_SITE_CONFIG_ID),
        eq(siteSettingsV2ValueEntries.category, category),
      ),
    )

  if (rows.length > 0) {
    await executor.insert(siteSettingsV2ValueEntries).values(rows as never)
  }
}

export function BuildSiteSettingsStringListEntryRows(
  category: SiteSettingsManagedCategory,
  settingKey: string,
  rawList: unknown,
): SiteSettingsRecord[] {
  if (!Array.isArray(rawList)) {
    return []
  }

  const now = sqlTimestamp()
  const normalizedItems =
    settingKey === 'mediaPlaySourceRules'
      ? normalizeMediaPlaySourceRules(rawList).map((item) => JSON.stringify(item))
      : rawList.map((item) => String(item ?? ''))

  return normalizedItems
    .filter((item) => item.length > 0)
    .map((itemValue, position) => ({
      siteConfigId: SITE_SETTINGS_SITE_CONFIG_ID,
      category,
      settingKey,
      itemValue,
      position,
      createdAt: now,
      updatedAt: now,
    }))
}

export async function ReplaceSiteSettingsStringListEntries(
  executor: any,
  category: SiteSettingsManagedCategory,
  rows: SiteSettingsRecord[],
): Promise<void> {
  await executor
    .delete(siteSettingsV2ListEntries)
    .where(
      and(
        eq(siteSettingsV2ListEntries.siteConfigId, SITE_SETTINGS_SITE_CONFIG_ID),
        eq(siteSettingsV2ListEntries.category, category),
      ),
    )

  if (rows.length > 0) {
    await executor.insert(siteSettingsV2ListEntries).values(rows as never)
  }
}
