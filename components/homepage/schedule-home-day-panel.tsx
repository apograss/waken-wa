'use client'

import { addDays, format, startOfDay } from 'date-fns'
import { useT } from 'next-i18next/client'
import { useEffect, useState } from 'react'

import { useSiteTimeFormat } from '@/components/site-timezone-provider'
import {
  getOccurrencesOnCalendarDay,
  type ScheduleCourse,
  type ScheduleOccurrence,
  type SchedulePeriodTemplateItem,
} from '@/lib/schedule-courses'
import { toWallClockDate } from '@/lib/timezone'

type ScheduleHomeDayPanelProps = {
  courses: ScheduleCourse[]
  showLocation: boolean
  showTeacher: boolean
  periodTemplate?: SchedulePeriodTemplateItem[]
  afterClassesLabel: string
  className?: string
}

type RowStatus = 'past' | 'ongoing' | 'upcoming'

type DayState = {
  /** 'today' 或未来某天 */
  dayLabel: string
  /** 该天是否就是今天 */
  isToday: boolean
  occs: ScheduleOccurrence[]
  /** 今日全部上完 */
  allEndedToday: boolean
}

const WEEKDAY_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

/**
 * 右栏全天课表：显示当天每一节课（时间/名称/地点/老师），高亮正在上的那节。
 * 今天没课就往后找最近有课的一天并显示「明天/周X」整天课表。
 */
export function ScheduleHomeDayPanel({
  courses,
  showLocation,
  showTeacher,
  periodTemplate,
  afterClassesLabel,
  className,
}: ScheduleHomeDayPanelProps) {
  const { t } = useT('common')
  const { effectiveTimezone, mounted } = useSiteTimeFormat()
  const [state, setState] = useState<DayState | null>(null)
  const [nowMs, setNowMs] = useState<number>(() => Date.now())

  useEffect(() => {
    if (!mounted) return
    const tick = () => {
      const now = new Date()
      const wallNow = effectiveTimezone ? toWallClockDate(now, effectiveTimezone) : now
      setNowMs(wallNow.getTime())

      const todayOccs = getOccurrencesOnCalendarDay(courses, now, periodTemplate, effectiveTimezone)
      if (todayOccs.length > 0) {
        const allEnded = todayOccs.every((o) => wallNow.getTime() >= o.end.getTime())
        setState({ dayLabel: t('site.schedule.today'), isToday: true, occs: todayOccs, allEndedToday: allEnded })
        return
      }
      // 今天没课 → 往后找最近有课的一天
      for (let i = 1; i <= 7; i += 1) {
        const future = addDays(startOfDay(wallNow), i)
        const occs = getOccurrencesOnCalendarDay(courses, future, periodTemplate, effectiveTimezone)
        if (occs.length > 0) {
          const label = i === 1 ? t('site.schedule.tomorrow') : WEEKDAY_CN[future.getDay()]
          setState({ dayLabel: label, isToday: false, occs, allEndedToday: false })
          return
        }
      }
      setState({ dayLabel: '', isToday: false, occs: [], allEndedToday: false })
    }
    tick()
    const id = window.setInterval(tick, 30_000)
    return () => window.clearInterval(id)
  }, [courses, effectiveTimezone, mounted, periodTemplate, t])

  if (courses.length === 0) return null
  if (!state) return null

  const idleLabel = afterClassesLabel.trim() || t('site.schedule.idleFallback')

  // 接下来 7 天都没课
  if (state.occs.length === 0) {
    return (
      <div className={`now-schedule-panel${className ? ` ${className}` : ''}`}>
        <div className="now-schedule-head">
          <span className="now-eyebrow">{t('site.schedule.scheduleLabel')}</span>
          <span className="now-schedule-day">{idleLabel}</span>
        </div>
        <div className="now-schedule-empty">{t('site.schedule.todayNoClass')}</div>
      </div>
    )
  }

  return (
    <div className={`now-schedule-panel${className ? ` ${className}` : ''}`}>
      <div className="now-schedule-head">
        <span className="now-eyebrow">{t('site.schedule.scheduleLabel')}</span>
        <span className="now-schedule-day">
          {state.dayLabel}
          {state.isToday && state.allEndedToday ? ` · ${idleLabel}` : ''}
        </span>
      </div>
      <ul className="now-schedule-list">
        {state.occs.map((o, i) => {
          const status: RowStatus = state.isToday
            ? nowMs >= o.end.getTime()
              ? 'past'
              : nowMs >= o.start.getTime()
                ? 'ongoing'
                : 'upcoming'
            : 'upcoming'
          const metaParts: string[] = []
          if (showLocation && o.location) metaParts.push(o.location)
          if (showTeacher && o.teacher) metaParts.push(o.teacher)
          return (
            <li key={`${o.courseId}-${i}`} className={`now-schedule-item is-${status}`}>
              <span className="now-schedule-time">
                {format(o.start, 'HH:mm')}
                <span className="now-schedule-time-sep">–</span>
                {format(o.end, 'HH:mm')}
              </span>
              <span className="now-schedule-body">
                <span className="now-schedule-title">
                  {o.title}
                  {status === 'ongoing' ? <span className="now-schedule-live-dot" /> : null}
                </span>
                {metaParts.length > 0 ? (
                  <span className="now-schedule-meta">{metaParts.join(' · ')}</span>
                ) : null}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
