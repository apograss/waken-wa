import { SITE_SETTINGS_MIGRATION_STATES } from '@/constants/site-settings'
import type { SiteSettingsMigrationState } from '@/types/site-settings'

export function isSiteSettingsMigrationState(
  value: unknown,
): value is SiteSettingsMigrationState {
  return (
    typeof value === 'string' &&
    (SITE_SETTINGS_MIGRATION_STATES as readonly string[]).includes(value)
  )
}

export function pickRecordKeys<T extends Record<string, unknown>>(
  source: T,
  keys: readonly string[],
): Record<string, unknown> {
  const next: Record<string, unknown> = {}
  for (const key of keys) {
    if (key in source) {
      next[key] = source[key]
    }
  }
  return next
}

export function omitRecordKeys<T extends Record<string, unknown>>(
  source: T,
  keys: readonly string[],
): Record<string, unknown> {
  const denied = new Set(keys)
  const next: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(source)) {
    if (denied.has(key)) continue
    next[key] = value
  }
  return next
}

export function hasAnyRecordKey(
  source: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  return keys.some((key) => key in source)
}
