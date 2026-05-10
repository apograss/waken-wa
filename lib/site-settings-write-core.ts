import 'server-only'

import { eq } from 'drizzle-orm'

import {
  SITE_SETTINGS_RULES_KEYS,
  SITE_SETTINGS_SCHEDULE_CATEGORY_KEYS,
  SITE_SETTINGS_SITE_CONFIG_ID,
  SITE_SETTINGS_THEME_CATEGORY_KEYS,
} from '@/constants/site-settings'
import { siteConfigV2Entries } from '@/lib/drizzle-schema'
import {
  pickSiteConfigBodyFields,
  upsertSiteConfigV2Entries,
} from '@/lib/site-config-v2'
import { omitRecordKeys } from '@/lib/site-settings-record'
import type { SiteSettingsRecord } from '@/types/site-settings'

function PickCoreSiteConfigValues(values: SiteSettingsRecord): SiteSettingsRecord {
  return omitRecordKeys(pickSiteConfigBodyFields(values), [
    ...SITE_SETTINGS_THEME_CATEGORY_KEYS,
    ...SITE_SETTINGS_SCHEDULE_CATEGORY_KEYS,
    ...SITE_SETTINGS_RULES_KEYS,
  ])
}

export async function ReplaceSiteConfigCoreEntries(
  executor: any,
  values: SiteSettingsRecord,
): Promise<void> {
  await executor
    .delete(siteConfigV2Entries)
    .where(eq(siteConfigV2Entries.siteConfigId, SITE_SETTINGS_SITE_CONFIG_ID))

  const coreValues = PickCoreSiteConfigValues(values)
  if (Object.keys(coreValues).length > 0) {
    await upsertSiteConfigV2Entries(coreValues, executor)
  }
}
