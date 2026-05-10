import 'server-only'

import { and, eq, like } from 'drizzle-orm'

import {
  SITE_SETTINGS_CLEAR_LEGACY_SITE_CONFIG_VALUES,
  SITE_SETTINGS_COMPAT_WRITE_BLOCKED_KEYS,
  SITE_SETTINGS_MIGRATED_CORE_KEYS,
  SITE_SETTINGS_RULES_KEYS,
  SITE_SETTINGS_SCHEDULE_CATEGORY_KEYS,
  SITE_SETTINGS_SITE_CONFIG_ID,
  SITE_SETTINGS_THEME_CATEGORY_KEYS,
} from '@/constants/site-settings'
import {
  SITE_SETTINGS_RULES_SCALAR_KEYS,
  SITE_SETTINGS_RULES_STRING_LIST_KEYS,
  SITE_SETTINGS_SCHEDULE_SCALAR_KEYS,
  SITE_SETTINGS_THEME_CUSTOM_SURFACE_BOOLEAN_KEYS,
  SITE_SETTINGS_THEME_CUSTOM_SURFACE_STRING_KEYS,
  SITE_SETTINGS_THEME_SCALAR_KEYS,
} from '@/constants/site-settings-storage'
import { SKILLS_SECRET_KEYS } from '@/constants/skills'
import { clearActivityFeedDataCache } from '@/lib/activity-feed'
import { normalizeAppMessageRules } from '@/lib/app-message-rules'
import { db } from '@/lib/db'
import {
  rateLimitBackups,
  siteConfigV2Entries,
  siteSettingsMigrationMeta,
  siteSettingsV2RuleGroups,
  siteSettingsV2RuleTitleRules,
  siteSettingsV2ScheduleCoursePeriodIds,
  siteSettingsV2ScheduleCourses,
  siteSettingsV2ScheduleCourseTimeSessions,
  siteSettingsV2ScheduleGridDays,
  siteSettingsV2SchedulePeriods,
  siteSettingsV2ThemeCustomSurface,
  siteSettingsV2ThemeCustomSurfaceImagePool,
  siteSettingsV2ThemePublicFontOptions,
  systemSecrets,
} from '@/lib/drizzle-schema'
import { normalizePublicPageFontOptions } from '@/lib/public-page-font'
import { safeSiteConfigUpsert } from '@/lib/safe-site-config-upsert'
import { clearSiteConfigCaches } from '@/lib/site-config-cache'
import { normalizeSiteConfigShape } from '@/lib/site-config-normalize'
import {
  pickSiteConfigBodyFields,
  readLegacySiteConfigRow,
  upsertSiteConfigV2Entries,
} from '@/lib/site-config-v2'
import { sanitizeSiteConfigImagesForClient } from '@/lib/site-image-urls'
import {
  readEffectiveSiteConfig,
  readSiteSettingsMigrationSnapshot,
  readSiteSettingsSnapshot,
} from '@/lib/site-settings-read'
import {
  hasAnyRecordKey,
  omitRecordKeys,
  pickRecordKeys,
} from '@/lib/site-settings-record'
import {
  BuildSiteSettingsScalarEntryRows,
  BuildSiteSettingsStringListEntryRows,
  ReplaceSiteSettingsScalarEntries,
  ReplaceSiteSettingsStringListEntries,
} from '@/lib/site-settings-write-entries'
import {
  CreateSiteSettingsCategoryApiRequiredError,
  CreateSiteSettingsConflictError,
  CreateSiteSettingsMigrationRequiredError,
  CreateSiteSettingsNotFoundError,
  NormalizeSiteSettingsStringOrNull,
  WithSiteSettingsTransaction,
} from '@/lib/site-settings-write-utils'
import { sqlTimestamp } from '@/lib/sql-timestamp'
import { parseThemeCustomSurface } from '@/lib/theme-custom-surface'
import type {
  SiteSettingsMigrationState,
  SiteSettingsRecord,
} from '@/types/site-settings'

async function clearSiteSettingsCaches(): Promise<void> {
  await Promise.all([clearSiteConfigCaches(), clearActivityFeedDataCache()])
}

function pickCoreSiteConfigValues(values: SiteSettingsRecord): SiteSettingsRecord {
  return omitRecordKeys(pickSiteConfigBodyFields(values), [
    ...SITE_SETTINGS_THEME_CATEGORY_KEYS,
    ...SITE_SETTINGS_SCHEDULE_CATEGORY_KEYS,
    ...SITE_SETTINGS_RULES_KEYS,
  ])
}

async function replaceSiteConfigCoreEntries(
  executor: any,
  values: SiteSettingsRecord,
): Promise<void> {
  await executor
    .delete(siteConfigV2Entries)
    .where(eq(siteConfigV2Entries.siteConfigId, SITE_SETTINGS_SITE_CONFIG_ID))

  const coreValues = pickCoreSiteConfigValues(values)
  if (Object.keys(coreValues).length > 0) {
    await upsertSiteConfigV2Entries(coreValues, executor)
  }
}

function buildThemeCustomSurfaceRow(rawSurface: unknown): {
  row: SiteSettingsRecord | null
  imagePoolRows: SiteSettingsRecord[]
} {
  const surface = parseThemeCustomSurface(rawSurface)
  const now = sqlTimestamp()
  const row: SiteSettingsRecord = {
    siteConfigId: SITE_SETTINGS_SITE_CONFIG_ID,
    createdAt: now,
    updatedAt: now,
  }
  let hasRowValue = false

  for (const key of SITE_SETTINGS_THEME_CUSTOM_SURFACE_STRING_KEYS) {
    const value = NormalizeSiteSettingsStringOrNull(surface[key])
    row[key] = value
    if (value !== null) {
      hasRowValue = true
    }
  }

  for (const key of SITE_SETTINGS_THEME_CUSTOM_SURFACE_BOOLEAN_KEYS) {
    const value = typeof surface[key] === 'boolean' ? surface[key] : null
    row[key] = value
    if (value !== null) {
      hasRowValue = true
    }
  }

  const imagePool = Array.isArray(surface.backgroundImagePool)
    ? surface.backgroundImagePool.map((item) => String(item ?? '')).filter((item) => item.length > 0)
    : []

  const imagePoolRows = imagePool.map((imageUrl, position) => ({
    siteConfigId: SITE_SETTINGS_SITE_CONFIG_ID,
    imageUrl,
    position,
    createdAt: now,
    updatedAt: now,
  }))

  if (imagePoolRows.length > 0) {
    hasRowValue = true
  }

  return {
    row: hasRowValue ? row : null,
    imagePoolRows,
  }
}

async function replaceThemeSettingsRows(
  executor: any,
  values: SiteSettingsRecord,
): Promise<void> {
  await ReplaceSiteSettingsScalarEntries(
    executor,
    'theme',
    BuildSiteSettingsScalarEntryRows('theme', values, SITE_SETTINGS_THEME_SCALAR_KEYS),
  )

  const { row, imagePoolRows } = buildThemeCustomSurfaceRow(values.themeCustomSurface)

  await executor
    .delete(siteSettingsV2ThemeCustomSurfaceImagePool)
    .where(
      eq(siteSettingsV2ThemeCustomSurfaceImagePool.siteConfigId, SITE_SETTINGS_SITE_CONFIG_ID),
    )

  if (imagePoolRows.length > 0) {
    await executor.insert(siteSettingsV2ThemeCustomSurfaceImagePool).values(imagePoolRows as never)
  }

  if (!row) {
    await executor
      .delete(siteSettingsV2ThemeCustomSurface)
      .where(eq(siteSettingsV2ThemeCustomSurface.siteConfigId, SITE_SETTINGS_SITE_CONFIG_ID))
  } else {
    await executor
      .insert(siteSettingsV2ThemeCustomSurface)
      .values(row as never)
      .onConflictDoUpdate({
        target: siteSettingsV2ThemeCustomSurface.siteConfigId,
        set: {
          ...omitRecordKeys(row, ['siteConfigId', 'createdAt']),
          updatedAt: row.updatedAt,
        } as never,
      })
  }

  await executor
    .delete(siteSettingsV2ThemePublicFontOptions)
    .where(eq(siteSettingsV2ThemePublicFontOptions.siteConfigId, SITE_SETTINGS_SITE_CONFIG_ID))

  const publicFontOptions = normalizePublicPageFontOptions(values.publicFontOptions)
  if (publicFontOptions.length > 0) {
    const now = sqlTimestamp()
    await executor.insert(siteSettingsV2ThemePublicFontOptions).values(
      publicFontOptions.map((option, position) => ({
        siteConfigId: SITE_SETTINGS_SITE_CONFIG_ID,
        mode: option.mode,
        label: option.label,
        family: option.family,
        url: option.url ?? null,
        position,
        createdAt: now,
        updatedAt: now,
      })) as never,
    )
  }
}

async function replaceScheduleSettingsRows(
  executor: any,
  values: SiteSettingsRecord,
): Promise<void> {
  await ReplaceSiteSettingsScalarEntries(
    executor,
    'schedule',
    BuildSiteSettingsScalarEntryRows('schedule', values, SITE_SETTINGS_SCHEDULE_SCALAR_KEYS),
  )

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

  const now = sqlTimestamp()

  const periodTemplate = Array.isArray(values.schedulePeriodTemplate)
    ? values.schedulePeriodTemplate
    : []
  if (periodTemplate.length > 0) {
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

  const gridByWeekday = Array.isArray(values.scheduleGridByWeekday)
    ? values.scheduleGridByWeekday
    : []
  if (gridByWeekday.length > 0) {
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

async function replaceRulesSettingsRows(
  executor: any,
  values: SiteSettingsRecord,
): Promise<void> {
  await ReplaceSiteSettingsScalarEntries(
    executor,
    'rules',
    BuildSiteSettingsScalarEntryRows('rules', values, SITE_SETTINGS_RULES_SCALAR_KEYS),
  )

  const stringListRows = SITE_SETTINGS_RULES_STRING_LIST_KEYS.flatMap((listKey) =>
    BuildSiteSettingsStringListEntryRows('rules', listKey, values[listKey]),
  )
  await ReplaceSiteSettingsStringListEntries(executor, 'rules', stringListRows)

  await executor
    .delete(siteSettingsV2RuleTitleRules)
    .where(eq(siteSettingsV2RuleTitleRules.siteConfigId, SITE_SETTINGS_SITE_CONFIG_ID))
  await executor
    .delete(siteSettingsV2RuleGroups)
    .where(eq(siteSettingsV2RuleGroups.siteConfigId, SITE_SETTINGS_SITE_CONFIG_ID))

  const rules = normalizeAppMessageRules(values.appMessageRules)
  if (rules.length === 0) {
    return
  }

  const now = sqlTimestamp()
  const groupRows = rules.map((group, position) => ({
    siteConfigId: SITE_SETTINGS_SITE_CONFIG_ID,
    groupId: group.id,
    processMatch: String(group.processMatch ?? ''),
    defaultText: NormalizeSiteSettingsStringOrNull(group.defaultText),
    position,
    createdAt: now,
    updatedAt: now,
  }))
  const titleRuleRows = rules.flatMap((group) =>
    (Array.isArray(group.titleRules) ? group.titleRules : []).map((titleRule, position) => ({
      siteConfigId: SITE_SETTINGS_SITE_CONFIG_ID,
      groupId: group.id,
      titleRuleId: titleRule.id,
      mode: titleRule.mode === 'regex' ? 'regex' : 'plain',
      pattern: String(titleRule.pattern ?? ''),
      textValue: String(titleRule.text ?? ''),
      position,
      createdAt: now,
      updatedAt: now,
    })),
  )

  await executor.insert(siteSettingsV2RuleGroups).values(groupRows as never)
  if (titleRuleRows.length > 0) {
    await executor.insert(siteSettingsV2RuleTitleRules).values(titleRuleRows as never)
  }
}

async function upsertMigrationMetaRow(
  executor: any,
  values: {
    migrationState: SiteSettingsMigrationState
    migratedAt?: unknown
    legacyDataClearedAt?: unknown
  },
): Promise<void> {
  const now = sqlTimestamp()
  await executor
    .insert(siteSettingsMigrationMeta)
    .values({
      siteConfigId: SITE_SETTINGS_SITE_CONFIG_ID,
      migrationState: values.migrationState,
      migratedAt: values.migratedAt ?? null,
      legacyDataClearedAt: values.legacyDataClearedAt ?? null,
      createdAt: now,
      updatedAt: now,
    } as never)
    .onConflictDoUpdate({
      target: siteSettingsMigrationMeta.siteConfigId,
      set: {
        migrationState: values.migrationState,
        migratedAt: values.migratedAt ?? null,
        legacyDataClearedAt: values.legacyDataClearedAt ?? null,
        updatedAt: now,
      } as never,
    })
}

async function clearLegacyAuxiliaryData(executor: any): Promise<void> {
  await executor
    .delete(systemSecrets)
    .where(
      like(
        systemSecrets.key,
        `${SKILLS_SECRET_KEYS.skillsOauthAuthorizeCodePrefix}%`,
      ),
    )

  await executor.delete(rateLimitBackups)
}

async function persistSiteConfigSubset(
  executor: any,
  preparedValues: SiteSettingsRecord,
  siteConfigKeys: readonly string[],
): Promise<void> {
  const update = pickRecordKeys(preparedValues, siteConfigKeys)
  if (Object.keys(update).length === 0) {
    return
  }

  await safeSiteConfigUpsert(
    {
      where: { id: SITE_SETTINGS_SITE_CONFIG_ID },
      update,
      create: {
        id: SITE_SETTINGS_SITE_CONFIG_ID,
        ...preparedValues,
      },
    },
    executor,
  )
}

async function readMigrationState(executor: any): Promise<SiteSettingsMigrationState> {
  return (await readSiteSettingsMigrationSnapshot(executor)).migrationState
}

function assertMigratedState(migrationState: SiteSettingsMigrationState): void {
  if (migrationState === 'legacy') {
    throw CreateSiteSettingsMigrationRequiredError()
  }
}

function hasPersistedSplitRows(
  snapshot: Awaited<ReturnType<typeof readSiteSettingsSnapshot>>,
): boolean {
  return (
    snapshot.coreSiteConfigRow !== null &&
    snapshot.themeRowCount > 0 &&
    snapshot.scheduleRowCount > 0 &&
    snapshot.rulesRowCount > 0
  )
}

async function writeAllV2SiteSettings(
  executor: any,
  values: SiteSettingsRecord,
): Promise<void> {
  await replaceSiteConfigCoreEntries(executor, values)
  await replaceThemeSettingsRows(executor, values)
  await replaceScheduleSettingsRows(executor, values)
  await replaceRulesSettingsRows(executor, values)
}

export async function persistThemeSettingsFromPrepared(
  preparedValues: SiteSettingsRecord,
  executor: any = db,
): Promise<Record<string, unknown> | null> {
  const migrationState = await readMigrationState(executor)
  assertMigratedState(migrationState)

  await WithSiteSettingsTransaction(executor, async (tx) => {
    await replaceThemeSettingsRows(tx, preparedValues)
  })

  await clearSiteSettingsCaches()
  const data = await readEffectiveSiteConfig()
  return data ? sanitizeSiteConfigImagesForClient(data, 'admin') : null
}

export async function persistCompatibilitySiteConfigValues(
  preparedValues: SiteSettingsRecord,
  requestedBody: SiteSettingsRecord,
  executor: any = db,
): Promise<Record<string, unknown> | null> {
  if (hasAnyRecordKey(requestedBody, SITE_SETTINGS_COMPAT_WRITE_BLOCKED_KEYS)) {
    const migrationState = await readMigrationState(executor)
    if (migrationState === 'legacy') {
      throw CreateSiteSettingsMigrationRequiredError()
    }
    throw CreateSiteSettingsCategoryApiRequiredError('该配置已迁移到分类接口，请使用新的分类保存接口')
  }

  const migrationState = await readMigrationState(executor)
  if (migrationState === 'legacy') {
    await persistSiteConfigSubset(executor, preparedValues, Object.keys(requestedBody))
  } else {
    await WithSiteSettingsTransaction(executor, async (tx) => {
      await replaceSiteConfigCoreEntries(tx, preparedValues)
    })
  }

  await clearSiteSettingsCaches()
  const data = await readEffectiveSiteConfig()
  return data ? sanitizeSiteConfigImagesForClient(data, 'admin') : null
}

export async function persistScheduleSettingsFromPrepared(
  preparedValues: SiteSettingsRecord,
  executor: any = db,
): Promise<Record<string, unknown> | null> {
  const migrationState = await readMigrationState(executor)
  assertMigratedState(migrationState)

  await WithSiteSettingsTransaction(executor, async (tx) => {
    await replaceScheduleSettingsRows(tx, preparedValues)
  })

  await clearSiteSettingsCaches()
  const data = await readEffectiveSiteConfig()
  return data ? sanitizeSiteConfigImagesForClient(data, 'admin') : null
}

export async function persistCoreSettingsFromPrepared(
  preparedValues: SiteSettingsRecord,
  requestedBody: SiteSettingsRecord,
  executor: any = db,
): Promise<Record<string, unknown> | null> {
  const migrationState = await readMigrationState(executor)

  if (
    migrationState === 'legacy' &&
    hasAnyRecordKey(requestedBody, SITE_SETTINGS_MIGRATED_CORE_KEYS)
  ) {
    throw CreateSiteSettingsMigrationRequiredError()
  }

  if (migrationState === 'legacy') {
    await persistSiteConfigSubset(executor, preparedValues, Object.keys(requestedBody))
  } else {
    await WithSiteSettingsTransaction(executor, async (tx) => {
      await replaceSiteConfigCoreEntries(tx, preparedValues)
    })
  }

  await clearSiteSettingsCaches()
  const data = await readEffectiveSiteConfig()
  return data ? sanitizeSiteConfigImagesForClient(data, 'admin') : null
}

export async function persistRulesSettingsValues(
  values: SiteSettingsRecord,
  executor: any = db,
): Promise<void> {
  const migrationState = await readMigrationState(executor)
  assertMigratedState(migrationState)

  const effectiveConfig = await readEffectiveSiteConfig(executor)
  if (!effectiveConfig) {
    throw CreateSiteSettingsNotFoundError('未找到网页配置，请先完成初始化配置')
  }

  const mergedValues = {
    ...effectiveConfig,
    ...pickRecordKeys(values, SITE_SETTINGS_RULES_KEYS),
  }

  await WithSiteSettingsTransaction(executor, async (tx) => {
    await replaceRulesSettingsRows(tx, mergedValues)
  })

  await clearSiteSettingsCaches()
}

export async function bootstrapSiteSettingsSplitStorage(executor: any = db): Promise<void> {
  const snapshot = await readSiteSettingsSnapshot(executor)
  const legacySiteConfigRow = snapshot.legacySiteConfigRow ?? (await readLegacySiteConfigRow(executor))
  if (!legacySiteConfigRow) {
    throw CreateSiteSettingsNotFoundError('未找到网页配置，请先完成初始化配置')
  }

  const sourceValues =
    snapshot.migration.migrationState === 'legacy'
      ? normalizeSiteConfigShape(legacySiteConfigRow)
      : await readEffectiveSiteConfig(executor)

  if (!sourceValues) {
    throw CreateSiteSettingsNotFoundError('未找到网页配置，请先完成初始化配置')
  }

  const migratedAt = snapshot.migration.migratedAt ?? sqlTimestamp()
  const migrationState =
    snapshot.migration.migrationState === 'legacy_cleared' ? 'legacy_cleared' : 'migrated'

  await WithSiteSettingsTransaction(executor, async (tx) => {
    await writeAllV2SiteSettings(tx, sourceValues)
    await upsertMigrationMetaRow(tx, {
      migrationState,
      migratedAt,
      legacyDataClearedAt:
        migrationState === 'legacy_cleared'
          ? snapshot.migration.legacyDataClearedAt ?? null
          : null,
    })
  })

  await clearSiteSettingsCaches()
}

export async function migrateLegacySiteSettings(
  executor: any = db,
): Promise<{
  migrationState: SiteSettingsMigrationState
  changed: boolean
}> {
  const snapshot = await readSiteSettingsSnapshot(executor)
  if (!snapshot.legacySiteConfigRow) {
    throw CreateSiteSettingsNotFoundError('未找到网页配置，请先完成初始化配置')
  }

  if (snapshot.migration.migrationState !== 'legacy') {
    if (!hasPersistedSplitRows(snapshot)) {
      await bootstrapSiteSettingsSplitStorage(executor)
      return {
        migrationState:
          snapshot.migration.migrationState === 'legacy_cleared'
            ? 'legacy_cleared'
            : 'migrated',
        changed: true,
      }
    }
    return {
      migrationState: snapshot.migration.migrationState,
      changed: false,
    }
  }

  await bootstrapSiteSettingsSplitStorage(executor)
  return {
    migrationState: 'migrated',
    changed: true,
  }
}

export async function clearLegacySiteSettingsData(
  executor: any = db,
): Promise<{
  migrationState: SiteSettingsMigrationState
  changed: boolean
}> {
  const snapshot = await readSiteSettingsSnapshot(executor)
  if (!snapshot.legacySiteConfigRow) {
    throw CreateSiteSettingsNotFoundError('未找到网页配置，请先完成初始化配置')
  }

  if (snapshot.migration.migrationState === 'legacy') {
    throw CreateSiteSettingsMigrationRequiredError('请先完成迁移，再清理旧数据')
  }
  if (snapshot.migration.migrationState === 'legacy_cleared') {
    throw CreateSiteSettingsConflictError('旧数据已清理')
  }

  const effectiveConfig = await readEffectiveSiteConfig(executor)
  if (!effectiveConfig) {
    throw CreateSiteSettingsNotFoundError('未找到网页配置，请先完成初始化配置')
  }

  const legacyDataClearedAt = sqlTimestamp()
  await WithSiteSettingsTransaction(executor, async (tx) => {
    await writeAllV2SiteSettings(tx, effectiveConfig)
    await clearLegacyAuxiliaryData(tx)
    await safeSiteConfigUpsert(
      {
        where: { id: SITE_SETTINGS_SITE_CONFIG_ID },
        update: SITE_SETTINGS_CLEAR_LEGACY_SITE_CONFIG_VALUES,
        create: {
          id: SITE_SETTINGS_SITE_CONFIG_ID,
          ...SITE_SETTINGS_CLEAR_LEGACY_SITE_CONFIG_VALUES,
        },
      },
      tx,
    )
    await upsertMigrationMetaRow(tx, {
      migrationState: 'legacy_cleared',
      migratedAt: snapshot.migration.migratedAt ?? null,
      legacyDataClearedAt,
    })
  })

  await clearSiteSettingsCaches()
  return {
    migrationState: 'legacy_cleared',
    changed: true,
  }
}
