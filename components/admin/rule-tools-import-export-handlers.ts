import { toast } from 'sonner'

import {
  exportAdminActivityApps,
  exportAdminRuleTools,
} from '@/components/admin/admin-query-fetchers'
import {
  areRuleToolsPayloadEqual,
  cloneRuleToolsPayload,
  getErrorMessage,
} from '@/components/admin/rule-tools-utils'
import { exportAppRulesJson, parseAppRulesJson } from '@/components/admin/web-settings-utils'
import type { RuleToolsExportPayload } from '@/types/rule-tools'

type RuleToolsImportExportT = (
  key: string,
  values?: Record<string, unknown>,
) => string

export function CreateRuleToolsImportExportHandlers({
  t,
  currentPayload,
  committedPayload,
  importRulesInput,
  setDraftPayload,
  setSelectedRuleId,
  setImportRulesDialogOpen,
  setImportRulesInput,
  resetImportSearchInputs,
}: {
  t: RuleToolsImportExportT
  currentPayload: RuleToolsExportPayload | null
  committedPayload: RuleToolsExportPayload | null
  importRulesInput: string
  setDraftPayload: (payload: RuleToolsExportPayload | null) => void
  setSelectedRuleId: (id: string | null) => void
  setImportRulesDialogOpen: (open: boolean) => void
  setImportRulesInput: (value: string) => void
  resetImportSearchInputs: () => void
}) {
  const copyRulesJson = async () => {
    try {
      const payload = currentPayload ?? (await exportAdminRuleTools())
      const titleLimit = Number(payload.captureReportedAppTitleLimit)
      if (
        !Number.isSafeInteger(titleLimit) ||
        titleLimit < 0 ||
        titleLimit > 10
      ) {
        toast.error(t('common.numberRange', { range: '0 - 10' }))
        return
      }
      const json = exportAppRulesJson({
        ...payload,
        captureReportedAppTitleLimit: titleLimit,
      })
      await navigator.clipboard.writeText(json)
      toast.success(t('webSettingsRuleTools.toasts.copiedRulesJson'))
    } catch (error) {
      toast.error(getErrorMessage(error, t('common.copyFailedBrowserPermission')))
    }
  }

  const exportUsedAppsJson = async () => {
    try {
      const payload = JSON.stringify(await exportAdminActivityApps(), null, 2)
      const blob = new Blob([payload], { type: 'application/json;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const ts = new Date().toISOString().replace(/[:.]/g, '-')
      const link = document.createElement('a')
      link.href = url
      link.download = `apps-export-${ts}.json`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      toast.success(t('webSettingsRuleTools.toasts.exportedUsedAppsJson'))
    } catch (error) {
      toast.error(getErrorMessage(error, t('query.exportFailed')))
    }
  }

  const confirmImportRules = () => {
    const raw = importRulesInput.trim()
    if (!raw) {
      toast.error(t('webSettingsRuleTools.importDialog.pasteRulesJsonFirst'))
      return
    }
    const parsed = parseAppRulesJson(raw, (key) => t(`webSettingsRuleTools.parseErrors.${key}`))
    if (!parsed.ok) {
      toast.error(parsed.error)
      return
    }
    const imported = cloneRuleToolsPayload(parsed.data)
    setDraftPayload(areRuleToolsPayloadEqual(imported, committedPayload) ? null : imported)
    setSelectedRuleId(null)
    setImportRulesDialogOpen(false)
    setImportRulesInput('')
    resetImportSearchInputs()
    toast.success(t('webSettingsRuleTools.toasts.importedRulesIntoForm'))
  }

  return {
    copyRulesJson,
    exportUsedAppsJson,
    confirmImportRules,
  }
}
