'use client'

import { useAtom } from 'jotai'
import { useReducedMotion } from 'motion/react'
import { useT } from 'next-i18next/client'

import {
  getAdminPanelTransition,
  getAdminSectionVariants,
} from '@/components/admin/admin-motion'
import {
  formatNumberRange,
  NumberSettingInput,
} from '@/components/admin/number-setting-input'
import { RuleToolsGroupEditor } from '@/components/admin/rule-tools-group-editor'
import { RuleToolsGroupList } from '@/components/admin/rule-tools-group-list'
import { RuleToolsImportDialog } from '@/components/admin/rule-tools-import-dialog'
import { ListDialogEditor } from '@/components/admin/rule-tools-list-dialog-editor'
import { RuleToolsMediaSourceDialog } from '@/components/admin/rule-tools-media-source-dialog'
import { RuleToolsPreview } from '@/components/admin/rule-tools-preview'
import { getErrorMessage } from '@/components/admin/rule-tools-utils'
import { UnsavedChangesBar } from '@/components/admin/unsaved-changes-bar'
import { useRuleToolsState } from '@/components/admin/use-rule-tools-state'
import {
  WebSettingsInset,
  WebSettingsRow,
  WebSettingsRows,
} from '@/components/admin/web-settings-layout'
import { webSettingsMigrationAtom } from '@/components/admin/web-settings-store'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { REPORTED_APP_TITLE_LIMIT_MAX } from '@/lib/reported-app-title-limit'

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

  const handleChooseRuleGroup = () => {
    setDialogAppRuleEditorOpen(false)
    setDialogAppRulesOpen(true)
  }

  const renderRuleGroupEditor = (mobile: boolean) => (
    <RuleToolsGroupEditor
      mobile={mobile}
      isLoading={ruleToolsQuery.isLoading}
      hasPayload={Boolean(currentPayload)}
      busy={busy}
      selectedRule={selectedRule}
      totalRuleCount={currentSummary?.ruleGroupCount ?? 0}
      ruleProcessSuggestions={ruleProcessSuggestionsQuery.data ?? []}
      captureReportedAppsEnabled={captureReportedAppsEnabled}
      sectionVariants={sectionVariants}
      sectionTransition={sectionTransition}
      t={t}
      onChooseGroup={handleChooseRuleGroup}
      onAddRuleGroup={handleAddRuleGroup}
      onMoveRuleGroup={handleMoveRuleGroup}
      onDeleteRuleGroup={handleDeleteRuleGroup}
      onAddTitleRule={handleAddTitleRule}
      onDeleteTitleRule={handleDeleteTitleRule}
      onMoveTitleRule={handleMoveTitleRule}
      onTitleRuleModeChange={handleTitleRuleModeChange}
      updateRuleDraft={updateRuleDraft}
      updateTitleRuleDraft={updateTitleRuleDraft}
    />
  )

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
              <RuleToolsPreview
                isLoading={ruleToolsQuery.isLoading}
                previewItems={previewItems}
                previewTotal={previewTotal}
                previewOverflow={previewOverflow}
                canEdit={Boolean(currentPayload) && !busy}
                sectionVariants={sectionVariants}
                sectionTransition={sectionTransition}
                t={t}
                onOpenRuleEditor={handleOpenRuleEditor}
              />
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
                <NumberSettingInput
                  id="rule-tools-capture-reported-app-title-limit"
                  min={0}
                  max={REPORTED_APP_TITLE_LIMIT_MAX}
                  step={1}
                  className="w-24"
                  value={currentPayload?.captureReportedAppTitleLimit ?? 3}
                  disabled={!currentPayload || busy}
                  rangeMessage={formatNumberRange(0, REPORTED_APP_TITLE_LIMIT_MAX)}
                  onValueChange={(nextLimit) => {
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

      <RuleToolsMediaSourceDialog
        open={dialogMediaSourceOpen}
        isLoading={ruleToolsQuery.isLoading}
        isFetching={ruleToolsQuery.isFetching}
        hasPayload={Boolean(currentPayload)}
        busy={busy}
        captureReportedAppsEnabled={captureReportedAppsEnabled}
        mediaSourceSuggestions={mediaSourceSuggestionsQuery.data ?? []}
        mediaSourceInput={mediaSourceInput}
        setMediaSourceInput={setMediaSourceInput}
        mediaSourceAction={mediaSourceAction}
        setMediaSourceAction={setMediaSourceAction}
        mediaSourceDisplayName={mediaSourceDisplayName}
        setMediaSourceDisplayName={setMediaSourceDisplayName}
        mediaSourceSearchInput={mediaSourceSearchInput}
        setMediaSourceSearchInput={setMediaSourceSearchInput}
        setMediaSourceListPage={setMediaSourceListPage}
        filteredMediaSourceItems={filteredMediaSourceItems}
        pagedMediaSourceItems={pagedMediaSourceItems}
        resolvedMediaSourceListPage={resolvedMediaSourceListPage}
        editingMediaSourceRule={editingMediaSourceRule}
        setEditingMediaSourceRule={setEditingMediaSourceRule}
        sectionVariants={sectionVariants}
        sectionTransition={sectionTransition}
        t={t}
        onOpenChange={setDialogMediaSourceOpen}
        onAddMediaSourceItem={handleAddMediaSourceItem}
        onStartEditMediaSourceRule={handleStartEditMediaSourceRule}
        onCancelEditMediaSourceRule={handleCancelEditMediaSourceRule}
        onSaveEditedMediaSourceRule={handleSaveEditedMediaSourceRule}
        onRemoveMediaSourceRule={handleRemoveMediaSourceRule}
      />

      <RuleToolsImportDialog
        open={importRulesDialogOpen}
        busy={busy}
        importRulesInput={importRulesInput}
        t={t}
        onOpenChange={setImportRulesDialogOpen}
        onImportRulesInputChange={setImportRulesInput}
        onConfirmImportRules={confirmImportRules}
      />

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
