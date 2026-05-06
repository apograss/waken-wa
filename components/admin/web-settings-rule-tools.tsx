'use client'

import { useAtom } from 'jotai'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useT } from 'next-i18next/client'

import {
  getAdminPanelTransition,
  getAdminSectionVariants,
} from '@/components/admin/admin-motion'
import { ListDialogEditor } from '@/components/admin/rule-tools-list-dialog-editor'
import { getErrorMessage, getTitleRuleRegexErrorMessage,summarizeAppRuleGroup } from '@/components/admin/rule-tools-utils'
import { UnsavedChangesBar } from '@/components/admin/unsaved-changes-bar'
import { useRuleToolsState } from '@/components/admin/use-rule-tools-state'
import {
  WebSettingsInset,
  WebSettingsRow,
  WebSettingsRows,
} from '@/components/admin/web-settings-layout'
import {
  ListPaginationBar,
  SETTINGS_APP_LIST_PAGE_SIZE,
  SETTINGS_RULES_PAGE_SIZE,
} from '@/components/admin/web-settings-paging'
import { webSettingsMigrationAtom } from '@/components/admin/web-settings-store'
import { Autocomplete } from '@/components/ui/autocomplete'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { AppTitleRuleMode } from '@/lib/app-message-rules'
import {
  normalizeReportedAppTitleLimit,
  REPORTED_APP_TITLE_LIMIT_MAX,
} from '@/lib/reported-app-title-limit'
import { cn } from '@/lib/utils'

export function WebSettingsRuleTools() {
  const { t } = useT('admin')
  const [migration] = useAtom(webSettingsMigrationAtom)
  const prefersReducedMotion = Boolean(useReducedMotion())
  const sectionTransition = getAdminPanelTransition(prefersReducedMotion)
  const sectionVariants = getAdminSectionVariants(prefersReducedMotion, {
    enterY: 10,
    exitY: 8,
    scale: 0.996,
  })

  const state = useRuleToolsState(migration)

  const {
    ruleToolsQuery,
    saveDraftMutation,
    currentPayload,
    currentSummary,
    draftDirty,
    draftPayload,
    captureReportedAppsEnabled,
    appFilterMode,
    currentFilterModeLabel,
    heavyEditingLocked,
    busy,
    ruleItems,
    filteredRuleItems,
    resolvedGroupListPage,
    pagedRuleItems,
    previewItems,
    previewTotal,
    previewOverflow,
    activeSelectedRuleId,
    selectedRule,
    currentFilterListKey,
    currentFilterSearchInput,
    currentFilterPage,
    filteredCurrentFilterItems,
    pagedCurrentFilterItems,
    currentFilterSuggestions,
    currentFilterEditingItem,
    filteredNameOnlyItems,
    resolvedNameOnlyListPage,
    pagedNameOnlyItems,
    filteredMediaSourceItems,
    resolvedMediaSourceListPage,
    pagedMediaSourceItems,
    nameOnlySuggestionsQuery,
    mediaSourceSuggestionsQuery,
    mediaSourceAction,
    setMediaSourceAction,
    mediaSourceDisplayName,
    setMediaSourceDisplayName,
    ruleProcessSuggestionsQuery,
    blacklistInput,
    setBlacklistInput,
    whitelistInput,
    setWhitelistInput,
    nameOnlyListInput,
    setNameOnlyListInput,
    mediaSourceInput,
    setMediaSourceInput,
    ruleSearchInput,
    setRuleSearchInput,
    setGroupListPage,
    setBlacklistListPage,
    setBlacklistSearchInput,
    setWhitelistListPage,
    setWhitelistSearchInput,
    nameOnlyListSearchInput,
    setNameOnlyListSearchInput,
    setNameOnlyListPage,
    mediaSourceSearchInput,
    setMediaSourceSearchInput,
    setMediaSourceListPage,
    dialogAppRulesOpen,
    setDialogAppRulesOpen,
    dialogAppRuleEditorOpen,
    setDialogAppRuleEditorOpen,
    dialogAppFilterOpen,
    setDialogAppFilterOpen,
    dialogNameOnlyOpen,
    setDialogNameOnlyOpen,
    dialogMediaSourceOpen,
    setDialogMediaSourceOpen,
    importRulesDialogOpen,
    setImportRulesDialogOpen,
    importRulesInput,
    setImportRulesInput,
    editingListItem,
    editingMediaSourceRule,
    setEditingMediaSourceRule,
    setEditingListItem,
    setSelectedRuleId,
    handleOpenRuleSelector,
    handleOpenRuleEditor,
    handleAppRuleEditorOpenChange,
    openMobileRuleEditor,
    handleStartEditListItem,
    handleCancelEditListItem,
    handleSaveEditedListItem,
    handleRemoveListItem,
    handleAddFilterItem,
    handleAddNameOnlyItem,
    handleAddMediaSourceItem,
    handleStartEditMediaSourceRule,
    handleCancelEditMediaSourceRule,
    handleSaveEditedMediaSourceRule,
    handleRemoveMediaSourceRule,
    handleAddRuleGroup,
    handleDeleteRuleGroup,
    handleMoveRuleGroup,
    handleAddTitleRule,
    handleDeleteTitleRule,
    handleMoveTitleRule,
    handleTitleRuleModeChange,
    updateRuleDraft,
    updateTitleRuleDraft,
    updateDraftPayload,
    commitSinglePayloadChange,
    copyRulesJson,
    exportUsedAppsJson,
    confirmImportRules,
    handleRevertDraft,
    handleSaveDraft,
  } = state

  const renderRulePreview = () => {
    if (ruleToolsQuery.isLoading && previewItems.length === 0) {
      return <p className="text-xs text-muted-foreground">{t('webSettings.loading')}</p>
    }
    if (previewItems.length === 0) {
      return (
        <p className="text-xs text-muted-foreground">
          {t('webSettingsRuleTools.appRules.noRules')}
        </p>
      )
    }

    return (
      <div className="space-y-3">
        <motion.ul className="space-y-3" layout>
          <AnimatePresence initial={false}>
            {previewItems.map((item) => (
              <motion.li
                key={item.id}
                className="rounded-xl border border-border/60 bg-background/70 px-3 py-3"
                variants={sectionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={sectionTransition}
                layout
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="text-xs text-muted-foreground">
                      {t('webSettingsRuleTools.appRules.ruleIndex', {
                        index: item.position + 1,
                        total: previewTotal,
                      })}
                    </p>
                    <p className="text-sm leading-6 text-foreground">
                      {summarizeAppRuleGroup(item, t)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={!currentPayload || busy}
                    onClick={() => handleOpenRuleEditor(item.id)}
                  >
                    {t('common.edit')}
                  </Button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
        {previewOverflow > 0 ? (
          <p className="text-xs text-muted-foreground">
            {t('webSettingsRuleTools.appRules.moreRulesHint', { value: previewOverflow })}
          </p>
        ) : null}
      </div>
    )
  }

  const renderRuleGroupList = (mobile: boolean) => {
    const hasSearch = ruleSearchInput.trim().length > 0

    return (
      <div className="flex h-full min-h-0 flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              {t('webSettingsRuleTools.appRules.groupListTitle')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('webSettingsRuleTools.appRules.groupListDescription')}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            disabled={!currentPayload || busy}
            onClick={() => handleAddRuleGroup(mobile)}
          >
            {t('webSettingsRuleTools.appRules.addGroup')}
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor={mobile ? 'app-rule-search-mobile' : 'app-rule-search-desktop'}>
            {t('common.search')}
          </Label>
          <Input
            id={mobile ? 'app-rule-search-mobile' : 'app-rule-search-desktop'}
            value={ruleSearchInput}
            onChange={(event) => {
              setRuleSearchInput(event.target.value)
              setGroupListPage(0)
            }}
            placeholder={t('webSettingsRuleTools.appRules.searchPlaceholder')}
          />
          {ruleToolsQuery.isFetching && !ruleToolsQuery.isLoading ? (
            <p className="text-xs text-muted-foreground">{t('common.refreshing')}</p>
          ) : null}
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {ruleToolsQuery.isLoading && !currentPayload ? (
            <div className="flex min-h-0 flex-1 items-center justify-center rounded-lg border border-dashed border-border/60 bg-background/30 px-6 py-8 text-center">
              <p className="text-xs text-muted-foreground">{t('webSettings.loading')}</p>
            </div>
          ) : pagedRuleItems.length === 0 ? (
            <div className="flex min-h-0 flex-1 items-center justify-center rounded-lg border border-dashed border-border/60 bg-background/30 px-6 py-8 text-center">
              <p className="text-xs leading-relaxed text-muted-foreground">
                {hasSearch
                  ? t('webSettingsRuleTools.appRules.noSearchResults')
                  : t('webSettingsRuleTools.appRules.noGroups')}
              </p>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-3">
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto rounded-lg border border-border/60 bg-background/20 p-3">
                {pagedRuleItems.map((item) => {
                  const isSelected = !mobile && activeSelectedRuleId === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={cn(
                        'w-full rounded-lg border px-3 py-3 text-left transition-colors',
                        isSelected
                          ? 'border-primary/60 bg-background shadow-sm'
                          : 'border-border/50 bg-background/60 hover:bg-background',
                      )}
                      onClick={() => {
                        if (mobile) {
                          openMobileRuleEditor(item)
                          return
                        }
                        setSelectedRuleId(item.id)
                      }}
                    >
                      <p className="text-xs font-medium text-foreground/80">
                        {t('webSettingsRuleTools.appRules.ruleIndex', {
                          index: item.position + 1,
                          total: currentSummary?.ruleGroupCount ?? 0,
                        })}
                      </p>
                      <p className="mt-1 break-all font-mono text-sm text-foreground">
                        {item.processMatch || t('webSettingsRuleTools.appRules.matchEmpty')}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {summarizeAppRuleGroup(item, t)}
                      </p>
                    </button>
                  )
                })}
              </div>
              <ListPaginationBar
                page={resolvedGroupListPage}
                pageSize={SETTINGS_RULES_PAGE_SIZE}
                total={filteredRuleItems.length}
                onPageChange={setGroupListPage}
              />
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderRuleGroupEditor = (mobile: boolean) => {
    if (ruleToolsQuery.isLoading && !selectedRule) {
      return <p className="text-xs text-muted-foreground">{t('webSettings.loading')}</p>
    }
    if (!selectedRule) {
      return (
        <div className="flex h-full min-h-[18rem] items-center justify-center rounded-lg border border-dashed border-border/60 bg-background/30 px-6 py-8 text-center">
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              {t('webSettingsRuleTools.appRules.emptyEditorTitle')}
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t('webSettingsRuleTools.appRules.emptyEditorDescription')}
            </p>
            {mobile ? (
              <div className="flex flex-wrap justify-center gap-2 pt-1">
                <Button type="button" disabled={!currentPayload || busy} onClick={() => handleAddRuleGroup(true)}>
                  {t('webSettingsRuleTools.appRules.addGroup')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogAppRuleEditorOpen(false)
                    setDialogAppRulesOpen(true)
                  }}
                >
                  {t('webSettingsRuleTools.appRules.chooseAnotherGroup')}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      )
    }

    const groupIndex = selectedRule.position
    const total = currentSummary?.ruleGroupCount ?? 0

    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/[0.08] p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {t('webSettingsRuleTools.appRules.groupEditorTitle')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('webSettingsRuleTools.appRules.ruleIndex', {
                  index: groupIndex + 1,
                  total,
                })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {mobile ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setDialogAppRuleEditorOpen(false)
                    setDialogAppRulesOpen(true)
                  }}
                >
                  {t('webSettingsRuleTools.appRules.chooseAnotherGroup')}
                </Button>
              ) : null}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={busy || selectedRule.position <= 0}
                onClick={() => handleMoveRuleGroup(selectedRule.id, selectedRule.position - 1)}
              >
                {t('webSettingsRuleTools.appRules.moveUp')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={busy || selectedRule.position >= total - 1}
                onClick={() => handleMoveRuleGroup(selectedRule.id, selectedRule.position + 1)}
              >
                {t('webSettingsRuleTools.appRules.moveDown')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => handleDeleteRuleGroup(selectedRule.id)}
              >
                {t('common.delete')}
              </Button>
            </div>
          </div>
          <p className="text-xs leading-6 text-muted-foreground">
            {t('webSettingsRuleTools.appRules.groupEditorDescription')}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rule-group-process-match">
            {t('webSettingsRuleTools.appRules.processMatchLabel')}
          </Label>
          <Autocomplete
            id="rule-group-process-match"
            items={ruleProcessSuggestionsQuery.data ?? []}
            value={selectedRule.processMatch}
            onValueChange={(value) =>
              updateRuleDraft((current) => ({
                ...current,
                processMatch: value,
              }))
            }
            placeholder={t('webSettingsRuleTools.appRules.processMatchPlaceholder')}
            inputClassName="font-mono"
            emptyText={
              captureReportedAppsEnabled
                ? t('webSettingsRuleTools.appRules.noMatchingHistoryApp')
                : t('webSettingsRuleTools.appNameListEditor.historyDisabled')
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rule-group-default-text">
            {t('webSettingsRuleTools.appRules.defaultTextLabel')}
          </Label>
          <Textarea
            id="rule-group-default-text"
            rows={3}
            value={selectedRule.defaultText ?? ''}
            onChange={(event) =>
              updateRuleDraft((current) => ({
                ...current,
                defaultText: event.target.value || undefined,
              }))
            }
            placeholder={t('webSettingsRuleTools.appRules.defaultTextPlaceholder')}
          />
          <p className="text-xs leading-6 text-muted-foreground">
            {t('webSettingsRuleTools.appRules.defaultTextDescription')}
          </p>
        </div>

        <div className="space-y-3 rounded-xl border border-border/60 bg-background/70 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {t('webSettingsRuleTools.appRules.titleRulesTitle')}
              </p>
              <p className="text-xs leading-6 text-muted-foreground">
                {t('webSettingsRuleTools.appRules.titleRulesDescription')}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={handleAddTitleRule}
            >
              {t('webSettingsRuleTools.appRules.addTitleRule')}
            </Button>
          </div>

          {selectedRule.titleRules.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {t('webSettingsRuleTools.appRules.noTitleRules')}
            </p>
          ) : (
            <motion.ul className="space-y-3" layout>
              <AnimatePresence initial={false}>
                {selectedRule.titleRules.map((titleRule, index) => {
                  const isFirst = index <= 0
                  const isLast = index >= selectedRule.titleRules.length - 1
                  const regexError = getTitleRuleRegexErrorMessage(
                    titleRule,
                    groupIndex,
                    index,
                    t,
                  )
                  return (
                    <motion.li
                      key={titleRule.id}
                      className="rounded-xl border border-border/60 bg-muted/[0.04] p-4"
                      variants={sectionVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={sectionTransition}
                      layout
                    >
                      <div className="space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground">
                              {t('webSettingsRuleTools.appRules.titleRuleIndex', {
                                index: index + 1,
                                total: selectedRule.titleRules.length,
                              })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {titleRule.mode === 'regex'
                                ? t('webSettingsRuleTools.appRules.titleRuleModeRegexDescription')
                                : t('webSettingsRuleTools.appRules.titleRuleModePlainDescription')}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              disabled={busy || isFirst}
                              onClick={() => handleMoveTitleRule(titleRule.id, index - 1)}
                            >
                              {t('webSettingsRuleTools.appRules.moveUp')}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              disabled={busy || isLast}
                              onClick={() => handleMoveTitleRule(titleRule.id, index + 1)}
                            >
                              {t('webSettingsRuleTools.appRules.moveDown')}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              disabled={busy}
                              onClick={() => handleDeleteTitleRule(titleRule.id)}
                            >
                              {t('common.delete')}
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>{t('webSettingsRuleTools.appRules.titleRuleModeLabel')}</Label>
                          <RadioGroup
                            value={titleRule.mode}
                            onValueChange={(value) => {
                              const nextMode: AppTitleRuleMode =
                                value === 'regex' ? 'regex' : 'plain'
                              handleTitleRuleModeChange(titleRule.id, nextMode)
                            }}
                            className="grid gap-3 sm:grid-cols-2"
                          >
                            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-background/60 px-3 py-3">
                              <RadioGroupItem value="plain" id={`${titleRule.id}-plain`} />
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-foreground">
                                  {t('webSettingsRuleTools.appRules.titleRuleModePlain')}
                                </p>
                                <p className="text-xs leading-6 text-muted-foreground">
                                  {t('webSettingsRuleTools.appRules.titleRuleModePlainDescription')}
                                </p>
                              </div>
                            </label>
                            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-background/60 px-3 py-3">
                              <RadioGroupItem value="regex" id={`${titleRule.id}-regex`} />
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-foreground">
                                  {t('webSettingsRuleTools.appRules.titleRuleModeRegex')}
                                </p>
                                <p className="text-xs leading-6 text-muted-foreground">
                                  {t('webSettingsRuleTools.appRules.titleRuleModeRegexDescription')}
                                </p>
                              </div>
                            </label>
                          </RadioGroup>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`${titleRule.id}-pattern`}>
                            {t('webSettingsRuleTools.appRules.titleRulePatternLabel')}
                          </Label>
                          <Input
                            id={`${titleRule.id}-pattern`}
                            value={titleRule.pattern}
                            onChange={(event) =>
                              updateTitleRuleDraft(titleRule.id, (current) => ({
                                ...current,
                                pattern: event.target.value,
                              }))
                            }
                            className="font-mono"
                            placeholder={
                              titleRule.mode === 'regex'
                                ? t('webSettingsRuleTools.appRules.titleRulePatternRegexPlaceholder')
                                : t('webSettingsRuleTools.appRules.titleRulePatternPlainPlaceholder')
                            }
                          />
                          {regexError ? (
                            <p className="text-xs leading-6 text-destructive">{regexError}</p>
                          ) : null}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`${titleRule.id}-text`}>
                            {t('webSettingsRuleTools.appRules.titleRuleTextLabel')}
                          </Label>
                          <Textarea
                            id={`${titleRule.id}-text`}
                            rows={2}
                            value={titleRule.text}
                            onChange={(event) =>
                              updateTitleRuleDraft(titleRule.id, (current) => ({
                                ...current,
                                text: event.target.value,
                              }))
                            }
                            placeholder={t('webSettingsRuleTools.appRules.titleRuleTextPlaceholder')}
                          />
                          <p className="text-xs leading-6 text-muted-foreground">
                            {t('webSettingsRuleTools.appRules.titleRuleTextDescription')}
                          </p>
                        </div>
                      </div>
                    </motion.li>
                  )
                })}
              </AnimatePresence>
            </motion.ul>
          )}
        </div>

        <p className="text-xs leading-6 text-muted-foreground">
          {t('webSettingsRuleTools.appRules.helpText', {
            process: '{process}',
            title: '{title}',
          })}
        </p>
      </div>
    )
  }

  if (ruleToolsQuery.isLoading && !currentPayload) {
    return <div className="text-sm text-muted-foreground">{t('webSettings.loading')}</div>
  }
  if (ruleToolsQuery.isError && !currentPayload) {
    return (
      <div className="text-sm text-destructive">
        {getErrorMessage(ruleToolsQuery.error, t('common.networkErrorRetry'))}
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4 sm:rounded-xl sm:border sm:border-border/60 sm:bg-muted/[0.05] sm:p-5">
        <div className="space-y-4">
          <WebSettingsInset className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {t('webSettingsRuleTools.appRules.title')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('webSettingsRuleTools.appRules.savedCount', {
                    value: currentSummary?.ruleGroupCount ?? 0,
                  })}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!currentPayload || busy}
                onClick={handleOpenRuleSelector}
              >
                {t('webSettingsRuleTools.editInDialog')}
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-xs leading-6 text-muted-foreground">
                {t('webSettingsRuleTools.appRules.dialogDescription')}
              </p>
              <p className="text-xs font-medium tracking-wide text-muted-foreground">
                {t('webSettingsRuleTools.appRules.previewTop3')}
              </p>
              {renderRulePreview()}
            </div>
          </WebSettingsInset>

          <WebSettingsRows>
            <WebSettingsRow
              htmlFor="rule-tools-show-process-name"
              title={t('webSettingsRuleTools.appRules.showProcessNameTitle')}
              description={t('webSettingsRuleTools.appRules.showProcessNameDescription')}
              action={
                <Switch
                  id="rule-tools-show-process-name"
                  checked={currentPayload?.appMessageRulesShowProcessName ?? true}
                  disabled={!currentPayload || busy}
                  onCheckedChange={(value) => {
                    void commitSinglePayloadChange((current) => ({
                      ...current,
                      appMessageRulesShowProcessName: value,
                    }))
                  }}
                />
              }
            />
            <WebSettingsRow
              htmlFor="rule-tools-capture-reported-apps"
              title={t('webSettingsRuleTools.captureReportedApps.title')}
              description={t('webSettingsRuleTools.captureReportedApps.description')}
              action={
                <Switch
                  id="rule-tools-capture-reported-apps"
                  checked={captureReportedAppsEnabled}
                  disabled={!currentPayload || busy}
                  onCheckedChange={(value) => {
                    void commitSinglePayloadChange((current) => ({
                      ...current,
                      captureReportedAppsEnabled: value,
                    }))
                  }}
                />
              }
            />
            <WebSettingsRow
              htmlFor="rule-tools-capture-reported-app-title-limit"
              title={t('webSettingsRuleTools.captureReportedApps.titleLimitTitle')}
              description={t('webSettingsRuleTools.captureReportedApps.titleLimitDescription', {
                max: REPORTED_APP_TITLE_LIMIT_MAX,
              })}
              action={
                <Input
                  id="rule-tools-capture-reported-app-title-limit"
                  type="number"
                  min={0}
                  max={REPORTED_APP_TITLE_LIMIT_MAX}
                  step={1}
                  className="w-24"
                  value={currentPayload?.captureReportedAppTitleLimit ?? 3}
                  disabled={!currentPayload || busy}
                  onChange={(event) => {
                    const nextLimit = normalizeReportedAppTitleLimit(event.target.value)
                    updateDraftPayload((current) => ({
                      ...current,
                      captureReportedAppTitleLimit: nextLimit,
                    }))
                  }}
                />
              }
            />
            <WebSettingsRow
              title={t('webSettingsRuleTools.appFilter.title')}
              description={
                <>
                  <div>
                    {t('webSettingsRuleTools.appFilter.summary', {
                      mode: currentFilterModeLabel,
                      blacklist: currentSummary?.appBlacklistCount ?? 0,
                      whitelist: currentSummary?.appWhitelistCount ?? 0,
                    })}
                  </div>
                  <div className="pt-1">
                    {appFilterMode === 'blacklist'
                      ? t('webSettingsRuleTools.appFilter.blacklistDescription')
                      : t('webSettingsRuleTools.appFilter.whitelistDescription')}
                  </div>
                </>
              }
              action={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!currentPayload || busy}
                  onClick={() => setDialogAppFilterOpen(true)}
                >
                  {t('webSettingsRuleTools.editInDialog')}
                </Button>
              }
            />
            <WebSettingsRow
              title={t('webSettingsRuleTools.nameOnly.title')}
              description={t('webSettingsRuleTools.nameOnly.count', {
                value: currentSummary?.appNameOnlyListCount ?? 0,
              })}
              action={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!currentPayload || busy}
                  onClick={() => setDialogNameOnlyOpen(true)}
                >
                  {t('webSettingsRuleTools.editInDialog')}
                </Button>
              }
            />
            <WebSettingsRow
              title={t('webSettingsRuleTools.mediaSource.title')}
              description={t('webSettingsRuleTools.mediaSource.count', {
                value: currentSummary?.mediaPlaySourceRuleCount ?? 0,
              })}
              action={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!currentPayload || busy}
                  onClick={() => setDialogMediaSourceOpen(true)}
                >
                  {t('webSettingsRuleTools.editInDialog')}
                </Button>
              }
            />
          </WebSettingsRows>

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={() => void exportUsedAppsJson()}>
              {t('webSettingsRuleTools.actions.exportUsedAppsJson')}
            </Button>
            <Button type="button" variant="outline" onClick={() => void copyRulesJson()}>
              {t('webSettingsRuleTools.actions.copyRulesJson')}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!currentPayload || busy}
              onClick={() => setImportRulesDialogOpen(true)}
            >
              {t('webSettingsRuleTools.actions.importRulesJson')}
            </Button>
          </div>
        </div>
      </div>

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
            {renderRuleGroupList(true)}
          </div>
          <div className="hidden min-h-0 flex-1 overflow-hidden md:grid md:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)]">
            <div className="min-h-0 border-r px-6 py-4">{renderRuleGroupList(false)}</div>
            <div className="min-h-0 overflow-y-auto px-6 py-4">{renderRuleGroupEditor(false)}</div>
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

      <Dialog
        open={dialogAppFilterOpen}
        onOpenChange={(open) => {
          setDialogAppFilterOpen(open)
          if (!open) setEditingListItem(null)
        }}
      >
        <DialogContent className="flex h-[calc(100vh-1rem)] max-h-[calc(100vh-1rem)] w-[calc(100vw-1rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:h-[min(90vh,56rem)] sm:max-h-[min(90vh,56rem)] sm:w-[calc(100vw-1.5rem)]">
          <DialogHeader className="shrink-0 space-y-1 border-b px-4 py-4 pr-12 text-left sm:px-6">
            <DialogTitle>{t('webSettingsRuleTools.appFilter.title')}</DialogTitle>
            <DialogDescription>
              {t('webSettingsRuleTools.appFilter.dialogDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-hidden px-4 py-4 sm:px-6">
            <div className="flex h-full min-h-0 flex-col gap-4">
              <RadioGroup
                value={appFilterMode}
                disabled={busy}
                onValueChange={(value) => {
                  if (value !== 'blacklist' && value !== 'whitelist') return
                  setEditingListItem(null)
                  updateDraftPayload((current) => ({
                    ...current,
                    appFilterMode: value,
                  }))
                }}
                className="grid gap-3 sm:grid-cols-2"
              >
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-background/70 px-4 py-4">
                  <RadioGroupItem value="blacklist" id="rule-tools-filter-blacklist" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {t('webSettingsRuleTools.appFilter.blacklistMode')}
                    </p>
                    <p className="text-xs leading-6 text-muted-foreground">
                      {t('webSettingsRuleTools.appFilter.blacklistDescription')}
                    </p>
                  </div>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-background/70 px-4 py-4">
                  <RadioGroupItem value="whitelist" id="rule-tools-filter-whitelist" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {t('webSettingsRuleTools.appFilter.whitelistMode')}
                    </p>
                    <p className="text-xs leading-6 text-muted-foreground">
                      {t('webSettingsRuleTools.appFilter.whitelistDescription')}
                    </p>
                  </div>
                </label>
              </RadioGroup>

              <ListDialogEditor
                description={
                  appFilterMode === 'blacklist'
                    ? t('webSettingsRuleTools.appFilter.blacklistInputDescription')
                    : t('webSettingsRuleTools.appFilter.whitelistInputDescription')
                }
                emptyText={
                  appFilterMode === 'blacklist'
                    ? t('webSettingsRuleTools.appFilter.blacklistEmpty')
                    : t('webSettingsRuleTools.appFilter.whitelistEmpty')
                }
                inputId="rule-tools-filter-list"
                placeholder={
                  appFilterMode === 'blacklist'
                    ? t('webSettingsRuleTools.appFilter.blacklistPlaceholder')
                    : t('webSettingsRuleTools.appFilter.whitelistPlaceholder')
                }
                suggestions={currentFilterSuggestions}
                suggestionsEnabled={captureReportedAppsEnabled}
                inputValue={
                  currentFilterListKey === 'appBlacklist' ? blacklistInput : whitelistInput
                }
                onInputValueChange={
                  currentFilterListKey === 'appBlacklist' ? setBlacklistInput : setWhitelistInput
                }
                onAdd={handleAddFilterItem}
                items={pagedCurrentFilterItems}
                total={filteredCurrentFilterItems.length}
                page={currentFilterPage}
                onPageChange={
                  currentFilterListKey === 'appBlacklist'
                    ? setBlacklistListPage
                    : setWhitelistListPage
                }
                savedSearchValue={currentFilterSearchInput}
                onSavedSearchValueChange={(value) => {
                  if (currentFilterListKey === 'appBlacklist') {
                    setBlacklistSearchInput(value)
                    setBlacklistListPage(0)
                  } else {
                    setWhitelistSearchInput(value)
                    setWhitelistListPage(0)
                  }
                }}
                loading={ruleToolsQuery.isLoading && !currentPayload}
                refreshing={ruleToolsQuery.isFetching && !ruleToolsQuery.isLoading}
                busy={busy}
                editingItem={currentFilterEditingItem}
                onEditingValueChange={(value) =>
                  setEditingListItem((current) =>
                    current ? { ...current, draftValue: value } : current,
                  )
                }
                onStartEdit={(value) => handleStartEditListItem(currentFilterListKey, value)}
                onCancelEdit={handleCancelEditListItem}
                onSaveEdit={handleSaveEditedListItem}
                onRemove={(value) => handleRemoveListItem(currentFilterListKey, value)}
                inputClassName="font-mono"
              />
            </div>
          </div>
          <DialogFooter className="shrink-0 border-t px-4 py-4 sm:px-6">
            <Button type="button" variant="outline" onClick={() => setDialogAppFilterOpen(false)}>
              {t('common.cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogNameOnlyOpen}
        onOpenChange={(open) => {
          setDialogNameOnlyOpen(open)
          if (!open) setEditingListItem(null)
        }}
      >
        <DialogContent className="flex h-[calc(100vh-1rem)] max-h-[calc(100vh-1rem)] w-[calc(100vw-1rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:h-[min(90vh,56rem)] sm:max-h-[min(90vh,56rem)] sm:w-[calc(100vw-1.5rem)]">
          <DialogHeader className="shrink-0 space-y-1 border-b px-4 py-4 pr-12 text-left sm:px-6">
            <DialogTitle>{t('webSettingsRuleTools.nameOnly.title')}</DialogTitle>
            <DialogDescription>
              {t('webSettingsRuleTools.nameOnly.dialogDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-hidden px-4 py-4 sm:px-6">
            <ListDialogEditor
              description={t('webSettingsRuleTools.nameOnly.inputDescription')}
              emptyText={t('webSettingsRuleTools.nameOnly.empty')}
              inputId="rule-tools-name-only"
              placeholder={t('webSettingsRuleTools.nameOnly.placeholder')}
              suggestions={nameOnlySuggestionsQuery.data ?? []}
              suggestionsEnabled={captureReportedAppsEnabled}
              inputValue={nameOnlyListInput}
              onInputValueChange={setNameOnlyListInput}
              onAdd={handleAddNameOnlyItem}
              items={pagedNameOnlyItems}
              total={filteredNameOnlyItems.length}
              page={resolvedNameOnlyListPage}
              onPageChange={setNameOnlyListPage}
              savedSearchValue={nameOnlyListSearchInput}
              onSavedSearchValueChange={(value) => {
                setNameOnlyListSearchInput(value)
                setNameOnlyListPage(0)
              }}
              loading={ruleToolsQuery.isLoading && !currentPayload}
              refreshing={ruleToolsQuery.isFetching && !ruleToolsQuery.isLoading}
              busy={busy}
              editingItem={
                editingListItem?.listKey === 'appNameOnlyList'
                  ? {
                      currentValue: editingListItem.currentValue,
                      draftValue: editingListItem.draftValue,
                    }
                  : null
              }
              onEditingValueChange={(value) =>
                setEditingListItem((current) =>
                  current ? { ...current, draftValue: value } : current,
                )
              }
              onStartEdit={(value) => handleStartEditListItem('appNameOnlyList', value)}
              onCancelEdit={handleCancelEditListItem}
              onSaveEdit={handleSaveEditedListItem}
              onRemove={(value) => handleRemoveListItem('appNameOnlyList', value)}
              inputClassName="font-mono"
            />
          </div>
          <DialogFooter className="shrink-0 border-t px-4 py-4 sm:px-6">
            <Button type="button" variant="outline" onClick={() => setDialogNameOnlyOpen(false)}>
              {t('common.cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogMediaSourceOpen}
        onOpenChange={(open) => {
          setDialogMediaSourceOpen(open)
          if (!open) setEditingMediaSourceRule(null)
        }}
      >
        <DialogContent className="flex h-[calc(100vh-1rem)] max-h-[calc(100vh-1rem)] w-[calc(100vw-1rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:h-[min(90vh,56rem)] sm:max-h-[min(90vh,56rem)] sm:w-[calc(100vw-1.5rem)]">
          <DialogHeader className="shrink-0 space-y-1 border-b px-4 py-4 pr-12 text-left sm:px-6">
            <DialogTitle>{t('webSettingsRuleTools.mediaSource.title')}</DialogTitle>
            <DialogDescription>
              {t('webSettingsRuleTools.mediaSource.dialogDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-hidden px-4 py-4 sm:px-6">
            <div className="flex h-full min-h-0 flex-col gap-3">
              <div className="shrink-0 space-y-3">
                <p className="text-xs text-muted-foreground">
                  {t('webSettingsRuleTools.mediaSource.inputDescription')}
                </p>
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
                  <Autocomplete
                    id="rule-tools-media-source"
                    items={mediaSourceSuggestionsQuery.data ?? []}
                    value={mediaSourceInput}
                    onValueChange={setMediaSourceInput}
                    placeholder={t('webSettingsRuleTools.mediaSource.placeholder')}
                    inputClassName="font-mono"
                    showClear={false}
                    emptyText={
                      captureReportedAppsEnabled
                        ? t('webSettingsRuleTools.mediaSource.noMatchingHistory')
                        : t('webSettingsRuleTools.appNameListEditor.historyDisabled')
                    }
                  />
                  <RadioGroup
                    value={mediaSourceAction}
                    onValueChange={(value) => {
                      if (value === 'block' || value === 'rename') setMediaSourceAction(value)
                    }}
                    className="grid grid-cols-2 gap-2"
                    disabled={busy}
                  >
                    <label className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs">
                      <RadioGroupItem value="block" id="media-source-action-block" />
                      {t('webSettingsRuleTools.mediaSource.actions.block')}
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs">
                      <RadioGroupItem value="rename" id="media-source-action-rename" />
                      {t('webSettingsRuleTools.mediaSource.actions.rename')}
                    </label>
                  </RadioGroup>
                </div>
                {mediaSourceAction === 'rename' ? (
                  <Input
                    value={mediaSourceDisplayName}
                    onChange={(event) => setMediaSourceDisplayName(event.target.value)}
                    placeholder={t('webSettingsRuleTools.mediaSource.displayNamePlaceholder')}
                  />
                ) : null}
                <Button
                  type="button"
                  disabled={
                    busy ||
                    mediaSourceInput.trim().length === 0 ||
                    (mediaSourceAction === 'rename' && mediaSourceDisplayName.trim().length === 0)
                  }
                  onClick={() => void handleAddMediaSourceItem()}
                >
                  {t('webSettingsRuleTools.appNameListEditor.add')}
                </Button>

                <div className="space-y-2">
                  <Label htmlFor="rule-tools-media-source-saved-search">{t('common.search')}</Label>
                  <Input
                    id="rule-tools-media-source-saved-search"
                    value={mediaSourceSearchInput}
                    onChange={(event) => {
                      setMediaSourceSearchInput(event.target.value)
                      setMediaSourceListPage(0)
                    }}
                    placeholder={t('webSettingsRuleTools.appNameListEditor.savedSearchPlaceholder')}
                  />
                  {ruleToolsQuery.isFetching && !ruleToolsQuery.isLoading ? (
                    <p className="text-xs text-muted-foreground">{t('common.refreshing')}</p>
                  ) : null}
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                {ruleToolsQuery.isLoading && !currentPayload ? (
                  <div className="flex min-h-0 flex-1 items-center justify-center rounded-lg border border-dashed border-border/60 bg-background/30 px-6 py-8 text-center">
                    <p className="text-xs text-muted-foreground">{t('webSettings.loading')}</p>
                  </div>
                ) : filteredMediaSourceItems.length === 0 ? (
                  <div className="flex min-h-0 flex-1 items-center justify-center rounded-lg border border-dashed border-border/60 bg-background/30 px-6 py-8 text-center">
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {mediaSourceSearchInput.trim()
                        ? t('webSettingsRuleTools.appNameListEditor.noSavedResults')
                        : t('webSettingsRuleTools.mediaSource.empty')}
                    </p>
                  </div>
                ) : (
                  <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
                    <p className="shrink-0 text-xs text-muted-foreground">
                      {t('webSettingsRuleTools.appNameListEditor.savedItemsPaged')}
                    </p>
                    <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border/60 bg-background/20 p-3">
                      <motion.ul className="space-y-3" layout>
                        <AnimatePresence initial={false}>
                          {pagedMediaSourceItems.map((item) => {
                            const isEditing =
                              editingMediaSourceRule?.source.toLowerCase() === item.source.toLowerCase()
                            return (
                              <motion.li
                                key={item.source.toLowerCase()}
                                className="rounded-md border bg-background/50 px-3 py-2.5"
                                variants={sectionVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={sectionTransition}
                                layout
                              >
                                {isEditing ? (
                                  <div className="space-y-3">
                                    <Input
                                      value={editingMediaSourceRule?.source ?? ''}
                                      onChange={(event) =>
                                        setEditingMediaSourceRule((current) =>
                                          current ? { ...current, source: event.target.value } : current,
                                        )
                                      }
                                      className="font-mono"
                                      placeholder={t('webSettingsRuleTools.mediaSource.placeholder')}
                                    />
                                    <RadioGroup
                                      value={editingMediaSourceRule?.action ?? 'block'}
                                      onValueChange={(value) => {
                                        if (value !== 'block' && value !== 'rename') return
                                        setEditingMediaSourceRule((current) =>
                                          current ? { ...current, action: value } : current,
                                        )
                                      }}
                                      className="grid grid-cols-2 gap-2"
                                      disabled={busy}
                                    >
                                      <label className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs">
                                        <RadioGroupItem value="block" id={`media-source-edit-block-${item.position}`} />
                                        {t('webSettingsRuleTools.mediaSource.actions.block')}
                                      </label>
                                      <label className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs">
                                        <RadioGroupItem value="rename" id={`media-source-edit-rename-${item.position}`} />
                                        {t('webSettingsRuleTools.mediaSource.actions.rename')}
                                      </label>
                                    </RadioGroup>
                                    {editingMediaSourceRule?.action === 'rename' ? (
                                      <Input
                                        value={editingMediaSourceRule?.displayName ?? ''}
                                        onChange={(event) =>
                                          setEditingMediaSourceRule((current) =>
                                            current ? { ...current, displayName: event.target.value } : current,
                                          )
                                        }
                                        placeholder={t('webSettingsRuleTools.mediaSource.displayNamePlaceholder')}
                                      />
                                    ) : null}
                                    <div className="flex flex-wrap gap-2">
                                      <Button
                                        type="button"
                                        size="sm"
                                        disabled={
                                          busy ||
                                          !(editingMediaSourceRule?.source.trim() ?? '') ||
                                          (editingMediaSourceRule?.action === 'rename' &&
                                            !(editingMediaSourceRule.displayName?.trim() ?? ''))
                                        }
                                        onClick={() => void handleSaveEditedMediaSourceRule()}
                                      >
                                        {t('common.save')}
                                      </Button>
                                      <Button type="button" size="sm" variant="outline" disabled={busy} onClick={handleCancelEditMediaSourceRule}>
                                        {t('common.cancel')}
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0 space-y-1">
                                      <p className="break-all font-mono text-sm text-foreground">{item.source}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {item.action === 'rename'
                                          ? t('webSettingsRuleTools.mediaSource.renameSummary', {
                                              value: item.displayName ?? '',
                                            })
                                          : t('webSettingsRuleTools.mediaSource.blockSummary')}
                                      </p>
                                    </div>
                                    <div className="flex shrink-0 flex-wrap gap-2">
                                      <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => handleStartEditMediaSourceRule(item)}>
                                        {t('common.edit')}
                                      </Button>
                                      <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => void handleRemoveMediaSourceRule(item.source)}>
                                        {t('common.delete')}
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </motion.li>
                            )
                          })}
                        </AnimatePresence>
                      </motion.ul>
                    </div>
                    <ListPaginationBar
                      page={resolvedMediaSourceListPage}
                      pageSize={SETTINGS_APP_LIST_PAGE_SIZE}
                      total={filteredMediaSourceItems.length}
                      onPageChange={setMediaSourceListPage}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="shrink-0 border-t px-4 py-4 sm:px-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogMediaSourceOpen(false)}
            >
              {t('common.cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={importRulesDialogOpen} onOpenChange={setImportRulesDialogOpen}>
        <DialogContent className="flex max-h-[min(92vh,52rem)] flex-col overflow-hidden sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('webSettingsRuleTools.importDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('webSettingsRuleTools.importDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 overflow-y-auto pr-1">
            <Label htmlFor="import-rules-input">{t('webSettingsRuleTools.importDialog.label')}</Label>
            <Textarea
              id="import-rules-input"
              rows={14}
              value={importRulesInput}
              onChange={(event) => setImportRulesInput(event.target.value)}
              placeholder={t('webSettingsRuleTools.importDialog.placeholder')}
              className="font-mono text-xs"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setImportRulesDialogOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="button" disabled={busy} onClick={confirmImportRules}>
              {t('webSettingsRuleTools.importDialog.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UnsavedChangesBar
        open={draftDirty}
        saving={saveDraftMutation.isPending}
        saveDisabled={heavyEditingLocked || !draftPayload}
        message={heavyEditingLocked ? t('webSettingsMigration.lockedMessage') : undefined}
        onSave={handleSaveDraft}
        onRevert={handleRevertDraft}
      />
    </>
  )
}
