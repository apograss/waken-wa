import type {
  ScheduleCourse,
  SchedulePeriodTemplateItem,
} from '@/lib/schedule-courses'

/** Fields that PATCH together; used for dirty detection vs last load/save. */
export type ScheduleFormBaseline = {
  periodTemplate: SchedulePeriodTemplateItem[]
  courses: ScheduleCourse[]
  icsRaw: string
  inClassOnHome: boolean
  homeShowLocation: boolean
  homeShowTeacher: boolean
  homeShowNextUpcoming: boolean
  homeAfterClassesLabel: string
}

export type ScheduleManagerInitialData = {
  serverData: Record<string, unknown>
  periodTemplate: SchedulePeriodTemplateItem[]
  courses: ScheduleCourse[]
  compatWarnings: string[]
  icsRaw: string
  inClassOnHome: boolean
  homeShowLocation: boolean
  homeShowTeacher: boolean
  homeShowNextUpcoming: boolean
  homeAfterClassesLabel: string
  scheduleBaseline: ScheduleFormBaseline
}

export interface ScheduleManagerHandle {
  openImport: () => void
  downloadIcs: () => void
}
