import type { ReactNode } from 'react'

import { RuleToolsGroupList } from '@/components/admin/rule-tools-group-list'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import type { useRuleToolsState } from './use-rule-tools-state'

type RuleToolsAppRulesDialogsT = (
  key: string,
  values?: Record<string, unknown>,
) => string

export function RuleToolsAppRulesDialogs({
  state,
  t,
  renderRuleGroupEditor,
}: {
  state: ReturnType<typeof useRuleToolsState>
  t: RuleToolsAppRulesDialogsT
  renderRuleGroupEditor: (mobile: boolean) => ReactNode
}) {
  const {
    ruleToolsQuery,
    currentPayload,
    currentSummary,
    busy,
    filteredRuleItems,
    resolvedGroupListPage,
    pagedRuleItems,
    activeSelectedRuleId,
    ruleSearchInput,
    setRuleSearchInput,
    setGroupListPage,
    dialogAppRulesOpen,
    setDialogAppRulesOpen,
    dialogAppRuleEditorOpen,
    setEditingListItem,
    setSelectedRuleId,
    handleAppRuleEditorOpenChange,
    openMobileRuleEditor,
    handleAddRuleGroup,
  } = state

  return (
    <>
      <Dialog
        open={dialogAppRulesOpen}
        onOpenChange={(open) => {
          setDialogAppRulesOpen(open)
          if (!open) setEditingListItem(null)
        }}
      >
        <DialogContent
          className="flex h-[calc(100vh-1rem)] max-h-[calc(100vh-1rem)] w-[calc(100vw-1rem)] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:h-[min(90vh,56rem)] sm:max-h-[min(90vh,56rem)] sm:w-[calc(100vw-1.5rem)] sm:max-w-5xl"
          showCloseButton
        >
          <DialogHeader className="shrink-0 space-y-1 border-b px-4 py-4 pr-12 text-left sm:px-6">
            <DialogTitle>{t('webSettingsRuleTools.appRules.title')}</DialogTitle>
            <DialogDescription>
              <span className="md:hidden">
                {t('webSettingsRuleTools.appRules.selectorDescription')}
              </span>
              <span className="hidden md:inline">
                {t('webSettingsRuleTools.appRules.dialogDescription')}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-hidden px-4 py-4 sm:px-6 md:hidden">
            <RuleToolsGroupList
              mobile
              isLoading={ruleToolsQuery.isLoading}
              isFetching={ruleToolsQuery.isFetching}
              hasPayload={Boolean(currentPayload)}
              busy={busy}
              ruleSearchInput={ruleSearchInput}
              pagedRuleItems={pagedRuleItems}
              activeSelectedRuleId={activeSelectedRuleId}
              totalRuleCount={currentSummary?.ruleGroupCount ?? 0}
              resolvedGroupListPage={resolvedGroupListPage}
              filteredRuleItemCount={filteredRuleItems.length}
              t={t}
              setRuleSearchInput={setRuleSearchInput}
              setGroupListPage={setGroupListPage}
              setSelectedRuleId={setSelectedRuleId}
              onAddRuleGroup={handleAddRuleGroup}
              onOpenMobileRuleEditor={openMobileRuleEditor}
            />
          </div>
          <div className="hidden min-h-0 flex-1 overflow-hidden md:grid md:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)]">
            <div className="min-h-0 border-r px-6 py-4">
              <RuleToolsGroupList
                mobile={false}
                isLoading={ruleToolsQuery.isLoading}
                isFetching={ruleToolsQuery.isFetching}
                hasPayload={Boolean(currentPayload)}
                busy={busy}
                ruleSearchInput={ruleSearchInput}
                pagedRuleItems={pagedRuleItems}
                activeSelectedRuleId={activeSelectedRuleId}
                totalRuleCount={currentSummary?.ruleGroupCount ?? 0}
                resolvedGroupListPage={resolvedGroupListPage}
                filteredRuleItemCount={filteredRuleItems.length}
                t={t}
                setRuleSearchInput={setRuleSearchInput}
                setGroupListPage={setGroupListPage}
                setSelectedRuleId={setSelectedRuleId}
                onAddRuleGroup={handleAddRuleGroup}
                onOpenMobileRuleEditor={openMobileRuleEditor}
              />
            </div>
            <div className="min-h-0 overflow-y-auto px-6 py-4">
              {renderRuleGroupEditor(false)}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogAppRuleEditorOpen} onOpenChange={handleAppRuleEditorOpenChange}>
        <DialogContent
          className="flex max-h-[calc(100vh-1rem)] w-[calc(100vw-1rem)] max-w-4xl flex-col gap-0 overflow-hidden p-0 md:hidden"
          showCloseButton
        >
          <DialogHeader className="shrink-0 space-y-1 border-b px-4 py-4 pr-12 text-left sm:px-6">
            <DialogTitle>{t('webSettingsRuleTools.appRules.groupEditorTitle')}</DialogTitle>
            <DialogDescription>
              {t('webSettingsRuleTools.appRules.groupEditorDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
            {renderRuleGroupEditor(true)}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
