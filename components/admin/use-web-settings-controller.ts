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
  ClearWebSettingsLegacyData,
  ConfirmWebSettingsImport,
  RevokeWebSettingsSkillsOauthByAiClientId,
  RunWebSettingsMigration,
  SaveWebSettings,
  SaveWebSettingsSkillsConfig,
} from '@/components/admin/web-settings-controller-actions'
import {
  areValuesEqual,
  buildWebSettingsForm,
  hasKeyDiff,
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
  normalizeSkillsAiAuthorizations,
  normalizeSkillsEditableConfig,
} from '@/components/admin/web-settings-utils'
import {
  SITE_SETTINGS_CORE_HEAVY_KEYS,
  SITE_SETTINGS_MIGRATED_CORE_KEYS,
  SITE_SETTINGS_SCHEDULE_CATEGORY_KEYS,
  SITE_SETTINGS_THEME_CATEGORY_KEYS,
} from '@/constants/site-settings'
import { writeAdminBackgroundColor, writeAdminThemeColor } from '@/lib/admin-theme-color'
import { pickRecordKeys } from '@/lib/site-settings-record'
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
    await SaveWebSettingsSkillsConfig(
      {
        t,
        queryClient,
        setSkillsSaving,
        setSkillsEnabled,
        setSkillsAuthMode,
        setSkillsApiKeyConfigured,
        setSkillsOauthConfigured,
        setSkillsOauthTokenTtlMinutes,
        setSkillsAiAuthorizations,
        setSkillsGeneratedApiKey,
        setLegacyMcpConfigured,
        setLegacyMcpGeneratedApiKey,
      },
      patch,
      options,
    )
  }

  const revokeSkillsOauthByAiClientId = async (aiClientId: string) => {
    await RevokeWebSettingsSkillsOauthByAiClientId(
      {
        t,
        queryClient,
        setSkillsSaving,
        setSkillsEnabled,
        setSkillsAuthMode,
        setSkillsApiKeyConfigured,
        setSkillsOauthConfigured,
        setSkillsOauthTokenTtlMinutes,
        setSkillsAiAuthorizations,
        setSkillsGeneratedApiKey,
        setLegacyMcpConfigured,
        setLegacyMcpGeneratedApiKey,
        setSkillsRevokingAiClientId,
      },
      aiClientId,
    )
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
    await RunWebSettingsMigration({
      t,
      queryClient,
      setMigrationActionPending,
      refreshSettingsData,
      refreshMigrationData,
    })
  }

  const clearLegacyData = async () => {
    await ClearWebSettingsLegacyData({
      t,
      queryClient,
      setMigrationActionPending,
      refreshSettingsData,
      refreshMigrationData,
    })
  }

  const save = async () => {
    await SaveWebSettings({
      t,
      queryClient,
      form,
      baselineForm,
      skillsEnabled,
      skillsAuthMode,
      skillsOauthTokenTtlMinutes,
      themeSettingsDirty,
      scheduleSettingsDirty,
      hasLockedLegacyChanges,
      setSaving,
      setSkillsEnabled,
      setSkillsAuthMode,
      setSkillsApiKeyConfigured,
      setSkillsOauthConfigured,
      setSkillsOauthTokenTtlMinutes,
      setSkillsAiAuthorizations,
      setLegacyMcpConfigured,
      setBaselineSkillsConfig,
      refreshSettingsData,
      syncPartiallySavedSettings,
    })
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
    await ConfirmWebSettingsImport({
      t,
      queryClient,
      importConfigInput,
      setForm,
      setImportConfigDialogOpen,
    })
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
