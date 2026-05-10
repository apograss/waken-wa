import 'server-only'

import { eq } from 'drizzle-orm'

import { SITE_SETTINGS_SITE_CONFIG_ID } from '@/constants/site-settings'
import { SITE_SETTINGS_SCHEDULE_SCALAR_KEYS } from '@/constants/site-settings-storage'
import {
  siteSettingsV2ScheduleCoursePeriodIds,
  siteSettingsV2ScheduleCourses,
  siteSettingsV2ScheduleCourseTimeSessions,
  siteSettingsV2ScheduleGridDays,
  siteSettingsV2SchedulePeriods,
} from '@/lib/drizzle-schema'
import {
  BuildSiteSettingsScalarEntryRows,
  ReplaceSiteSettingsScalarEntries,
} from '@/lib/site-settings-write-entries'
import { NormalizeSiteSettingsStringOrNull } from '@/lib/site-settings-write-utils'
import { sqlTimestamp } from '@/lib/sql-timestamp'
import type { SiteSettingsRecord } from '@/types/site-settings'

async function DeleteScheduleSettingsRows(executor: any): Promise<void> {
  await executor
    .delete(siteSettingsV2ScheduleCourseTimeSessions)
    .where(
      eq(siteSettingsV2ScheduleCourseTimeSessions.siteConfigId, SITE_SETTINGS_SITE_CONFIG_ID),
    )
  await executor
    .delete(siteSettingsV2ScheduleCoursePeriodIds)
    .where(eq(siteSettingsV2ScheduleCoursePeriodIds.siteConfigId, SITE_SETTINGS_SITE_CONFIG_ID))
  await executor
    .delete(siteSettingsV2ScheduleCourses)
    .where(eq(siteSettingsV2ScheduleCourses.siteConfigId, SITE_SETTINGS_SITE_CONFIG_ID))
  await executor
    .delete(siteSettingsV2SchedulePeriods)
    .where(eq(siteSettingsV2SchedulePeriods.siteConfigId, SITE_SETTINGS_SITE_CONFIG_ID))
  await executor
    .delete(siteSettingsV2ScheduleGridDays)
    .where(eq(siteSettingsV2ScheduleGridDays.siteConfigId, SITE_SETTINGS_SITE_CONFIG_ID))
}

async function InsertSchedulePeriodRows(
  executor: any,
  values: SiteSettingsRecord,
  now: unknown,
): Promise<void> {
  const periodTemplate = Array.isArray(values.schedulePeriodTemplate)
    ? values.schedulePeriodTemplate
    : []
  if (periodTemplate.length === 0) return

  await executor.insert(siteSettingsV2SchedulePeriods).values(
    periodTemplate
      .map((item, position) => {
        const record = item && typeof item === 'object' ? (item as SiteSettingsRecord) : {}
        const periodId = String(record.id ?? '')
        const label = String(record.label ?? '')
        const part = String(record.part ?? '')
        const startTime = String(record.startTime ?? '')
        const endTime = String(record.endTime ?? '')
        if (!periodId || !label || !part || !startTime || !endTime) {
          return null
        }
        return {
          siteConfigId: SITE_SETTINGS_SITE_CONFIG_ID,
          periodId,
          label,
          part,
          startTime,
          endTime,
          sortOrder: Number.isFinite(Number(record.order)) ? Number(record.order) : position,
          position,
          createdAt: now,
          updatedAt: now,
        }
      })
      .filter((item) => item !== null) as never,
  )
}

async function InsertScheduleGridRows(
  executor: any,
  values: SiteSettingsRecord,
  now: unknown,
): Promise<void> {
  const gridByWeekday = Array.isArray(values.scheduleGridByWeekday)
    ? values.scheduleGridByWeekday
    : []
  if (gridByWeekday.length === 0) return

  await executor.insert(siteSettingsV2ScheduleGridDays).values(
    gridByWeekday
      .map((item, position) => {
        const record = item && typeof item === 'object' ? (item as SiteSettingsRecord) : {}
        const rangeStart = String(record.rangeStart ?? '')
        const rangeEnd = String(record.rangeEnd ?? '')
        const intervalMinutes = Number(record.intervalMinutes)
        if (!rangeStart || !rangeEnd || !Number.isFinite(intervalMinutes)) {
          return null
        }
        return {
          siteConfigId: SITE_SETTINGS_SITE_CONFIG_ID,
          weekday: Number.isFinite(Number(record.weekday)) ? Number(record.weekday) : position,
          rangeStart,
          rangeEnd,
          intervalMinutes,
          useFixedInterval: record.useFixedInterval === true,
          position,
          createdAt: now,
          updatedAt: now,
        }
      })
      .filter((item) => item !== null) as never,
  )
}

async function InsertScheduleCourseRows(
  executor: any,
  values: SiteSettingsRecord,
  now: unknown,
): Promise<void> {
  const courses = Array.isArray(values.scheduleCourses) ? values.scheduleCourses : []
  const courseRows: SiteSettingsRecord[] = []
  const timeSessionRows: SiteSettingsRecord[] = []
  const periodIdRows: SiteSettingsRecord[] = []

  courses.forEach((item, position) => {
    const record = item && typeof item === 'object' ? (item as SiteSettingsRecord) : {}
    const courseId = String(record.id ?? '')
    const title = String(record.title ?? '')
    const weekday = Number(record.weekday)
    const startTime = String(record.startTime ?? '')
    const endTime = String(record.endTime ?? '')
    const anchorDate = String(record.anchorDate ?? '')
    if (!courseId || !title || !Number.isFinite(weekday) || !startTime || !endTime || !anchorDate) {
      return
    }

    courseRows.push({
      siteConfigId: SITE_SETTINGS_SITE_CONFIG_ID,
      courseId,
      title,
      location: NormalizeSiteSettingsStringOrNull(record.location),
      teacher: NormalizeSiteSettingsStringOrNull(record.teacher),
      weekday,
      startTime,
      endTime,
      timeMode: NormalizeSiteSettingsStringOrNull(record.timeMode),
      anchorDate,
      untilDate: NormalizeSiteSettingsStringOrNull(record.untilDate),
      position,
      createdAt: now,
      updatedAt: now,
    })

    const timeSessions = Array.isArray(record.timeSessions) ? record.timeSessions : []
    timeSessions.forEach((timeSession, timePosition) => {
      const sessionRecord =
        timeSession && typeof timeSession === 'object'
          ? (timeSession as SiteSettingsRecord)
          : {}
      const sessionStartTime = String(sessionRecord.startTime ?? '')
      const sessionEndTime = String(sessionRecord.endTime ?? '')
      if (!sessionStartTime || !sessionEndTime) return
      timeSessionRows.push({
        siteConfigId: SITE_SETTINGS_SITE_CONFIG_ID,
        courseId,
        startTime: sessionStartTime,
        endTime: sessionEndTime,
        position: timePosition,
        createdAt: now,
        updatedAt: now,
      })
    })

    const periodIds = Array.isArray(record.periodIds) ? record.periodIds : []
    periodIds.forEach((periodId, periodPosition) => {
      const normalizedPeriodId = String(periodId ?? '')
      if (!normalizedPeriodId) return
      periodIdRows.push({
        siteConfigId: SITE_SETTINGS_SITE_CONFIG_ID,
        courseId,
        periodId: normalizedPeriodId,
        position: periodPosition,
        createdAt: now,
        updatedAt: now,
      })
    })
  })

  if (courseRows.length > 0) {
    await executor.insert(siteSettingsV2ScheduleCourses).values(courseRows as never)
  }
  if (timeSessionRows.length > 0) {
    await executor
      .insert(siteSettingsV2ScheduleCourseTimeSessions)
      .values(timeSessionRows as never)
  }
  if (periodIdRows.length > 0) {
    await executor
      .insert(siteSettingsV2ScheduleCoursePeriodIds)
      .values(periodIdRows as never)
  }
}

export async function ReplaceScheduleSettingsRows(
  executor: any,
  values: SiteSettingsRecord,
): Promise<void> {
  await ReplaceSiteSettingsScalarEntries(
    executor,
    'schedule',
    BuildSiteSettingsScalarEntryRows('schedule', values, SITE_SETTINGS_SCHEDULE_SCALAR_KEYS),
  )

  await DeleteScheduleSettingsRows(executor)

  const now = sqlTimestamp()
  await InsertSchedulePeriodRows(executor, values, now)
  await InsertScheduleGridRows(executor, values, now)
  await InsertScheduleCourseRows(executor, values, now)
}
