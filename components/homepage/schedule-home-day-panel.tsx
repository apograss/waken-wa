'use client'

import { addDays, format, startOfDay } from 'date-fns'
import { useT } from 'next-i18next/client'
import { type ReactNode, useEffect, useState } from 'react'

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

type RowStatus = 'past' | 'ongoing' | 'next' | 'upcoming'

type DayState = {
  dayLabel: string
  dateSub: string
  isToday: boolean
  occs: ScheduleOccurrence[]
  /** 显示列表中"下一节"那一节的索引；-1 表示没有 */
  nextIndex: number
  /** 是否有正在上的课 */
  hasOngoing: boolean
  /** 今日全部上完 */
  allEndedToday: boolean
}

const WEEKDAY_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

/** 按课程名关键词给一个简单的学科图标（线性，跟随主题色）。 */
function subjectIcon(title: string): ReactNode {
  const t = title.toLowerCase()
  const has = (...kw: string[]) => kw.some((k) => title.includes(k) || t.includes(k))
  const p = { width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (has('体育', '运动', '球', '健身', '游泳', '跑'))
    return (<svg {...p}><circle cx="12" cy="5" r="1.6" /><path d="M9 20l2.5-5 2.5 2 1 3" /><path d="M6 12l3-2 3 1 2.5-1.5L18 11" /></svg>)
  if (has('英语', '语文', '外语', '日语', '写作', '文学', '阅读'))
    return (<svg {...p}><path d="M5 6h9M5 10h7" /><path d="M16 14l3 6M19 20l3-6M17.2 17.6h4.6" /></svg>)
  if (has('解剖', '医', '护', '临床', '病理', '生理', '药', '诊'))
    return (<svg {...p}><path d="M6 3v6a4 4 0 0 0 8 0V3" /><path d="M10 13v3a4 4 0 0 0 8 0v-1" /><circle cx="18" cy="13" r="2" /></svg>)
  if (has('数学', '高数', '微积分', '线代', '统计', '概率'))
    return (<svg {...p}><path d="M5 5h14M5 12h14M5 19h6" /><path d="M16 16l4 4M20 16l-4 4" /></svg>)
  if (has('计算', '编程', '程序', '软件', '数据', '网络', '算法', '信息'))
    return (<svg {...p}><path d="M9 8l-4 4 4 4M15 8l4 4-4 4" /></svg>)
  if (has('物理', '化学', '生物', '实验'))
    return (<svg {...p}><path d="M9 3v6l-5 9a2 2 0 0 0 1.8 3h12.4A2 2 0 0 0 20 18l-5-9V3" /><path d="M9 3h6" /></svg>)
  return (<svg {...p}><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M19 3v18" /></svg>)
}

/**
 * 右栏全天课表（时间轴样式）。每节课带「已结束 / 进行中 / 下一节」状态；
 * 今天全部上完显示"摸鱼中"；今天没课则展示最近有课那天的全天课表。
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
      const t0 = wallNow.getTime()
      setNowMs(t0)

      const build = (occs: ScheduleOccurrence[], day: Date, isToday: boolean): DayState => {
        const hasOngoing = isToday && occs.some((o) => t0 >= o.start.getTime() && t0 < o.end.getTime())
        const allEnded = isToday && occs.length > 0 && occs.every((o) => t0 >= o.end.getTime())
        // "下一节"：今天第一节还没上的；非今天则该天第一节
        let nextIndex = -1
        if (isToday) {
          nextIndex = occs.findIndex((o) => t0 < o.start.getTime())
        } else {
          nextIndex = occs.length > 0 ? 0 : -1
        }
        return {
          dayLabel: isToday ? t('site.schedule.today') : '',
          dateSub: `${WEEKDAY_CN[day.getDay()]} · ${format(day, 'M/d')}`,
          isToday,
          occs,
          nextIndex,
          hasOngoing,
          allEndedToday: allEnded,
        }
      }

      const todayOccs = getOccurrencesOnCalendarDay(courses, now, periodTemplate, effectiveTimezone)
      if (todayOccs.length > 0) {
        setState(build(todayOccs, wallNow, true))
        return
      }
      for (let i = 1; i <= 7; i += 1) {
        const future = addDays(startOfDay(wallNow), i)
        const occs = getOccurrencesOnCalendarDay(courses, future, periodTemplate, effectiveTimezone)
        if (occs.length > 0) {
          const label = i === 1 ? t('site.schedule.tomorrow') : WEEKDAY_CN[future.getDay()]
          const s = build(occs, future, false)
          setState({ ...s, dayLabel: label })
          return
        }
      }
      setState({ dayLabel: '', dateSub: '', isToday: false, occs: [], nextIndex: -1, hasOngoing: false, allEndedToday: false })
    }
    tick()
    const id = window.setInterval(tick, 30_000)
    return () => window.clearInterval(id)
  }, [courses, effectiveTimezone, mounted, periodTemplate, t])

  if (courses.length === 0) return null
  if (!state) return null

  const idleLabel = afterClassesLabel.trim() || t('site.schedule.idleFallback')

  // 大号当前状态 header
  let statusKind: 'in_class' | 'break' | 'idle' = 'idle'
  let statusBig = idleLabel
  let statusSub = ''
  if (state.isToday && state.hasOngoing) {
    const cur = state.occs.find((o) => nowMs >= o.start.getTime() && nowMs < o.end.getTime())
    statusKind = 'in_class'
    statusBig = t('site.schedule.inClass')
    statusSub = cur ? `${cur.title} · ${format(cur.start, 'HH:mm')}–${format(cur.end, 'HH:mm')}` : ''
  } else if (state.isToday && state.nextIndex >= 0) {
    const n = state.occs[state.nextIndex]
    statusKind = 'break'
    statusBig = t('site.schedule.onBreak')
    statusSub = `${t('site.schedule.nextClass')} ${n.title} · ${format(n.start, 'HH:mm')}`
  } else {
    statusKind = 'idle'
    statusBig = idleLabel
    statusSub = state.occs.length > 0 && !state.isToday ? `${state.dayLabel}有课` : t('site.schedule.todayNoClass')
  }

  return (
    <div className={`now-schedule-panel${className ? ` ${className}` : ''}`}>
      <div className="now-schedule-head">
        <span className="now-eyebrow">{t('site.schedule.scheduleLabel')}</span>
        <span className="now-schedule-day">
          <span className="now-schedule-day-label">{state.dayLabel || idleLabel}</span>
          {state.dateSub ? <span className="now-schedule-day-sub">{state.dateSub}</span> : null}
        </span>
      </div>

      <div className={`now-schedule-status is-${statusKind}`}>
        <span className="now-schedule-status-big">{statusBig}</span>
        {statusSub ? <span className="now-schedule-status-sub">{statusSub}</span> : null}
      </div>

      {state.occs.length > 0 ? (
        <ul className="now-schedule-list">
          {state.occs.map((o, i) => {
            const status: RowStatus = state.isToday
              ? nowMs >= o.end.getTime()
                ? 'past'
                : nowMs >= o.start.getTime()
                  ? 'ongoing'
                  : i === state.nextIndex
                    ? 'next'
                    : 'upcoming'
              : i === state.nextIndex
                ? 'next'
                : 'upcoming'

            const tag =
              status === 'past'
                ? t('site.schedule.ended')
                : status === 'ongoing'
                  ? t('site.schedule.ongoing')
                  : status === 'next'
                    ? t('site.schedule.nextClass')
                    : null

            const locText = showLocation ? o.location?.trim() || t('site.schedule.online') : ''
            const metaParts: string[] = []
            if (locText) metaParts.push(locText)
            if (showTeacher && o.teacher) metaParts.push(o.teacher)

            return (
              <li key={`${o.courseId}-${i}`} className={`now-schedule-item is-${status}`}>
                <span className="now-schedule-time">
                  <span className="now-schedule-time-s">{format(o.start, 'HH:mm')}</span>
                  <span className="now-schedule-time-e">{format(o.end, 'HH:mm')}</span>
                </span>
                <span className="now-schedule-rail" aria-hidden>
                  <span className="now-schedule-dot" />
                </span>
                <span className="now-schedule-body">
                  <span className="now-schedule-title">
                    <span className="now-schedule-ic">{subjectIcon(o.title)}</span>
                    <span className="now-schedule-name">{o.title}</span>
                    {tag ? <span className={`now-schedule-tag is-${status}`}>{tag}</span> : null}
                  </span>
                  {metaParts.length > 0 ? (
                    <span className="now-schedule-meta">{metaParts.join(' · ')}</span>
                  ) : null}
                </span>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
