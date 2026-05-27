'use client'

/**
 * LiveNowSection — 把 reporter 上报的真实数据映射到 NowSectionView 的展示模型。
 *
 * 数据来源：useSharedActivityFeed —— 由上层 ActivityFeedProvider 提供。
 *
 * 设备列表：activeStatuses 中每台设备的最新一条
 * 正在做 / 最近 4h 历史：activeStatuses + recentActivities 派生
 * 正在听：activeStatuses 里第一个 metadata.media 有效的条目
 * 大游戏卡：activeStatuses 里 steamNowPlaying 不为空的条目
 * 课程卡：复用 ScheduleHomeInClassBanner（保留 waken-wa 原本逻辑）
 */

import type { ReactNode } from 'react'

import { useSharedActivityFeed } from '@/components/activity-feed-provider'
import { ScheduleHomeInClassBanner } from '@/components/schedule-home-in-class-banner'
import { isDeviceBatteryCharging } from '@/lib/activity-battery-metadata'
import { getMediaDisplay } from '@/lib/activity-media'
import type { ActivityFeedItem } from '@/types/activity'

import {
  type NowDeviceIcon,
  type NowDeviceItem,
  type NowGameItem,
  type NowHistoryItem,
  NowSectionView,
} from './now-section-view'

interface LiveNowSectionProps {
  /** 是否在主页隐藏媒体显示（来自后台开关） */
  hideMedia?: boolean
  /** 课程相关 props（直接转发给 ScheduleHomeInClassBanner） */
  schedule?: {
    show: boolean
    courses: unknown[]
    showLocation: boolean
    showTeacher: boolean
    periodTemplate: unknown
    showNextUpcoming: boolean
    afterClassesLabel: string
  }
}

export function LiveNowSection({ hideMedia, schedule }: LiveNowSectionProps) {
  const { feed } = useSharedActivityFeed()

  const statuses: ActivityFeedItem[] = feed?.activeStatuses ?? []
  const recentActivities: ActivityFeedItem[] = feed?.recentActivities ?? []

  // 1) 设备列表
  const devices: NowDeviceItem[] = statuses.map(s => buildDeviceItem(s))

  // 2) 正在做：取第一台 active 设备的当前活动
  const primary = statuses[0] ?? null
  const doing = primary
    ? {
        title: primary.processTitle?.trim() || primary.processName || '工作中',
        app: buildDoingApp(primary),
      }
    : null

  // 3) 过去 4 小时历史（最多 5 条；不重复显示当前正在做的）
  const history = buildHistoryItems(recentActivities, primary)

  // 4) 正在听
  const listen = !hideMedia ? buildListenItem(statuses) : null

  // 5) 大游戏卡（Steam）
  const game = buildGameItem(statuses)

  // 6) 课程卡 slot
  let scheduleSlot: ReactNode = null
  if (schedule?.show) {
    scheduleSlot = (
      <ScheduleHomeInClassBanner
        courses={schedule.courses as never}
        showLocation={schedule.showLocation}
        showTeacher={schedule.showTeacher}
        periodTemplate={schedule.periodTemplate as never}
        showNextUpcoming={schedule.showNextUpcoming}
        afterClassesLabel={schedule.afterClassesLabel}
      />
    )
  }

  // 7) footer 时间戳
  const footer =
    primary && (primary.startedAt || primary.lastReportAt)
      ? {
          startedAt: primary.startedAt ? formatTime(primary.startedAt) : null,
          lastReportAt: primary.lastReportAt
            ? formatTime(primary.lastReportAt)
            : primary.updatedAt
              ? formatTime(primary.updatedAt)
              : null,
        }
      : null

  return (
    <NowSectionView
      devices={devices}
      doing={doing}
      history={history}
      listen={listen}
      game={game}
      scheduleSlot={scheduleSlot}
      footer={footer}
    />
  )
}

/* ---------- 数据映射工具 ---------- */

function buildDeviceItem(s: ActivityFeedItem): NowDeviceItem {
  const meta = s.metadata as Record<string, unknown> | null | undefined
  const battery = readBatteryPercent(meta)
  const charging = isDeviceBatteryCharging(meta)
  const lastUpdate = s.lastReportAt || s.updatedAt || s.startedAt
  const isOnline = isDeviceOnline(s, feedNow())
  const deviceLabel = s.device?.trim() || s.processName || '未命名设备'

  const icon = inferDeviceIcon(deviceLabel, meta)
  const platformLabel = readPlatformLabel(meta)
  const idleSuffix = !isOnline && lastUpdate ? ` · 最近上报 ${formatTime(lastUpdate)}` : ''

  const metaParts = [platformLabel, isOnline ? s.processName || '在线' : '离线' + idleSuffix].filter(
    Boolean,
  )

  return {
    key: s.deviceId != null ? `dev-${s.deviceId}` : `dev-${deviceLabel}`,
    icon,
    name: deviceLabel,
    meta: metaParts.join(' · '),
    battery,
    charging,
    active: isOnline,
  }
}

function buildDoingApp(s: ActivityFeedItem): string {
  const parts: string[] = []
  if (s.processName) parts.push(s.processName)
  if (s.startedAt) {
    const minutes = Math.max(0, Math.floor((Date.now() - new Date(s.startedAt).getTime()) / 60_000))
    if (minutes < 60) {
      parts.push(`已打开 ${minutes} 分钟`)
    } else {
      const hours = Math.floor(minutes / 60)
      const remainingMin = minutes % 60
      parts.push(`已打开 ${hours} 小时${remainingMin > 0 ? ` ${remainingMin} 分` : ''}`)
    }
  }
  return parts.join(' · ')
}

function buildHistoryItems(
  recent: ActivityFeedItem[],
  current: ActivityFeedItem | null,
): NowHistoryItem[] {
  const seen = new Set<string>()
  if (current?.processName) {
    seen.add(`${current.processName}:${current.processTitle ?? ''}`)
  }
  const items: NowHistoryItem[] = []
  for (const r of recent) {
    const key = `${r.processName}:${r.processTitle ?? ''}`
    if (seen.has(key)) continue
    seen.add(key)
    items.push({
      time: formatTime(r.startedAt, { onlyTime: true }),
      app: r.processName || '未知',
      title: r.processTitle?.trim() || '—',
    })
    if (items.length >= 5) break
  }
  return items
}

function buildListenItem(statuses: ActivityFeedItem[]) {
  for (const s of statuses) {
    const media = getMediaDisplay(s.metadata)
    if (media && media.title) {
      const progress =
        media.positionMs !== null && media.durationMs !== null && media.durationMs > 0
          ? Math.min(100, Math.max(0, (media.positionMs / media.durationMs) * 100))
          : null
      const positionLabel =
        media.positionMs !== null && media.durationMs !== null
          ? `${formatPlaybackTime(media.positionMs)} / ${formatPlaybackTime(media.durationMs)}`
          : null
      const sourceParts: string[] = []
      if (media.source) sourceParts.push(`来自 ${media.source}`)
      if (s.device) sourceParts.push(s.device)
      return {
        title: media.title,
        artist: media.singer,
        progressPercent: progress,
        positionLabel,
        state: media.state,
        sourceLine: sourceParts.length > 0 ? sourceParts.join(' · ') : null,
        coverUrl: media.coverUrl,
      }
    }
  }
  return null
}

function buildGameItem(statuses: ActivityFeedItem[]): NowGameItem | null {
  for (const s of statuses) {
    if (s.steamNowPlaying) {
      const totalMinutes =
        s.startedAt
          ? Math.max(
              0,
              Math.floor((Date.now() - new Date(s.startedAt).getTime()) / 60_000),
            )
          : 0
      const sessionLabel = (() => {
        if (totalMinutes < 60) return `${totalMinutes}m`
        const h = Math.floor(totalMinutes / 60)
        const m = totalMinutes % 60
        return m > 0 ? `${h}h ${m}m` : `${h}h`
      })()
      return {
        platform: 'STEAM',
        title: s.steamNowPlaying.name,
        author: null,
        imageUrl: s.steamNowPlaying.imageUrl || null,
        stats: [{ label: '本次时长', value: sessionLabel }],
        statusLabel: s.device ? `游玩中 · ${s.device}` : '游玩中',
      }
    }
  }
  return null
}

/* ---------- helpers ---------- */

function feedNow(): number {
  return Date.now()
}

function isDeviceOnline(s: ActivityFeedItem, nowMs: number): boolean {
  if (s.endedAt) return false
  if (s.isCustomOfflineStatus) return false
  // 5 分钟内有上报视为在线
  const last = s.lastReportAt || s.updatedAt || s.startedAt
  if (!last) return false
  const diffMs = nowMs - new Date(last).getTime()
  return diffMs <= 5 * 60 * 1000
}

function readBatteryPercent(
  metadata: Record<string, unknown> | null | undefined,
): number | null {
  const value = metadata?.deviceBatteryPercent
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return Math.min(Math.max(Math.round(value), 0), 100)
}

function readPlatformLabel(
  metadata: Record<string, unknown> | null | undefined,
): string | null {
  if (!metadata) return null
  const platform = metadata.platform || metadata.os || metadata.osName
  if (typeof platform === 'string' && platform.trim()) return platform.trim()
  return null
}

function inferDeviceIcon(
  deviceName: string,
  metadata: Record<string, unknown> | null | undefined,
): NowDeviceIcon {
  const explicit = String(metadata?.deviceType ?? '').trim().toLowerCase()
  if (explicit === 'mobile') return 'phone'
  if (explicit === 'tablet') return 'tablet'
  if (explicit === 'desktop') return 'laptop'

  const source = deviceName.toLowerCase()
  if (/ipad|tablet|tab|平板/.test(source)) return 'tablet'
  if (/iphone|android|mobile|phone|手机/.test(source)) return 'phone'
  return 'laptop'
}

function formatTime(
  iso: string,
  opts: { onlyTime?: boolean } = {},
): string {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    const h = String(d.getHours()).padStart(2, '0')
    const m = String(d.getMinutes()).padStart(2, '0')
    if (opts.onlyTime) return `${h}:${m}`
    const M = String(d.getMonth() + 1).padStart(2, '0')
    const D = String(d.getDate()).padStart(2, '0')
    return `${M}/${D} ${h}:${m}`
  } catch {
    return iso
  }
}

function formatPlaybackTime(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '--:--'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
