import type {
  SITE_SETTINGS_COVERED_CATEGORIES,
  SITE_SETTINGS_MIGRATION_STATES,
} from '@/constants/site-settings'

export type SiteSettingsMigrationState =
  (typeof SITE_SETTINGS_MIGRATION_STATES)[number]

export type SiteSettingsCoveredCategory =
  (typeof SITE_SETTINGS_COVERED_CATEGORIES)[number]

export type SiteSettingsRecord = Record<string, unknown>

export type SiteSettingsManagedCategory = 'theme' | 'schedule' | 'rules'

export type SiteSettingsScalarValueKind = 'string' | 'number' | 'boolean'

export type SiteSettingsSectionSnapshot = {
  values: SiteSettingsRecord
  rowCount: number
}
