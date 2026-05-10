import {
  SITE_CONFIG_HISTORY_WINDOW_DEFAULT_MINUTES,
  SITE_CONFIG_HISTORY_WINDOW_MAX_MINUTES,
  SITE_CONFIG_HISTORY_WINDOW_MIN_MINUTES,
  SITE_CONFIG_PROCESS_STALE_DEFAULT_SECONDS,
  SITE_CONFIG_PROCESS_STALE_MAX_SECONDS,
  SITE_CONFIG_PROCESS_STALE_MIN_SECONDS,
} from '@/constants/site-config'

export function clampSiteConfigHistoryWindowMinutes(value: number): number {
  return Math.min(
    Math.max(Math.round(value), SITE_CONFIG_HISTORY_WINDOW_MIN_MINUTES),
    SITE_CONFIG_HISTORY_WINDOW_MAX_MINUTES,
  )
}

export function clampSiteConfigProcessStaleSeconds(value: number): number {
  return Math.min(
    Math.max(Math.round(value), SITE_CONFIG_PROCESS_STALE_MIN_SECONDS),
    SITE_CONFIG_PROCESS_STALE_MAX_SECONDS,
  )
}

export function parseIntegerInRangeForWrite(
  raw: unknown,
  min: number,
  max: number,
  fieldName: string,
): number {
  const text = String(raw ?? '').trim()
  const value = Number(text)
  if (!/^-?\d+$/.test(text) || !Number.isSafeInteger(value) || value < min || value > max) {
    const error = new Error(`${fieldName} must be an integer between ${min} and ${max}`)
    ;(error as { status?: number }).status = 400
    throw error
  }
  return value
}

/** Parse PATCH/setup body field; non-finite input falls back to default. */
export function parseHistoryWindowMinutes(raw: unknown): number {
  const parsed = Number(raw ?? SITE_CONFIG_HISTORY_WINDOW_DEFAULT_MINUTES)
  return Number.isFinite(parsed)
    ? clampSiteConfigHistoryWindowMinutes(parsed)
    : SITE_CONFIG_HISTORY_WINDOW_DEFAULT_MINUTES
}

export function parseProcessStaleSeconds(raw: unknown): number {
  const parsed = Number(raw ?? SITE_CONFIG_PROCESS_STALE_DEFAULT_SECONDS)
  return Number.isFinite(parsed)
    ? clampSiteConfigProcessStaleSeconds(parsed)
    : SITE_CONFIG_PROCESS_STALE_DEFAULT_SECONDS
}
