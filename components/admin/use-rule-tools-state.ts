import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useT } from 'next-i18next/client'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { exportAdminRuleTools } from '@/components/admin/admin-query-fetchers'
import { adminQueryKeys } from '@/components/admin/admin-query-keys'
import { importAdminRuleTools } from '@/components/admin/admin-query-mutations'
import { CreateRuleToolsImportExportHandlers } from '@/components/admin/rule-tools-import-export-handlers'
import {
  areRuleToolsPayloadEqual,
  cloneRuleToolsPayload,
  getErrorMessage,
  normalizePayloadForSave,
} from '@/components/admin/rule-tools-utils'
import { useRuleToolsEditingState } from '@/components/admin/use-rule-tools-editing-state'
import type { RuleToolsExportPayload } from '@/types/rule-tools'

export function useRuleToolsState(migration: { heavyEditingLocked?: boolean } | null | undefined) {
  const { t } = useT('admin')
  const queryClient = useQueryClient()

  const [savedPayload, setSavedPayload] = useState<RuleToolsExportPayload | null>(null)
  const [draftPayload, setDraftPayload] = useState<RuleToolsExportPayload | null>(null)

  const ruleToolsQuery = useQuery({
    queryKey: adminQueryKeys.ruleTools.export(),
    queryFn: exportAdminRuleTools,
  })
  const saveDraftMutation = useMutation({
    mutationFn: (payload: RuleToolsExportPayload) =>
      importAdminRuleTools(payload as Record<string, unknown>),
    onError: (error) => {
      toast.error(getErrorMessage(error, t('common.networkErrorRetry')))
    },
  })

  const committedPayload = savedPayload ?? ruleToolsQuery.data ?? null
  const draftDirty = useMemo(
    () => !areRuleToolsPayloadEqual(draftPayload ?? committedPayload, committedPayload),
    [committedPayload, draftPayload],
  )

  const currentPayload = draftPayload ?? committedPayload
  const heavyEditingLocked = migration?.heavyEditingLocked === true
  const busy = heavyEditingLocked || saveDraftMutation.isPending

  const updateDraftPayload = (
    updater: (current: RuleToolsExportPayload) => RuleToolsExportPayload,
  ) => {
    setDraftPayload((current) => {
      const base = current ?? committedPayload
      if (!base) return current
      const next = updater(cloneRuleToolsPayload(base))
      return areRuleToolsPayloadEqual(next, committedPayload) ? null : next
    })
  }

  const editingState = useRuleToolsEditingState({
    t,
    currentPayload,
    updateDraftPayload,
  })

  const persistRuleToolsPayload = async (
    payload: RuleToolsExportPayload,
    showSuccessToast = false,
  ): Promise<boolean> => {
    if (heavyEditingLocked) {
      toast.error(t('webSettingsMigration.lockedToast'))
      return false
    }
    const normalized = normalizePayloadForSave(payload)
    if (normalized.error) {
      toast.error(
        normalized.error.type === 'regex'
          ? t('webSettingsRuleTools.appRules.invalidRegex', {
              group: normalized.error.group,
              rule: normalized.error.rule,
              message: normalized.error.message,
            })
          : t('common.numberRange', { range: '0 - 10' }),
      )
      return false
    }
    try {
      await saveDraftMutation.mutateAsync(normalized.data)
      const committed = cloneRuleToolsPayload(normalized.data)
      setSavedPayload(cloneRuleToolsPayload(committed))
      setDraftPayload(null)
      queryClient.setQueryData(adminQueryKeys.ruleTools.export(), cloneRuleToolsPayload(committed))
      await queryClient.invalidateQueries({ queryKey: ['admin', 'rule-tools'] })
      if (showSuccessToast) {
        toast.success(t('webSettingsRuleTools.toasts.saved'))
      }
      return true
    } catch {
      return false
    }
  }

  const commitSinglePayloadChange = async (
    updater: (current: RuleToolsExportPayload) => RuleToolsExportPayload,
  ) => {
    const base = currentPayload
    if (!base) return
    if (draftDirty) {
      updateDraftPayload(updater)
      return
    }
    const previous = cloneRuleToolsPayload(base)
    const next = updater(cloneRuleToolsPayload(base))
    setSavedPayload(cloneRuleToolsPayload(next))
    setDraftPayload(null)
    const ok = await persistRuleToolsPayload(next)
    if (!ok) {
      setSavedPayload(cloneRuleToolsPayload(previous))
      setDraftPayload(null)
    }
  }

  const { copyRulesJson, exportUsedAppsJson, confirmImportRules } =
    CreateRuleToolsImportExportHandlers({
      t,
      currentPayload,
      committedPayload,
      importRulesInput: editingState.importRulesInput,
      setDraftPayload,
      setSelectedRuleId: editingState.setSelectedRuleId,
      setImportRulesDialogOpen: editingState.setImportRulesDialogOpen,
      setImportRulesInput: editingState.setImportRulesInput,
      resetImportSearchInputs: editingState.resetImportSearchInputs,
    })

  const handleRevertDraft = () => {
    if (!committedPayload) return
    setDraftPayload(null)
    editingState.setEditingListItem(null)
  }

  const handleSaveDraft = async () => {
    if (!draftPayload || !draftDirty) return
    await persistRuleToolsPayload(draftPayload, true)
  }

  return {
    t,
    ruleToolsQuery,
    saveDraftMutation,
    committedPayload,
    currentPayload,
    draftDirty,
    draftPayload,
    heavyEditingLocked,
    busy,
    updateDraftPayload,
    commitSinglePayloadChange,
    copyRulesJson,
    exportUsedAppsJson,
    confirmImportRules,
    handleRevertDraft,
    handleSaveDraft,
    ...editingState,
  }
}
