export const REPORTED_APP_TITLE_LIMIT_DEFAULT = 3
export const REPORTED_APP_TITLE_LIMIT_MAX = 10

export function normalizeReportedAppTitleLimit(
  raw: unknown,
  fallback = REPORTED_APP_TITLE_LIMIT_DEFAULT,
): number {
  const value = Number(raw)
  const fallbackValue = Number.isFinite(fallback)
    ? Math.max(0, Math.min(REPORTED_APP_TITLE_LIMIT_MAX, Math.round(fallback)))
    : REPORTED_APP_TITLE_LIMIT_DEFAULT
  if (!Number.isFinite(value)) return fallbackValue
  return Math.max(0, Math.min(REPORTED_APP_TITLE_LIMIT_MAX, Math.round(value)))
}
