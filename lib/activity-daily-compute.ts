/**
 * Pure compute helpers for daily activity aggregation.
 *
 * Intentionally free of DB / server-only / path-alias imports so the easy-to-get-wrong
 * arithmetic (duration capping, timezone bucketing, ratios) stays unit-testable in isolation.
 * Relative import of ./timezone is deliberate — that module is alias-free too.
 */

import { getDateParts } from './timezone'

/**
 * Seconds of active time to credit to the current app for this report.
 *
 * Reports are discrete heartbeats; we credit the gap since the device's previous
 * report, capped so a sleep / offline gap can't inflate the total.
 *
 * @param lastReportAtMs epoch ms of this device's previous report; null/undefined on first report
 * @param nowMs          epoch ms of the current report
 * @param capSeconds     upper bound for a single credit (sleep / offline guard)
 */
export function computeActiveDelta(
  lastReportAtMs: number | null | undefined,
  nowMs: number,
  capSeconds: number,
): number {
  if (lastReportAtMs == null) return 0
  const deltaMs = nowMs - lastReportAtMs
  if (deltaMs <= 0) return 0
  const seconds = Math.round(deltaMs / 1000)
  const cap = Math.max(0, Math.round(capSeconds))
  return Math.min(seconds, cap)
}

/** Local-day key `YYYY-MM-DD` for the given instant, in the given IANA timezone. */
export function localDateKey(instant: Date | string | number, timeZone: string): string {
  const { year, month, day } = getDateParts(instant, timeZone)
  return `${year}-${pad2(month)}-${pad2(day)}`
}

/** Half-hour slot index 0..47 for the given instant, in the given IANA timezone. */
export function slotIndex(instant: Date | string | number, timeZone: string): number {
  const { hour, minute } = getDateParts(instant, timeZone)
  return hour * 2 + (minute >= 30 ? 1 : 0)
}

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

export interface AppUsageRow {
  processName: string
  activeSeconds: number
}

export interface TopApp extends AppUsageRow {
  /** Share of the day's total active seconds, 0..100 (rounded). */
  percent: number
}

/** Top-N apps by active time, each with its share of the day's total. */
export function summarizeTopApps(rows: readonly AppUsageRow[], topN: number): TopApp[] {
  const total = rows.reduce((sum, r) => sum + Math.max(0, r.activeSeconds), 0)
  return [...rows]
    .sort((a, b) => b.activeSeconds - a.activeSeconds)
    .slice(0, Math.max(0, topN))
    .map((r) => ({
      ...r,
      percent: total > 0 ? Math.round((Math.max(0, r.activeSeconds) / total) * 100) : 0,
    }))
}
