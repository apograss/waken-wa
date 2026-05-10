'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import { useT } from 'next-i18next/client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import {
  exportAdminSettings,
  fetchAdminDeviceSummaries,
  fetchAdminSettings,
  fetchAdminSettingsMigration,
  fetchAdminSkills,
} from '@/components/admin/admin-query-fetchers'
import { adminQueryKeys } from '@/components/admin/admin-query-keys'
import {
  clearAdminLegacySettingsData,
  importAdminRuleTools,
  migrateAdminSettings,
  patchAdminSettingsCore,
  patchAdminSettingsSchedule,
  patchAdminSettingsTheme,
  patchAdminSkills,
} from '@/components/admin/admin-query-mutations'
import {
  formatNumberRange,
  parseIntegerInRange,
} from '@/components/admin/number-setting-input'
import {
  areValuesEqual,
  buildWebSettingsForm,
  hasKeyDiff,
  normalizeCorePayloadForComparison,
  normalizeStringList,
  uploadImportedImageSources,
} from '@/components/admin/web-settings-controller-utils'
import {
  webSettingsBaselineFormAtom,
  webSettingsBaselineSkillsConfigAtom,
  webSettingsCropDialogOpenAtom,
  webSettingsCropSourceUrlAtom,
  webSettingsCropTargetAtom,
  webSettingsFormAtom,
  webSettingsImportConfigDialogOpenAtom,
  webSettingsImportConfigInputAtom,
  webSettingsInspirationDevicesAtom,
  webSettingsLegacyMcpConfiguredAtom,
  webSettingsLegacyMcpGeneratedApiKeyAtom,
  webSettingsLoadingAtom,
  webSettingsMigrationAtom,
  webSettingsPublicOriginAtom,
  webSettingsRedisCacheServerlessForcedAtom,
  webSettingsSavingAtom,
  webSettingsSkillsAiAuthorizationsAtom,
  webSettingsSkillsApiKeyConfiguredAtom,
  webSettingsSkillsAuthModeAtom,
  webSettingsSkillsEnabledAtom,
  webSettingsSkillsGeneratedApiKeyAtom,
  webSettingsSkillsOauthConfiguredAtom,
  webSettingsSkillsOauthTokenTtlMinutesAtom,
  webSettingsSkillsRevokingAiClientIdAtom,
  webSettingsSkillsSavingAtom,
} from '@/components/admin/web-settings-store'
import {
  extractRuleToolsImportFromWebPayload,
  normalizeSkillsAiAuthorizations,
  normalizeSkillsEditableConfig,
  parseExportPayload,
  webPayloadToFormPatch,
} from '@/components/admin/web-settings-utils'
import {
  REDIS_ACTIVITY_FEED_CACHE_TTL_DEFAULT_SECONDS,
  REDIS_ACTIVITY_FEED_CACHE_TTL_MAX_SECONDS,
} from '@/constants/activity-api'
import {
  SITE_CONFIG_HISTORY_WINDOW_MAX_MINUTES,
  SITE_CONFIG_HISTORY_WINDOW_MIN_MINUTES,
  SITE_CONFIG_PROCESS_STALE_MAX_SECONDS,
  SITE_CONFIG_PROCESS_STALE_MIN_SECONDS,
} from '@/constants/site-config'
import {
  SITE_SETTINGS_CORE_HEAVY_KEYS,
  SITE_SETTINGS_MIGRATED_CORE_KEYS,
  SITE_SETTINGS_SCHEDULE_CATEGORY_KEYS,
  SITE_SETTINGS_THEME_CATEGORY_KEYS,
} from '@/constants/site-settings'
import {
  normalizeAdminThemeColor,
  writeAdminBackgroundColor,
  writeAdminThemeColor,
} from '@/lib/admin-theme-color'
import { isRemoteAvatarUrl } from '@/lib/avatar-url'
import { normalizeProfileOnlineAccentColor } from '@/lib/profile-online-accent-color'
import { omitRecordKeys, pickRecordKeys } from '@/lib/site-settings-record'
import type { SiteConfig, SkillsEditableConfig } from '@/types/web-settings'

export function useWebSettingsController() {
  const { t } = useT('admin')
  const queryClient = useQueryClient()
  const [loading, setLoading] = useAtom(webSettingsLoadingAtom)
  const [saving, setSaving] = useAtom(webSettingsSavingAtom)
  const [, setSkillsSaving] = useAtom(webSettingsSkillsSavingAtom)
  const [skillsEnabled, setSkillsEnabled] = useAtom(webSettingsSkillsEnabledAtom)
  const [skillsAuthMode, setSkillsAuthMode] = useAtom(webSettingsSkillsAuthModeAtom)
  const [, setSkillsApiKeyConfigured] = useAtom(webSettingsSkillsApiKeyConfiguredAtom)
  const [, setSkillsOauthConfigured] = useAtom(webSettingsSkillsOauthConfiguredAtom)
  const [skillsOauthTokenTtlMinutes, setSkillsOauthTokenTtlMinutes] = useAtom(
    webSettingsSkillsOauthTokenTtlMinutesAtom,
  )
  const [, setSkillsAiAuthorizations] = useAtom(webSettingsSkillsAiAuthorizationsAtom)
  const [, setSkillsRevokingAiClientId] = useAtom(webSettingsSkillsRevokingAiClientIdAtom)
  const [, setSkillsGeneratedApiKey] = useAtom(webSettingsSkillsGeneratedApiKeyAtom)
  const [, setLegacyMcpConfigured] = useAtom(webSettingsLegacyMcpConfiguredAtom)
  const [, setLegacyMcpGeneratedApiKey] = useAtom(webSettingsLegacyMcpGeneratedApiKeyAtom)
  const [migration, setMigration] = useAtom(webSettingsMigrationAtom)
  const [, setPublicOrigin] = useAtom(webSettingsPublicOriginAtom)
  const [importConfigDialogOpen, setImportConfigDialogOpen] = useAtom(
    webSettingsImportConfigDialogOpenAtom,
  )
  const [importConfigInput, setImportConfigInput] = useAtom(webSettingsImportConfigInputAtom)
  const [cropSourceUrl, setCropSourceUrl] = useAtom(webSettingsCropSourceUrlAtom)
  const [cropDialogOpen, setCropDialogOpen] = useAtom(webSettingsCropDialogOpenAtom)
  const [cropTarget, setCropTarget] = useAtom(webSettingsCropTargetAtom)
  const [, setInspirationDevices] = useAtom(webSettingsInspirationDevicesAtom)
  const [baselineForm, setBaselineForm] = useAtom(webSettingsBaselineFormAtom)
  const [baselineSkillsConfig, setBaselineSkillsConfig] = useAtom(
    webSettingsBaselineSkillsConfigAtom,
  )
  const [, setRedisCacheServerlessForced] = useAtom(webSettingsRedisCacheServerlessForcedAtom)
  const [form, setForm] = useAtom(webSettingsFormAtom)
  const baselineAppearanceRef = useRef({
    adminThemeColor: '',
    adminBackgroundColor: '',
  })
  const webSettingsDirtyRef = useRef(false)
  const [migrationActionPending, setMigrationActionPending] = useState(false)

  const inspirationDevicesQuery = useQuery({
    queryKey: adminQueryKeys.devices.list({ limit: 200 }),
    queryFn: () => fetchAdminDeviceSummaries({ limit: 200 }),
  })

  const migrationQuery = useQuery({
    queryKey: adminQueryKeys.settings.migration(),
    queryFn: fetchAdminSettingsMigration,
  })

  const skillsQuery = useQuery({
    queryKey: adminQueryKeys.skills.settings(),
    queryFn: fetchAdminSkills,
  })

  const applySkillsConfigData = useCallback((
    skillsData: Awaited<ReturnType<typeof fetchAdminSkills>>,
    options?: {
      updateBaseline?: boolean
      preserveGeneratedKeys?: boolean
    },
  ) => {
    const loadedSkills = normalizeSkillsEditableConfig({
      enabled: skillsData.enabled === true,
      authMode:
        skillsData.authMode === 'oauth' || skillsData.authMode === 'apikey'
          ? skillsData.authMode
          : '',
      oauthTokenTtlMinutes: Number(skillsData.oauthTokenTtlMinutes),
    })
    setSkillsEnabled(loadedSkills.enabled)
    setSkillsAuthMode(loadedSkills.authMode)
    setSkillsApiKeyConfigured(skillsData.apiKeyConfigured === true)
    setSkillsOauthConfigured(skillsData.oauthConfigured === true)
    setSkillsOauthTokenTtlMinutes(loadedSkills.oauthTokenTtlMinutes)
    setSkillsAiAuthorizations(normalizeSkillsAiAuthorizations(skillsData.aiAuthorizations))
    setLegacyMcpConfigured(skillsData.legacyMcpConfigured === true)
    if (!options?.preserveGeneratedKeys) {
      setSkillsGeneratedApiKey(
        typeof skillsData.generatedApiKey === 'string' ? skillsData.generatedApiKey : '',
      )
      setLegacyMcpGeneratedApiKey(
        typeof skillsData.generatedLegacyMcpApiKey === 'string'
          ? skillsData.generatedLegacyMcpApiKey
          : '',
      )
    }
    if (options?.updateBaseline) {
      setBaselineSkillsConfig(structuredClone(loadedSkills))
    }
  }, [
    setBaselineSkillsConfig,
    setLegacyMcpConfigured,
    setLegacyMcpGeneratedApiKey,
    setSkillsAiAuthorizations,
    setSkillsApiKeyConfigured,
    setSkillsAuthMode,
    setSkillsEnabled,
    setSkillsGeneratedApiKey,
    setSkillsOauthConfigured,
    setSkillsOauthTokenTtlMinutes,
  ])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPublicOrigin(window.location.origin)
    }
  }, [setPublicOrigin])

  const buildSiteConfigForm = useCallback(
    (data: Record<string, any>): SiteConfig =>
      buildWebSettingsForm(data, {
        currentlyTextDefault: t('webSettingsBasic.currentlyTextDefault'),
        earlierTextDefault: t('webSettingsBasic.earlierTextDefault'),
      }),
    [t],
  )

  const applySiteConfigData = useCallback((data: Record<string, any>) => {
    const loaded = buildSiteConfigForm(data)
    setRedisCacheServerlessForced(data.redisCacheServerlessForced === true)
    setForm(loaded)
    setBaselineForm(structuredClone(loaded))
  }, [
    buildSiteConfigForm,
    setBaselineForm,
    setForm,
    setRedisCacheServerlessForced,
  ])

  const syncPartiallySavedSettings = useCallback(
    (
      data: Record<string, any>,
      formSnapshot: SiteConfig,
      unsavedKeys: readonly string[],
    ) => {
      const serverForm = buildSiteConfigForm(data)
      setRedisCacheServerlessForced(data.redisCacheServerlessForced === true)
      setBaselineForm(structuredClone(serverForm))

      if (unsavedKeys.length === 0) {
        setForm(serverForm)
        return
      }

      setForm({
        ...serverForm,
        ...pickRecordKeys(
          formSnapshot as unknown as Record<string, unknown>,
          unsavedKeys,
        ),
      } as SiteConfig)
    },
    [
      buildSiteConfigForm,
      setBaselineForm,
      setForm,
      setRedisCacheServerlessForced,
    ],
  )

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchAdminSettings()
        if (data) {
          applySiteConfigData(data)
        }
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [applySiteConfigData, setLoading])

  useEffect(() => {
    baselineAppearanceRef.current = {
      adminThemeColor: baselineForm?.adminThemeColor ?? '',
      adminBackgroundColor: baselineForm?.adminBackgroundColor ?? '',
    }
  }, [baselineForm])

  useEffect(() => {
    if (!baselineForm) return
    writeAdminThemeColor(form.adminThemeColor || null)
    writeAdminBackgroundColor(form.adminBackgroundColor || null)
  }, [
    baselineForm,
    form.adminBackgroundColor,
    form.adminThemeColor,
  ])

  useEffect(() => {
    return () => {
      if (!webSettingsDirtyRef.current) return
      writeAdminThemeColor(baselineAppearanceRef.current.adminThemeColor || null)
      writeAdminBackgroundColor(baselineAppearanceRef.current.adminBackgroundColor || null)
    }
  }, [])

  useEffect(() => {
    if (!skillsQuery.data) return
    applySkillsConfigData(skillsQuery.data, {
      updateBaseline: true,
      preserveGeneratedKeys: true,
    })
  }, [applySkillsConfigData, skillsQuery.data])

  useEffect(() => {
    if (!skillsQuery.error) return
    toast.error(
      skillsQuery.error instanceof Error
        ? skillsQuery.error.message
        : t('query.loadSkillsFailed', { status: 'unknown' }),
    )
  }, [skillsQuery.error, t])

  useEffect(() => {
    if (!migrationQuery.data) return
    setMigration(migrationQuery.data)
  }, [migrationQuery.data, setMigration])

  useEffect(() => {
    if (!migrationQuery.error) return
    toast.error(
      migrationQuery.error instanceof Error
        ? migrationQuery.error.message
        : t('query.loadSettingsFailed', { status: 'unknown' }),
    )
  }, [migrationQuery.error, t])

  useEffect(() => {
    setInspirationDevices(inspirationDevicesQuery.data ?? [])
  }, [inspirationDevicesQuery.data, setInspirationDevices])

  const saveSkillsConfig = async (
    patch: {
      enabled?: boolean
      authMode?: 'oauth' | 'apikey'
      rotateApiKey?: boolean
      rotateLegacyMcpKey?: boolean
      revokeOauthForAiClientId?: string
      oauthTokenTtlMinutes?: number
    },
    options?: { successMessage?: string | null },
  ) => {
    setSkillsSaving(true)
    try {
      const json = await patchAdminSkills(patch)
      setSkillsEnabled(json.enabled === true)
      setSkillsAuthMode(
        json.authMode === 'oauth' || json.authMode === 'apikey'
          ? json.authMode
          : '',
      )
      setSkillsApiKeyConfigured(json.apiKeyConfigured === true)
      setSkillsOauthConfigured(json.oauthConfigured === true)
      setSkillsOauthTokenTtlMinutes(
        Number.isFinite(Number(json.oauthTokenTtlMinutes))
          ? Number(json.oauthTokenTtlMinutes)
          : 60,
      )
      setSkillsAiAuthorizations(normalizeSkillsAiAuthorizations(json.aiAuthorizations))
      setSkillsGeneratedApiKey(
        typeof json.generatedApiKey === 'string' ? json.generatedApiKey : '',
      )
      setLegacyMcpConfigured(json.legacyMcpConfigured === true)
      setLegacyMcpGeneratedApiKey(
        typeof json.generatedLegacyMcpApiKey === 'string'
          ? json.generatedLegacyMcpApiKey
          : '',
      )
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.skills.settings() })
      if (options?.successMessage !== null) {
        toast.success(options?.successMessage || t('webSettingsSkills.toasts.saved'))
      }
    } catch (error) {
      console.error(error)
      toast.error(t('mutation.saveFailed'))
    } finally {
      setSkillsSaving(false)
    }
  }

  const revokeSkillsOauthByAiClientId = async (aiClientId: string) => {
    const normalized = String(aiClientId ?? '').trim().toLowerCase()
    if (!normalized) return
    setSkillsRevokingAiClientId(normalized)
    try {
      await saveSkillsConfig({ revokeOauthForAiClientId: normalized }, { successMessage: null })
      toast.success(t('webSettingsSkills.toasts.revoked', { value: normalized }))
    } finally {
      setSkillsRevokingAiClientId('')
    }
  }

  const refreshSettingsData = useCallback(async () => {
    const data = await fetchAdminSettings()
    queryClient.setQueryData(adminQueryKeys.settings.detail(), data)
    applySiteConfigData(data)
    return data
  }, [applySiteConfigData, queryClient])

  const refreshMigrationData = useCallback(async () => {
    const data = await fetchAdminSettingsMigration()
    queryClient.setQueryData(adminQueryKeys.settings.migration(), data)
    setMigration(data)
    return data
  }, [queryClient, setMigration])

  const themeSettingsDirty = useMemo(() => {
    if (!baselineForm) return false
    return hasKeyDiff(
      form as unknown as Record<string, unknown>,
      baselineForm as unknown as Record<string, unknown>,
      SITE_SETTINGS_THEME_CATEGORY_KEYS,
    )
  }, [baselineForm, form])

  const scheduleSettingsDirty = useMemo(() => {
    if (!baselineForm) return false
    return hasKeyDiff(
      form as unknown as Record<string, unknown>,
      baselineForm as unknown as Record<string, unknown>,
      SITE_SETTINGS_SCHEDULE_CATEGORY_KEYS,
    )
  }, [baselineForm, form])

  const coreHeavySettingsDirty = useMemo(() => {
    if (!baselineForm) return false
    return hasKeyDiff(
      form as unknown as Record<string, unknown>,
      baselineForm as unknown as Record<string, unknown>,
      SITE_SETTINGS_CORE_HEAVY_KEYS,
    )
  }, [baselineForm, form])
  const migratedCoreSettingsDirty = useMemo(() => {
    if (!baselineForm) return false
    return hasKeyDiff(
      form as unknown as Record<string, unknown>,
      baselineForm as unknown as Record<string, unknown>,
      SITE_SETTINGS_MIGRATED_CORE_KEYS,
    )
  }, [baselineForm, form])

  const hasLockedLegacyChanges =
    migration?.heavyEditingLocked === true &&
    (themeSettingsDirty || scheduleSettingsDirty || coreHeavySettingsDirty || migratedCoreSettingsDirty)

  const runSettingsMigration = async () => {
    setMigrationActionPending(true)
    try {
      await migrateAdminSettings()
      await Promise.all([
        refreshSettingsData(),
        refreshMigrationData(),
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.ruleTools.summary() }),
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.ruleTools.config() }),
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.ruleTools.rulesPreview() }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'rule-tools', 'rules'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'rule-tools', 'list'] }),
      ])
      toast.success(t('webSettingsMigration.toasts.migrated'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.networkErrorRetry'))
    } finally {
      setMigrationActionPending(false)
    }
  }

  const clearLegacyData = async () => {
    setMigrationActionPending(true)
    try {
      await clearAdminLegacySettingsData()
      await Promise.all([
        refreshSettingsData(),
        refreshMigrationData(),
      ])
      toast.success(t('webSettingsMigration.toasts.legacyDataCleared'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.networkErrorRetry'))
    } finally {
      setMigrationActionPending(false)
    }
  }

  const save = async () => {
    setSaving(true)
    try {
      const poTrim = form.profileOnlineAccentColor.trim()
      if (poTrim && !normalizeProfileOnlineAccentColor(poTrim)) {
        toast.error(t('webSettingsActivity.profileOnlineAccentInvalid'))
        setSaving(false)
        return
      }
      if (hasLockedLegacyChanges) {
        toast.error(t('webSettingsMigration.lockedToast'))
        setSaving(false)
        return
      }

      const adminThemeColor = normalizeAdminThemeColor(form.adminThemeColor)
      const adminBackgroundColor = normalizeAdminThemeColor(form.adminBackgroundColor)

      const {
        adminThemeColor: _formAdminThemeColor,
        adminBackgroundColor: _formAdminBackgroundColor,
        inspirationDeviceRestrictionEnabled,
        inspirationAllowedDeviceHashes: inspirationHashSelection,
        hcaptchaSecretKey: hcaptchaSecretKeyForm,
        steamApiKey: steamApiKeyForm,
        ...formRest
      } = form

      const validateRange = (
        label: string,
        raw: unknown,
        min: number,
        max: number,
      ): number | null => {
        const value = parseIntegerInRange(raw, min, max)
        if (value !== null) return value
        toast.error(`${label}: ${t('common.numberRange', { range: formatNumberRange(min, max) })}`)
        return null
      }

      const normalizedHistoryWindowMinutes = validateRange(
        t('webSettingsActivity.historyWindowLabel'),
        formRest.historyWindowMinutes,
        SITE_CONFIG_HISTORY_WINDOW_MIN_MINUTES,
        SITE_CONFIG_HISTORY_WINDOW_MAX_MINUTES,
      )
      const normalizedProcessStaleSeconds = validateRange(
        t('webSettingsActivity.processStaleLabel'),
        formRest.processStaleSeconds,
        SITE_CONFIG_PROCESS_STALE_MIN_SECONDS,
        SITE_CONFIG_PROCESS_STALE_MAX_SECONDS,
      )
      const normalizedMediaCoverMaxCount = validateRange(
        t('webSettingsActivity.mediaCoverMaxCountLabel'),
        formRest.mediaCoverMaxCount,
        0,
        500,
      )
      const normalizedRedisTtl = validateRange(
        t('webSettingsActivity.redisCacheTtlLabel'),
        formRest.redisCacheTtlSeconds,
        1,
        REDIS_ACTIVITY_FEED_CACHE_TTL_MAX_SECONDS,
      )
      const normalizedStatusCardWidth = validateRange(
        t('webSettingsActivity.statusCard.widthLabel'),
        formRest.statusCardWidth,
        280,
        1200,
      )
      const normalizedStatusCardHeight = validateRange(
        t('webSettingsActivity.statusCard.heightLabel'),
        formRest.statusCardHeight,
        1,
        720,
      )
      const normalizedStatusCardRadius = validateRange(
        t('webSettingsActivity.statusCard.radiusLabel'),
        formRest.statusCardRadius,
        0,
        80,
      )
      const normalizedSkillsOauthTokenTtlMinutes = validateRange(
        t('webSettingsSkills.oauthTtlTitle'),
        skillsOauthTokenTtlMinutes,
        5,
        1440,
      )
      if (
        normalizedHistoryWindowMinutes === null ||
        normalizedProcessStaleSeconds === null ||
        normalizedMediaCoverMaxCount === null ||
        normalizedRedisTtl === null ||
        normalizedStatusCardWidth === null ||
        normalizedStatusCardHeight === null ||
        normalizedStatusCardRadius === null ||
        normalizedSkillsOauthTokenTtlMinutes === null
      ) {
        setSaving(false)
        return
      }

      const hcaptchaPatch: Record<string, unknown> = {
        hcaptchaEnabled: formRest.hcaptchaEnabled,
        hcaptchaSiteKey: formRest.hcaptchaSiteKey || null,
      }
      if (hcaptchaSecretKeyForm.trim()) {
        hcaptchaPatch.hcaptchaSecretKey = hcaptchaSecretKeyForm.trim()
      }

      const steamPatch: Record<string, unknown> = {}
      if (steamApiKeyForm.trim()) {
        steamPatch.steamApiKey = steamApiKeyForm.trim()
      }

      const settingsPayload = {
        ...formRest,
        adminThemeColor,
        adminBackgroundColor,
        avatarFetchByServerEnabled:
          isRemoteAvatarUrl(formRest.avatarUrl) && formRest.avatarFetchByServerEnabled === true,
        historyWindowMinutes: normalizedHistoryWindowMinutes,
        processStaleSeconds: normalizedProcessStaleSeconds,
        mcpThemeToolsEnabled: form.mcpThemeToolsEnabled,
        redisCacheTtlSeconds: normalizedRedisTtl,
        mediaCoverMaxCount: normalizedMediaCoverMaxCount,
        statusCardWidth: normalizedStatusCardWidth,
        statusCardHeight: normalizedStatusCardHeight,
        statusCardRadius: normalizedStatusCardRadius,
        profileOnlineAccentColor: normalizeProfileOnlineAccentColor(poTrim || '') ?? null,
        inspirationAllowedDeviceHashes: inspirationDeviceRestrictionEnabled
          ? normalizeStringList(inspirationHashSelection)
          : null,
        ...hcaptchaPatch,
        ...steamPatch,
      } satisfies Record<string, unknown>

      const formSnapshot = structuredClone(form)
      const themePayload = pickRecordKeys(settingsPayload, SITE_SETTINGS_THEME_CATEGORY_KEYS)
      const schedulePayload = pickRecordKeys(settingsPayload, SITE_SETTINGS_SCHEDULE_CATEGORY_KEYS)
      const corePayload = omitRecordKeys(settingsPayload, [
        ...SITE_SETTINGS_THEME_CATEGORY_KEYS,
        ...SITE_SETTINGS_SCHEDULE_CATEGORY_KEYS,
      ])
      const coreKeys = Object.keys(corePayload)
      const coreDiff = !baselineForm
        ? true
        : !areValuesEqual(
            corePayload,
            normalizeCorePayloadForComparison(baselineForm as unknown as Record<string, unknown>),
          )

      const settingsSaveSteps: Array<{
        keys: readonly string[]
        run: () => Promise<Record<string, any>>
      }> = []

      if (themeSettingsDirty) {
        settingsSaveSteps.push({
          keys: SITE_SETTINGS_THEME_CATEGORY_KEYS,
          run: () => patchAdminSettingsTheme(themePayload),
        })
      }
      if (scheduleSettingsDirty) {
        settingsSaveSteps.push({
          keys: SITE_SETTINGS_SCHEDULE_CATEGORY_KEYS,
          run: () => patchAdminSettingsSchedule(schedulePayload),
        })
      }
      if (coreDiff) {
        settingsSaveSteps.push({
          keys: coreKeys,
          run: () => patchAdminSettingsCore(corePayload),
        })
      }

      let lastSavedSettingsData: Record<string, any> | null = null
      let lastSuccessfulSettingsStepIndex = -1

      try {
        for (const [index, step] of settingsSaveSteps.entries()) {
          lastSavedSettingsData = await step.run()
          lastSuccessfulSettingsStepIndex = index
        }

        const skillsPatch = normalizeSkillsEditableConfig({
          enabled: skillsEnabled,
          authMode: skillsAuthMode,
          oauthTokenTtlMinutes: normalizedSkillsOauthTokenTtlMinutes,
        })
        const skillsJson = await patchAdminSkills({
          enabled: skillsPatch.enabled,
          authMode: skillsPatch.authMode || undefined,
          oauthTokenTtlMinutes: normalizedSkillsOauthTokenTtlMinutes,
        })

        const serverSkills = normalizeSkillsEditableConfig({
          enabled: skillsJson.enabled === true,
          authMode:
            skillsJson.authMode === 'oauth' || skillsJson.authMode === 'apikey'
              ? skillsJson.authMode
              : '',
          oauthTokenTtlMinutes: Number(skillsJson.oauthTokenTtlMinutes),
        })
        setSkillsEnabled(serverSkills.enabled)
        setSkillsAuthMode(serverSkills.authMode)
        setSkillsOauthTokenTtlMinutes(serverSkills.oauthTokenTtlMinutes)
        setSkillsApiKeyConfigured(skillsJson.apiKeyConfigured === true)
        setSkillsOauthConfigured(skillsJson.oauthConfigured === true)
        setLegacyMcpConfigured(skillsJson.legacyMcpConfigured === true)
        setSkillsAiAuthorizations(normalizeSkillsAiAuthorizations(skillsJson.aiAuthorizations))
        setBaselineSkillsConfig(structuredClone(serverSkills))
        void queryClient.invalidateQueries({ queryKey: adminQueryKeys.skills.settings() })
      } catch (error) {
        if (lastSavedSettingsData) {
          const unsavedKeys = settingsSaveSteps
            .slice(lastSuccessfulSettingsStepIndex + 1)
            .flatMap((step) => step.keys)

          syncPartiallySavedSettings(lastSavedSettingsData, formSnapshot, unsavedKeys)
          toast.error(
            error instanceof Error
              ? `${error.message} ${t('webSettings.toasts.partialSavedHint')}`
              : t('webSettings.toasts.partialSavedHint'),
          )
          setSaving(false)
          return
        }

        throw error
      }

      await refreshSettingsData()
      toast.success(t('webSettings.toasts.saved'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.networkErrorRetry'))
    } finally {
      setSaving(false)
    }
  }

  const revertUnsavedWebSettings = () => {
    if (!baselineForm) return
    setForm(structuredClone(baselineForm))
    if (baselineSkillsConfig) {
      setSkillsEnabled(baselineSkillsConfig.enabled)
      setSkillsAuthMode(baselineSkillsConfig.authMode)
      setSkillsOauthTokenTtlMinutes(baselineSkillsConfig.oauthTokenTtlMinutes)
    }
  }

  const copyExportConfig = async () => {
    try {
      const encoded = await exportAdminSettings()
      await navigator.clipboard.writeText(encoded)
      toast.success(t('webSettings.importExport.copied'))
    } catch {
      toast.error(t('common.copyFailedBrowserPermission'))
    }
  }

  const applyImportConfig = async () => {
    let raw = ''
    try {
      raw = (await navigator.clipboard.readText()).trim()
    } catch {
      raw = ''
    }
    setImportConfigInput(raw)
    setImportConfigDialogOpen(true)
  }

  const confirmImportConfig = async () => {
    const raw = importConfigInput.trim()
    if (!raw) {
      toast.error(t('webSettings.importDialog.empty'))
      return
    }
    const compact = raw.replace(/\s+/g, '')
    const parsed = parseExportPayload(compact)
    if (!parsed) {
      toast.error(t('webSettings.importDialog.invalid'))
      return
    }
    const partial = await uploadImportedImageSources(webPayloadToFormPatch(parsed.web))
    const ruleToolsPayload = extractRuleToolsImportFromWebPayload(parsed.web)
    setForm((prev) => ({
      ...prev,
      ...partial,
      pageLockPassword: '',
    }))
    if (ruleToolsPayload) {
      try {
        await importAdminRuleTools(ruleToolsPayload)
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: adminQueryKeys.ruleTools.summary() }),
          queryClient.invalidateQueries({ queryKey: adminQueryKeys.ruleTools.config() }),
          queryClient.invalidateQueries({ queryKey: adminQueryKeys.ruleTools.rulesPreview() }),
          queryClient.invalidateQueries({ queryKey: ['admin', 'rule-tools', 'rules'] }),
          queryClient.invalidateQueries({ queryKey: ['admin', 'rule-tools', 'list'] }),
        ])
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : t('common.networkErrorRetry'),
        )
        return
      }
    }
    setImportConfigDialogOpen(false)
    toast.success(t('webSettings.importDialog.applied'))
  }

  const copyPlainText = async (value: string, successText: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(successText)
    } catch {
      toast.error(t('common.copyFailedBrowserPermission'))
    }
  }

  const webSettingsDirty = useMemo(() => {
    if (!baselineForm || !baselineSkillsConfig) return false
    try {
      if (!areValuesEqual(form, baselineForm)) return true
      const currentSkills = normalizeSkillsEditableConfig({
        enabled: skillsEnabled,
        authMode: skillsAuthMode,
        oauthTokenTtlMinutes: skillsOauthTokenTtlMinutes,
      })
      return !areValuesEqual(currentSkills, baselineSkillsConfig)
    } catch {
      return true
    }
  }, [
    form,
    baselineForm,
    baselineSkillsConfig,
    skillsEnabled,
    skillsAuthMode,
    skillsOauthTokenTtlMinutes,
  ])

  useEffect(() => {
    webSettingsDirtyRef.current = webSettingsDirty
  }, [webSettingsDirty])

  return {
    baselineForm,
    clearLegacyData,
    confirmImportConfig,
    copyExportConfig,
    copyPlainText,
    cropDialogOpen,
    cropSourceUrl,
    cropTarget,
    form,
    hasLockedLegacyChanges,
    importConfigDialogOpen,
    importConfigInput,
    loading,
    migration,
    migrationActionPending,
    revertUnsavedWebSettings,
    runSettingsMigration,
    save,
    saveSkillsConfig,
    saving,
    setCropDialogOpen,
    setCropSourceUrl,
    setCropTarget,
    setForm,
    setImportConfigDialogOpen,
    setImportConfigInput,
    applyImportConfig,
    revokeSkillsOauthByAiClientId,
    webSettingsDirty,
  }
}
