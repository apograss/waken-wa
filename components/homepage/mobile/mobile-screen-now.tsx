'use client'

import { format } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'

import { useSharedActivityFeed } from '@/components/activity-feed-provider'
import { useSiteTimeFormat } from '@/components/site-timezone-provider'
import type { TodaySummary } from '@/lib/activity-daily'
import { cleanActivityTitle, prettifyAppName } from '@/lib/activity-display'
import {
  getOccurrencesOnCalendarDay,
  type ScheduleCourse,
  type ScheduleOccurrence,
  type SchedulePeriodTemplateItem,
} from '@/lib/schedule-courses'
import type { SteamGamesResult } from '@/lib/steam-games'
import { toWallClockDate } from '@/lib/timezone'
import type { ActivityFeedItem } from '@/types/activity'

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export interface MobileScreenNowProps {
  scheduleCourses: ScheduleCourse[]
  schedulePeriodTemplate?: SchedulePeriodTemplateItem[]
  scheduleShowLocation: boolean
  scheduleShowTeacher: boolean
  scheduleEnabled: boolean
  afterClassesLabel: string
  todaySummary: TodaySummary
  steamGames: SteamGamesResult
}

function fmtMinutes(min: number): string {
  if (min <= 0) return '—'
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  const r = min % 60
  return r > 0 ? `${h}h ${r}m` : `${h}h`
}
function fmtSeconds(sec: number): string {
  return fmtMinutes(Math.round(sec / 60))
}

export function MobileScreenNow({
  scheduleCourses,
  schedulePeriodTemplate,
  scheduleShowLocation,
  scheduleShowTeacher,
  scheduleEnabled,
  afterClassesLabel,
  todaySummary,
  steamGames,
}: MobileScreenNowProps) {
  const { feed } = useSharedActivityFeed()
  const { effectiveTimezone, mounted } = useSiteTimeFormat()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  const occs = useMemo<ScheduleOccurrence[]>(() => {
    if (!mounted || !scheduleEnabled || scheduleCourses.length === 0) return []
    return getOccurrencesOnCalendarDay(scheduleCourses, now, schedulePeriodTemplate, effectiveTimezone)
  }, [mounted, scheduleEnabled, scheduleCourses, schedulePeriodTemplate, effectiveTimezone, now])

  const statuses: ActivityFeedItem[] = feed?.activeStatuses ?? []
  const primary = statuses[0] ?? null
  const doingTitle = primary
    ? cleanActivityTitle(primary.processTitle) || prettifyAppName(primary.processName) || '工作中'
    : null
  const doingApp = primary ? prettifyAppName(primary.processName) : ''
  const doingMinutes = primary?.startedAt
    ? Math.max(0, Math.floor((now.getTime() - new Date(primary.startedAt).getTime()) / 60_000))
    : null

  const deviceName = primary?.device?.trim() || primary?.processName || 'APOGRASS'
  const platform = (() => {
    const m = primary?.metadata as Record<string, unknown> | null | undefined
    const p = m?.platform || m?.os || m?.osName
    return typeof p === 'string' && p.trim() ? p.trim() : '设备'
  })()

  // 课表：今天/正在/下一节/之后
  const wallNow = mounted && effectiveTimezone ? toWallClockDate(now, effectiveTimezone) : now
  const t0 = wallNow.getTime()
  const ongoing = occs.find((o) => t0 >= o.start.getTime() && t0 < o.end.getTime()) ?? null
  const nextOcc = occs.find((o) => t0 < o.start.getTime()) ?? null
  const focusOcc = ongoing ?? nextOcc
  const laterList = focusOcc ? occs.filter((o) => o.start.getTime() > focusOcc.end.getTime()).slice(0, 3) : []
  const allEnded = occs.length > 0 && occs.every((o) => t0 >= o.end.getTime())
  const idleLabel = afterClassesLabel.trim() || '正在摸鱼'

  const statusLine = (() => {
    if (!scheduleEnabled || occs.length === 0) return `${idleLabel} —— 今天没课哦~`
    if (ongoing) return `正在上课 —— ${ongoing.title}`
    if (allEnded) return `${idleLabel} —— 今天的课上完啦~`
    if (nextOcc) return `${idleLabel} —— 下一节是 ${nextOcc.title}`
    return idleLabel
  })()

  const countdownMin = nextOcc ? Math.max(0, Math.round((nextOcc.start.getTime() - t0) / 60_000)) : 0

  // 今日热力：48 半时槽 → 24 小时
  const hourly: number[] = Array.from({ length: 24 }, (_, h) => {
    const a = todaySummary.timeline[h * 2]?.activeSeconds ?? 0
    const b = todaySummary.timeline[h * 2 + 1]?.activeSeconds ?? 0
    return a + b
  })
  const games = steamGames.games

  return (
    <section className="m-screen m-now" data-screen="now">
      <div className="m-now-pad">
        <div className="m-sec-head">
          <span className="m-sec-num">01</span>
          <h2 className="m-sec-title">此刻</h2>
          <span className="m-sec-rule" />
          <span className="m-mono m-sec-live"><span className="m-sec-live-dot" />LIVE</span>
        </div>
      </div>

      {/* 现在 banner */}
      <figure className="m-now-banner">
        <div className="m-now-banner-orb1" />
        <div className="m-now-banner-orb2" />
        <div className="m-now-banner-dots" />
        <span className="m-mono m-now-badge"><span className="m-now-badge-dot" />{statuses.length > 0 ? '在线' : '离线'}</span>
        <div className="m-now-banner-body">
          <div className="m-mono m-now-banner-eyebrow">现在</div>
          <div className="m-now-banner-title">{doingTitle || '暂时空闲'}</div>
          <div className="m-mono m-now-banner-time">
            <span className="m-now-banner-time-bar" />
            {format(now, 'HH:mm')} · {WEEKDAYS[now.getDay()]}{doingApp ? ` · ${doingApp}` : ''}
          </div>
        </div>
      </figure>

      <div className="m-now-pad">
        <p className="m-now-quote">{statusLine}</p>

        {/* 设备 / 正在做 */}
        <div className="m-now-grid2">
          <div>
            <div className="m-mono m-now-label">— 设备 · DEVICE</div>
            <div className="m-now-kv">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="1.6"><rect x="2" y="4" width="20" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
              <div style={{ minWidth: 0 }}>
                <div className="m-now-kv-main">{deviceName}</div>
                <div className="m-now-kv-sub">{platform} · {statuses.length > 0 ? '在线' : '离线'}</div>
              </div>
            </div>
          </div>
          <div>
            <div className="m-mono m-now-label">— 正在做 · DOING</div>
            <div className="m-now-kv">
              <span className="m-now-kv-ic"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.7"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg></span>
              <div style={{ minWidth: 0 }}>
                <div className="m-now-kv-main">{doingTitle || '暂时空闲'}</div>
                <div className="m-now-kv-sub">{doingMinutes !== null ? `已打开 ${doingMinutes < 1 ? '不到 1' : doingMinutes} 分钟` : '—'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 下一节课卡 */}
        {scheduleEnabled && focusOcc ? (
          <div className="m-class-card">
            <div className="m-mono m-class-eyebrow"><span className="m-class-eyebrow-bar" />{ongoing ? '正在上课 · IN CLASS' : '下一节课 · NEXT CLASS'}</div>
            <div className="m-class-top">
              <div className="m-mono m-class-time">{format(focusOcc.start, 'HH:mm')}<span className="sep"> – </span>{format(focusOcc.end, 'HH:mm')}</div>
              {!ongoing && nextOcc ? (
                <span className="m-class-countdown"><span className="m-class-countdown-dot" />{countdownMin < 1 ? '即将开始' : `${countdownMin} 分钟后`}</span>
              ) : (
                <span className="m-class-countdown"><span className="m-class-countdown-dot" />进行中</span>
              )}
            </div>
            <div className="m-class-title">{focusOcc.title}</div>
            {(scheduleShowLocation && focusOcc.location) || (scheduleShowTeacher && focusOcc.teacher) ? (
              <div className="m-class-meta">
                {scheduleShowLocation ? (
                  <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></svg><b>{focusOcc.location || '线上'}</b></span>
                ) : null}
                {scheduleShowTeacher && focusOcc.teacher ? (
                  <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>{focusOcc.teacher}</span>
                ) : null}
              </div>
            ) : null}
            {laterList.length > 0 ? (
              <div className="m-class-later">
                <div className="m-mono m-class-later-h">之后 · LATER</div>
                {laterList.map((o, i) => (
                  <div key={`${o.courseId}-${i}`} className="m-class-later-row">
                    <span className="m-mono t">{format(o.start, 'HH:mm')}</span>
                    <span style={{ color: 'var(--ink)' }}>{o.title}</span>
                    {scheduleShowLocation ? <span className="loc">{o.location || '线上'}</span> : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* footer 时间 */}
        {primary?.startedAt || primary?.lastReportAt ? (
          <div className="m-mono m-now-foot">
            {primary?.startedAt ? <span>STARTED <b>{format(new Date(primary.startedAt), 'MM/dd HH:mm')}</b></span> : <span />}
            {primary?.lastReportAt ? <span>LAST REPORT <b>{format(new Date(primary.lastReportAt), 'HH:mm')}</b></span> : null}
          </div>
        ) : null}

        {/* 今日 */}
        {todaySummary.activeSeconds > 0 || todaySummary.topApps.length > 0 ? (
          <>
            <div className="m-today-head">
              <span className="m-mono m-today-head-lab">— 今日 · TODAY</span>
              <span className="m-mono m-today-head-date">{todaySummary.date}</span>
            </div>
            <div className="m-today-stats">
              <div className="m-today-stat"><div className="m-today-stat-v">{fmtSeconds(todaySummary.activeSeconds)}</div><div className="m-today-stat-l">活跃</div></div>
              {todaySummary.listenSeconds > 0 ? (
                <div className="m-today-stat"><div className="m-today-stat-v">{fmtSeconds(todaySummary.listenSeconds)}</div><div className="m-today-stat-l">听</div></div>
              ) : null}
              <div className="m-today-stat"><div className="m-today-stat-v">{todaySummary.distinctApps}<span className="m-today-stat-unit"> 个</span></div><div className="m-today-stat-l">应用</div></div>
            </div>
            {todaySummary.topApps.length > 0 ? (
              <div className="m-today-apps">
                {todaySummary.topApps.slice(0, 5).map((app) => (
                  <div key={app.processName} className="m-today-app">
                    <span className="m-today-app-name">{app.displayName}</span>
                    <span className="m-today-app-bar"><span className="m-today-app-fill" style={{ width: `${app.percent}%` }} /></span>
                    <span className="m-mono m-today-app-time">{fmtSeconds(app.activeSeconds)}</span>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="m-today-heat-wrap">
              <div className="m-today-heat">
                {hourly.map((sec, h) => {
                  const intensity = Math.min(1, sec / 1800)
                  return <span key={h} style={{ background: sec > 0 ? `color-mix(in srgb, var(--accent) ${Math.round((0.28 + 0.72 * intensity) * 100)}%, transparent)` : 'var(--line)' }} />
                })}
              </div>
              <div className="m-mono m-today-heat-axis"><span>0</span><span>6</span><span>12</span><span>18</span><span>24</span></div>
            </div>
          </>
        ) : null}

        {/* Steam */}
        {games.length > 0 ? (
          <>
            <div className="m-mono m-steam-head">— STEAM · RECENTLY PLAYED</div>
            <div className="m-steam-list">
              {games.map((g) => (
                <a key={g.appId} className="m-steam-row" href={`https://store.steampowered.com/app/${g.appId}`} target="_blank" rel="noopener noreferrer">
                  <span className="m-steam-cover" style={g.headerImageUrl ? { backgroundImage: `url(${g.headerImageUrl})` } : undefined} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span className="m-steam-name" style={{ display: 'block' }}>{g.name}</span>
                    <span className="m-steam-recent" style={{ display: 'block' }}>近两周 {fmtMinutes(g.playtime2weeksMin)}</span>
                  </span>
                  <span className="m-mono m-steam-total">累计<br />{fmtMinutes(g.playtimeForeverMin)}</span>
                </a>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  )
}
