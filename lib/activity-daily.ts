import 'server-only'

import { eq, lt, sql } from 'drizzle-orm'

import {
  computeActiveDelta,
  localDateKey,
  slotIndex,
  summarizeTopApps,
} from '@/lib/activity-daily-compute'
import { prettifyAppName } from '@/lib/activity-display'
import { getMediaDisplay, type MediaDisplay } from '@/lib/activity-media'
import { db } from '@/lib/db'
import {
  activityDailyAppUsage,
  activityDailySlot,
  activityDailySummary,
} from '@/lib/drizzle-schema'
import { isLockScreenReporterProcessName } from '@/lib/lockapp-reporter'
import { sqlTimestamp } from '@/lib/sql-timestamp'
import { normalizeTimezone } from '@/lib/timezone'

/** Max seconds credited for a single report gap (sleep / offline guard). */
const ACTIVE_CAP_SECONDS = 300
/** Days of daily rollup to retain (today + previous days). */
const RETAIN_DAYS = 8
/** Throttle window for the rolling cleanup delete. */
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000
/** Browser-ish play sources are treated as "watching" rather than "listening". */
const WATCH_SOURCE_RE = /edge|chrome|firefox|safari|浏览器|bilibili|哔哩|youtube/i

/**
 * Last report time per device, kept in-process. The all-in-one container is a
 * single Node process, so a Map suffices; a restart just means the next report
 * starts a fresh gap (delta 0), which is acceptable.
 */
const lastReportMsByDevice = new Map<number, number>()
let lastCleanupMs = 0

function normalizeName(value: string): string {
  return value.trim().toLowerCase()
}

function parseProcessSet(value: unknown): Set<string> {
  const out = new Set<string>()
  if (!Array.isArray(value)) return out
  for (const item of value) {
    const key = normalizeName(String(item ?? ''))
    if (key) out.add(key)
  }
  return out
}

/** Mirror of the activity-feed app filter so blacklisted apps stay out of the rollups. */
function passesAppFilter(processName: string, config: Record<string, unknown> | null): boolean {
  const key = normalizeName(processName)
  if (!key) return false
  const mode = String(config?.appFilterMode ?? 'blacklist').trim().toLowerCase()
  if (mode === 'whitelist') {
    const whitelist = parseProcessSet(config?.appWhitelist)
    return whitelist.size > 0 && whitelist.has(key)
  }
  return !parseProcessSet(config?.appBlacklist).has(key)
}

function isWatch(media: MediaDisplay | null): boolean {
  return !!media?.source && WATCH_SOURCE_RE.test(media.source)
}

export interface RecordDailyActivityInput {
  deviceId: number
  processName: string
  nowMs: number
  metadata: Record<string, unknown> | null
  config: Record<string, unknown> | null
}

/**
 * Fold one device report into the per-day rollups (app usage, half-hour slots, totals).
 * Best-effort: callers wrap in try/catch so a failure never blocks reporting.
 */
export async function recordDailyActivity(input: RecordDailyActivityInput): Promise<void> {
  const { deviceId, processName, nowMs, metadata, config } = input
  if (!processName || !Number.isFinite(deviceId)) return
  // Lock-screen / sleep reporters are not "active" time.
  if (isLockScreenReporterProcessName(processName)) return
  if (!passesAppFilter(processName, config)) return

  const timeZone = normalizeTimezone(config?.displayTimezone)
  const statDate = localDateKey(nowMs, timeZone)
  const slot = slotIndex(nowMs, timeZone)

  const delta = computeActiveDelta(lastReportMsByDevice.get(deviceId), nowMs, ACTIVE_CAP_SECONDS)
  lastReportMsByDevice.set(deviceId, nowMs)

  const now = sqlTimestamp()

  // App usage rollup: always bump report count; add active seconds when we have a gap.
  await db
    .insert(activityDailyAppUsage)
    .values({ statDate, processName, activeSeconds: delta, reportCount: 1, updatedAt: now })
    .onConflictDoUpdate({
      target: [activityDailyAppUsage.statDate, activityDailyAppUsage.processName],
      set: {
        activeSeconds: sql`${activityDailyAppUsage.activeSeconds} + ${delta}`,
        reportCount: sql`${activityDailyAppUsage.reportCount} + 1`,
        updatedAt: now,
      },
    })

  if (delta > 0) {
    // Half-hour slot rollup (today timeline).
    await db
      .insert(activityDailySlot)
      .values({ statDate, slot, processName, activeSeconds: delta, updatedAt: now })
      .onConflictDoUpdate({
        target: [activityDailySlot.statDate, activityDailySlot.slot, activityDailySlot.processName],
        set: {
          activeSeconds: sql`${activityDailySlot.activeSeconds} + ${delta}`,
          updatedAt: now,
        },
      })

    // Day totals + media listen/watch split.
    const media = getMediaDisplay(metadata)
    const isPlaying = media?.state === 'playing'
    const listenDelta = isPlaying && !isWatch(media) ? delta : 0
    const watchDelta = isPlaying && isWatch(media) ? delta : 0

    await db
      .insert(activityDailySummary)
      .values({
        statDate,
        activeSeconds: delta,
        listenSeconds: listenDelta,
        watchSeconds: watchDelta,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [activityDailySummary.statDate],
        set: {
          activeSeconds: sql`${activityDailySummary.activeSeconds} + ${delta}`,
          listenSeconds: sql`${activityDailySummary.listenSeconds} + ${listenDelta}`,
          watchSeconds: sql`${activityDailySummary.watchSeconds} + ${watchDelta}`,
          updatedAt: now,
        },
      })
  }

  await maybeCleanup(nowMs, timeZone)
}

/** Rolling retention: drop rollups older than RETAIN_DAYS, throttled to once per hour. */
async function maybeCleanup(nowMs: number, timeZone: string): Promise<void> {
  if (nowMs - lastCleanupMs < CLEANUP_INTERVAL_MS) return
  lastCleanupMs = nowMs
  const cutoff = localDateKey(nowMs - RETAIN_DAYS * 24 * 60 * 60 * 1000, timeZone)
  await Promise.all([
    db.delete(activityDailyAppUsage).where(lt(activityDailyAppUsage.statDate, cutoff)),
    db.delete(activityDailySlot).where(lt(activityDailySlot.statDate, cutoff)),
    db.delete(activityDailySummary).where(lt(activityDailySummary.statDate, cutoff)),
  ])
}

const TOP_APPS_COUNT = 5
const SLOTS_PER_DAY = 48

export interface TodayTopApp {
  processName: string
  displayName: string
  activeSeconds: number
  percent: number
}

export interface TodayTimelineSlot {
  slot: number
  processName: string | null
  displayName: string | null
  activeSeconds: number
}

export interface TodaySummary {
  date: string
  activeSeconds: number
  listenSeconds: number
  watchSeconds: number
  distinctApps: number
  topApps: TodayTopApp[]
  /** 48 half-hour slots (0..47); dominant app per slot, or null when idle. */
  timeline: TodayTimelineSlot[]
}

/** Read today's rollups (totals, top apps, half-hour timeline) for the given timezone. */
export async function getTodaySummary(timeZone: string, nowMs: number): Promise<TodaySummary> {
  const date = localDateKey(nowMs, timeZone)

  const [summaryRow] = await db
    .select({
      activeSeconds: activityDailySummary.activeSeconds,
      listenSeconds: activityDailySummary.listenSeconds,
      watchSeconds: activityDailySummary.watchSeconds,
    })
    .from(activityDailySummary)
    .where(eq(activityDailySummary.statDate, date))
    .limit(1)

  const appRows = await db
    .select({
      processName: activityDailyAppUsage.processName,
      activeSeconds: activityDailyAppUsage.activeSeconds,
    })
    .from(activityDailyAppUsage)
    .where(eq(activityDailyAppUsage.statDate, date))

  const slotRows = await db
    .select({
      slot: activityDailySlot.slot,
      processName: activityDailySlot.processName,
      activeSeconds: activityDailySlot.activeSeconds,
    })
    .from(activityDailySlot)
    .where(eq(activityDailySlot.statDate, date))

  const topApps: TodayTopApp[] = summarizeTopApps(appRows, TOP_APPS_COUNT).map((app) => ({
    processName: app.processName,
    displayName: prettifyAppName(app.processName) || app.processName,
    activeSeconds: app.activeSeconds,
    percent: app.percent,
  }))

  const dominantBySlot = new Map<number, { processName: string; activeSeconds: number }>()
  for (const row of slotRows) {
    const current = dominantBySlot.get(row.slot)
    if (!current || row.activeSeconds > current.activeSeconds) {
      dominantBySlot.set(row.slot, {
        processName: row.processName,
        activeSeconds: row.activeSeconds,
      })
    }
  }
  const timeline: TodayTimelineSlot[] = Array.from({ length: SLOTS_PER_DAY }, (_, slot) => {
    const dominant = dominantBySlot.get(slot)
    return {
      slot,
      processName: dominant?.processName ?? null,
      displayName: dominant ? prettifyAppName(dominant.processName) || dominant.processName : null,
      activeSeconds: dominant?.activeSeconds ?? 0,
    }
  })

  return {
    date,
    activeSeconds: summaryRow?.activeSeconds ?? 0,
    listenSeconds: summaryRow?.listenSeconds ?? 0,
    watchSeconds: summaryRow?.watchSeconds ?? 0,
    distinctApps: appRows.length,
    topApps,
    timeline,
  }
}
