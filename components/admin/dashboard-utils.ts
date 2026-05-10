import { ADMIN_SHORT_EVENT_FILTER_MS } from '@/constants/admin-dashboard'
import { normalizeRequestLanguage } from '@/lib/i18n/request-locale'
import type { ActivityFeedItem } from '@/types/activity'

export type OverviewFormatPattern = (
  value: Date | string | number | null | undefined,
  pattern: string,
  fallback?: string,
) => string

export function FormatOverviewClock(
  value: string | null | undefined,
  formatPattern: OverviewFormatPattern,
): string {
  return formatPattern(value, 'HH:mm:ss', '--:--:--')
}

export function FormatOverviewDate(
  value: string | null | undefined,
  formatPattern: OverviewFormatPattern,
  fallback: string,
): string {
  return formatPattern(value, 'MM/dd', fallback)
}

export function FormatOverviewRelativeTime(
  value: string | null | undefined,
  locale: string,
  justNowLabel: string,
): string {
  const time = Date.parse(String(value ?? ''))
  if (!Number.isFinite(time)) return justNowLabel

  const diffMs = time - Date.now()
  const absMs = Math.abs(diffMs)
  const normalizedLocale = normalizeRequestLanguage(locale) === 'zh-CN' ? 'zh-CN' : 'en'
  const rtf = new Intl.RelativeTimeFormat(normalizedLocale, { numeric: 'auto' })

  if (absMs < 60_000) return justNowLabel
  if (absMs < 3_600_000) return rtf.format(Math.round(diffMs / 60_000), 'minute')
  if (absMs < 86_400_000) return rtf.format(Math.round(diffMs / 3_600_000), 'hour')
  return rtf.format(Math.round(diffMs / 86_400_000), 'day')
}

export function BuildRecentRecordSummary(
  record: ActivityFeedItem,
  emptyDescription: string,
): string {
  const statusLine = typeof record.statusText === 'string' ? record.statusText.trim() : ''
  if (statusLine) return statusLine
  if (record.processTitle?.trim()) return record.processTitle.trim()
  if (record.processName?.trim()) return record.processName.trim()
  return emptyDescription
}

export function GetRecordPushMode(record: ActivityFeedItem): 'realtime' | 'active' {
  if (record.pushMode === 'active' || record.pushMode === 'realtime') return record.pushMode
  const meta =
    record.metadata && typeof record.metadata === 'object' && !Array.isArray(record.metadata)
      ? (record.metadata as Record<string, unknown>)
      : null
  const mode = String(meta?.pushMode ?? '').trim().toLowerCase()
  return mode === 'active' || mode === 'persistent' ? 'active' : 'realtime'
}

export function ShouldShowRecentRecord(record: ActivityFeedItem): boolean {
  if (GetRecordPushMode(record) === 'active') return true

  const startedAtMs = Date.parse(String(record.startedAt ?? ''))
  if (!Number.isFinite(startedAtMs)) return true

  const reportedAtMs = Date.parse(
    String(record.endedAt || record.lastReportAt || record.updatedAt || record.startedAt || ''),
  )
  const fallbackEndMs = Number.isFinite(reportedAtMs) ? reportedAtMs : startedAtMs
  const effectiveEndMs = record.endedAt ? fallbackEndMs : Math.max(fallbackEndMs, Date.now())

  return effectiveEndMs - startedAtMs >= ADMIN_SHORT_EVENT_FILTER_MS
}
