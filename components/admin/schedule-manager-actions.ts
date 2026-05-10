import { addDays, format, startOfWeek } from 'date-fns'

import {
  emptyCourse,
  getPeriodPartLabel,
} from '@/components/admin/schedule-manager-utils'
import {
  getCourseTimeSessions,
  type ScheduleCourse,
  type ScheduleOccurrence,
  type SchedulePeriodPart,
  type SchedulePeriodTemplateItem,
} from '@/lib/schedule-courses'
import type { ScheduleFormBaseline } from '@/types/schedule-manager'

type TranslateFn = (key: string, options?: Record<string, unknown>) => string

type WeekdayOption = { value: number; label: string }

export type ScheduleMobileWeekDay = {
  date: Date
  label: string
  items: ScheduleOccurrence[]
}

export function BuildScheduleMobileWeekDays(
  weekRef: Date,
  occurrences: ScheduleOccurrence[],
  weekdayOptions: WeekdayOption[],
): ScheduleMobileWeekDay[] {
  const weekStart = startOfWeek(weekRef, { weekStartsOn: 1 })
  return Array.from({ length: 7 }, (_, index) => {
    const day = addDays(weekStart, index)
    const dayKey = format(day, 'yyyy-MM-dd')
    const items = occurrences
      .filter((occurrence) => format(occurrence.start, 'yyyy-MM-dd') === dayKey)
      .sort((a, b) => a.start.getTime() - b.start.getTime())
    return {
      date: day,
      label: weekdayOptions[index]?.label ?? format(day, 'EEE'),
      items,
    }
  })
}

export function PatchSchedulePeriodTemplateItem(
  items: SchedulePeriodTemplateItem[],
  id: string,
  patch: Partial<SchedulePeriodTemplateItem>,
): SchedulePeriodTemplateItem[] {
  return items.map((item) => (item.id === id ? { ...item, ...patch } : item))
}

export function BuildSchedulePeriodTemplateItem(
  t: TranslateFn,
  periodTemplate: SchedulePeriodTemplateItem[],
  part: SchedulePeriodPart,
): SchedulePeriodTemplateItem {
  const samePart = periodTemplate.filter((p) => p.part === part)
  const maxOrder = Math.max(0, ...samePart.map((p) => p.order))
  const nextOrder = maxOrder + 10
  let nextIndex = samePart.length + 1
  let id = `p_${part}_${nextOrder}_${nextIndex}`
  while (periodTemplate.some((item) => item.id === id)) {
    nextIndex += 1
    id = `p_${part}_${nextOrder}_${nextIndex}`
  }
  return {
    id,
    label: t('scheduleManager.newPeriodLabel', {
      part: getPeriodPartLabel(t, part),
    }),
    part,
    startTime: part === 'morning' ? '08:00' : part === 'afternoon' ? '14:00' : '19:00',
    endTime: part === 'morning' ? '09:40' : part === 'afternoon' ? '15:40' : '20:40',
    order: nextOrder,
  }
}

export function RemoveSchedulePeriodTemplateItem(
  items: SchedulePeriodTemplateItem[],
  id: string,
): SchedulePeriodTemplateItem[] {
  return items.filter((item) => item.id !== id)
}

export function RemoveSchedulePeriodFromCourses(
  courses: ScheduleCourse[],
  id: string,
): ScheduleCourse[] {
  return courses.map((course) => ({
    ...course,
    periodIds: course.periodIds?.filter((periodId) => periodId !== id),
  }))
}

export function ReorderSchedulePeriodTemplatePart(
  items: SchedulePeriodTemplateItem[],
  part: SchedulePeriodPart,
  orderedIds: string[],
): SchedulePeriodTemplateItem[] {
  const byId = new Map(items.map((item) => [item.id, item]))
  const reordered = orderedIds.map((id, index) => {
    const item = byId.get(id)
    if (!item) return null
    return { ...item, order: (index + 1) * 10 }
  })
  const valid = reordered.filter((item): item is SchedulePeriodTemplateItem => item !== null)
  if (valid.length !== orderedIds.length) return items
  const others = items.filter((item) => item.part !== part)
  return [...others, ...valid]
}

export function BuildNewScheduleCourseDraft(
  today: string,
  periodTemplate: SchedulePeriodTemplateItem[],
): ScheduleCourse {
  const draft = emptyCourse(today)
  if (periodTemplate.length > 0) {
    draft.timeMode = 'periods'
    draft.periodIds = [periodTemplate[0].id]
    const sessions = getCourseTimeSessions(draft, periodTemplate)
    if (sessions[0]) {
      draft.startTime = sessions[0].startTime
      draft.endTime = sessions[0].endTime
      draft.timeSessions = sessions.length > 1 ? sessions : undefined
    }
    return draft
  }
  draft.timeMode = 'custom'
  return draft
}

export function BuildEditableScheduleCourseDraft(
  course: ScheduleCourse,
  periodTemplate: SchedulePeriodTemplateItem[],
): ScheduleCourse {
  const sessions = getCourseTimeSessions(course, periodTemplate)
  const inferredMode =
    course.timeMode === 'custom'
      ? ('custom' as const)
      : course.periodIds && course.periodIds.length > 0
        ? ('periods' as const)
        : ('custom' as const)
  return {
    ...course,
    timeSessions: sessions.map((session) => ({ ...session })),
    startTime: sessions[0].startTime,
    endTime: sessions[0].endTime,
    periodIds: course.periodIds ?? [],
    timeMode: course.timeMode ?? inferredMode,
  }
}

export function UpsertScheduleCourse(
  courses: ScheduleCourse[],
  next: ScheduleCourse,
): ScheduleCourse[] {
  const index = courses.findIndex((course) => course.id === next.id)
  if (index < 0) return [...courses, next]
  const copy = [...courses]
  copy[index] = next
  return copy
}

export function RemoveScheduleCourse(
  courses: ScheduleCourse[],
  id: string,
): ScheduleCourse[] {
  return courses.filter((course) => course.id !== id)
}

export function BuildScheduleBaseline(value: ScheduleFormBaseline): ScheduleFormBaseline {
  return structuredClone(value)
}

export function IsScheduleDirty(
  current: ScheduleFormBaseline,
  baseline: ScheduleFormBaseline | null,
): boolean {
  if (!baseline) return false
  try {
    return JSON.stringify(current) !== JSON.stringify(baseline)
  } catch {
    return true
  }
}

export function BuildScheduleIcsImportMessage(
  t: TranslateFn,
  result: {
    icsWarnings: string[]
    importedCount: number
  },
): string {
  const warnings = result.icsWarnings.length ? `（${result.icsWarnings.join('；')}）` : ''
  return t('scheduleManager.messages.importedCourses', {
    value: result.importedCount,
    warnings,
  })
}
