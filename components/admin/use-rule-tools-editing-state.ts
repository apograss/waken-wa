import { useMemo, useState } from 'react'

import {
  useHistoryAppSuggestions,
  useHistoryPlaySourceSuggestions,
} from '@/components/admin/rule-tools-hooks'
import {
  buildRuleItems,
  buildRuleToolsSummary,
  filterListValues,
  filterRuleItems,
  type ListEditingState,
  moveItem,
  normalizeDraftListValue,
  normalizeDraftMediaPlaySourceRule,
} from '@/components/admin/rule-tools-utils'
import {
  listMaxPage,
  SETTINGS_APP_LIST_PAGE_SIZE,
  SETTINGS_RULES_PAGE_SIZE,
} from '@/components/admin/web-settings-paging'
import {
  type AppMessageTitleRule,
  createAppMessageRuleGroupId,
  createAppMessageTitleRuleId,
} from '@/lib/app-message-rules'
import type {
  MediaPlaySourceRule,
  MediaPlaySourceRuleAction,
  RuleToolsExportPayload,
  RuleToolsListKey,
  RuleToolsRuleItem,
  RuleToolsSummary,
} from '@/types/rule-tools'

type RuleToolsEditingStateT = (
  key: string,
  values?: Record<string, unknown>,
) => string

export function useRuleToolsEditingState({
  t,
  currentPayload,
  updateDraftPayload,
}: {
  t: RuleToolsEditingStateT
  currentPayload: RuleToolsExportPayload | null
  updateDraftPayload: (updater: (current: RuleToolsExportPayload) => RuleToolsExportPayload) => void
}) {
  const [blacklistInput, setBlacklistInput] = useState('')
  const [whitelistInput, setWhitelistInput] = useState('')
  const [nameOnlyListInput, setNameOnlyListInput] = useState('')
  const [mediaSourceInput, setMediaSourceInput] = useState('')
  const [mediaSourceAction, setMediaSourceAction] =
    useState<MediaPlaySourceRuleAction>('block')
  const [mediaSourceDisplayName, setMediaSourceDisplayName] = useState('')
  const [editingMediaSourceRule, setEditingMediaSourceRule] =
    useState<MediaPlaySourceRule | null>(null)
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null)
  const [groupListPage, setGroupListPage] = useState(0)
  const [ruleSearchInput, setRuleSearchInput] = useState('')
  const [blacklistListPage, setBlacklistListPage] = useState(0)
  const [blacklistSearchInput, setBlacklistSearchInput] = useState('')
  const [whitelistListPage, setWhitelistListPage] = useState(0)
  const [whitelistSearchInput, setWhitelistSearchInput] = useState('')
  const [nameOnlyListPage, setNameOnlyListPage] = useState(0)
  const [nameOnlyListSearchInput, setNameOnlyListSearchInput] = useState('')
  const [mediaSourceListPage, setMediaSourceListPage] = useState(0)
  const [mediaSourceSearchInput, setMediaSourceSearchInput] = useState('')
  const [dialogAppRulesOpen, setDialogAppRulesOpen] = useState(false)
  const [dialogAppRuleEditorOpen, setDialogAppRuleEditorOpen] = useState(false)
  const [dialogAppFilterOpen, setDialogAppFilterOpen] = useState(false)
  const [dialogNameOnlyOpen, setDialogNameOnlyOpen] = useState(false)
  const [dialogMediaSourceOpen, setDialogMediaSourceOpen] = useState(false)
  const [importRulesDialogOpen, setImportRulesDialogOpen] = useState(false)
  const [importRulesInput, setImportRulesInput] = useState('')
  const [editingListItem, setEditingListItem] = useState<ListEditingState | null>(null)

  const currentSummary = useMemo<RuleToolsSummary | null>(
    () => (currentPayload ? buildRuleToolsSummary(currentPayload) : null),
    [currentPayload],
  )
  const captureReportedAppsEnabled = currentPayload?.captureReportedAppsEnabled !== false
  const appFilterMode =
    currentPayload?.appFilterMode === 'whitelist' ? 'whitelist' : 'blacklist'
  const currentFilterModeLabel =
    appFilterMode === 'blacklist'
      ? t('webSettingsRuleTools.appFilter.blacklistMode')
      : t('webSettingsRuleTools.appFilter.whitelistMode')

  const ruleItems = useMemo(
    () => (currentPayload ? buildRuleItems(currentPayload) : []),
    [currentPayload],
  )
  const filteredRuleItems = useMemo(
    () => filterRuleItems(ruleItems, ruleSearchInput),
    [ruleItems, ruleSearchInput],
  )
  const resolvedGroupListPage = Math.min(
    groupListPage,
    listMaxPage(filteredRuleItems.length, SETTINGS_RULES_PAGE_SIZE),
  )
  const pagedRuleItems = useMemo(
    () =>
      filteredRuleItems.slice(
        resolvedGroupListPage * SETTINGS_RULES_PAGE_SIZE,
        (resolvedGroupListPage + 1) * SETTINGS_RULES_PAGE_SIZE,
      ),
    [filteredRuleItems, resolvedGroupListPage],
  )
  const previewItems = useMemo(() => ruleItems.slice(0, 3), [ruleItems])
  const previewTotal = currentSummary?.ruleGroupCount ?? 0
  const previewOverflow = Math.max(0, previewTotal - previewItems.length)

  const activeSelectedRuleId = useMemo(
    () =>
      selectedRuleId && ruleItems.some((item) => item.id === selectedRuleId)
        ? selectedRuleId
        : (ruleItems[0]?.id ?? null),
    [ruleItems, selectedRuleId],
  )
  const selectedRule = useMemo(
    () => ruleItems.find((item) => item.id === activeSelectedRuleId) ?? null,
    [activeSelectedRuleId, ruleItems],
  )

  const currentFilterListKey: RuleToolsListKey =
    appFilterMode === 'blacklist' ? 'appBlacklist' : 'appWhitelist'
  const currentFilterValues = useMemo(
    () => (currentPayload?.[currentFilterListKey] ?? []) as string[],
    [currentFilterListKey, currentPayload],
  )
  const currentFilterSearchInput =
    currentFilterListKey === 'appBlacklist' ? blacklistSearchInput : whitelistSearchInput
  const currentFilterPageRaw =
    currentFilterListKey === 'appBlacklist' ? blacklistListPage : whitelistListPage
  const filteredCurrentFilterItems = useMemo(
    () => filterListValues(currentFilterValues, currentFilterSearchInput),
    [currentFilterSearchInput, currentFilterValues],
  )
  const currentFilterPage = Math.min(
    currentFilterPageRaw,
    listMaxPage(filteredCurrentFilterItems.length, SETTINGS_APP_LIST_PAGE_SIZE),
  )
  const pagedCurrentFilterItems = useMemo(
    () =>
      filteredCurrentFilterItems.slice(
        currentFilterPage * SETTINGS_APP_LIST_PAGE_SIZE,
        (currentFilterPage + 1) * SETTINGS_APP_LIST_PAGE_SIZE,
      ),
    [currentFilterPage, filteredCurrentFilterItems],
  )
  const filteredNameOnlyItems = useMemo(
    () => filterListValues(currentPayload?.appNameOnlyList ?? [], nameOnlyListSearchInput),
    [currentPayload?.appNameOnlyList, nameOnlyListSearchInput],
  )
  const resolvedNameOnlyListPage = Math.min(
    nameOnlyListPage,
    listMaxPage(filteredNameOnlyItems.length, SETTINGS_APP_LIST_PAGE_SIZE),
  )
  const pagedNameOnlyItems = useMemo(
    () =>
      filteredNameOnlyItems.slice(
        resolvedNameOnlyListPage * SETTINGS_APP_LIST_PAGE_SIZE,
        (resolvedNameOnlyListPage + 1) * SETTINGS_APP_LIST_PAGE_SIZE,
      ),
    [filteredNameOnlyItems, resolvedNameOnlyListPage],
  )
  const filteredMediaSourceItems = useMemo(() => {
    const normalized = mediaSourceSearchInput.trim().toLowerCase()
    const rules = currentPayload?.mediaPlaySourceRules ?? []
    return rules
      .map((rule, position) => ({ ...rule, position }))
      .filter((rule) => {
        if (!normalized) return true
        return [rule.source, rule.action, rule.displayName ?? ''].some((value) =>
          String(value).toLowerCase().includes(normalized),
        )
      })
  }, [currentPayload?.mediaPlaySourceRules, mediaSourceSearchInput])
  const resolvedMediaSourceListPage = Math.min(
    mediaSourceListPage,
    listMaxPage(filteredMediaSourceItems.length, SETTINGS_APP_LIST_PAGE_SIZE),
  )
  const pagedMediaSourceItems = useMemo(
    () =>
      filteredMediaSourceItems.slice(
        resolvedMediaSourceListPage * SETTINGS_APP_LIST_PAGE_SIZE,
        (resolvedMediaSourceListPage + 1) * SETTINGS_APP_LIST_PAGE_SIZE,
      ),
    [filteredMediaSourceItems, resolvedMediaSourceListPage],
  )

  const blacklistSuggestionsQuery = useHistoryAppSuggestions(
    blacklistInput,
    captureReportedAppsEnabled && dialogAppFilterOpen && appFilterMode === 'blacklist',
  )
  const whitelistSuggestionsQuery = useHistoryAppSuggestions(
    whitelistInput,
    captureReportedAppsEnabled && dialogAppFilterOpen && appFilterMode === 'whitelist',
  )
  const nameOnlySuggestionsQuery = useHistoryAppSuggestions(
    nameOnlyListInput,
    captureReportedAppsEnabled && dialogNameOnlyOpen,
  )
  const mediaSourceSuggestionsQuery = useHistoryPlaySourceSuggestions(
    mediaSourceInput,
    captureReportedAppsEnabled && dialogMediaSourceOpen,
  )
  const ruleProcessSuggestionsQuery = useHistoryAppSuggestions(
    selectedRule?.processMatch ?? '',
    captureReportedAppsEnabled && (dialogAppRuleEditorOpen || dialogAppRulesOpen),
  )

  const currentFilterSuggestions =
    currentFilterListKey === 'appBlacklist'
      ? (blacklistSuggestionsQuery.data ?? [])
      : (whitelistSuggestionsQuery.data ?? [])
  const currentFilterEditingItem =
    editingListItem?.listKey === currentFilterListKey
      ? {
          currentValue: editingListItem.currentValue,
          draftValue: editingListItem.draftValue,
        }
      : null

  const updateDraftList = (
    listKey: RuleToolsListKey,
    updater: (items: string[]) => string[],
  ) => {
    updateDraftPayload((current) => ({
      ...current,
      [listKey]: updater([...(current[listKey] as string[])]),
    }))
  }

  const updateRuleDraft = (updater: (current: RuleToolsRuleItem) => RuleToolsRuleItem) => {
    if (!activeSelectedRuleId) return
    updateDraftPayload((current) => ({
      ...current,
      appMessageRules: current.appMessageRules.map((rule, position) =>
        rule.id === activeSelectedRuleId
          ? updater({
              ...rule,
              position,
              titleRules: rule.titleRules.map((titleRule) => ({ ...titleRule })),
            })
          : {
              ...rule,
              titleRules: rule.titleRules.map((titleRule) => ({ ...titleRule })),
            },
      ),
    }))
  }

  const updateTitleRuleDraft = (
    titleRuleId: string,
    updater: (current: AppMessageTitleRule) => AppMessageTitleRule,
  ) => {
    updateRuleDraft((current) => ({
      ...current,
      titleRules: current.titleRules.map((titleRule) =>
        titleRule.id === titleRuleId ? updater(titleRule) : titleRule,
      ),
    }))
  }

  const updateMediaSourceRules = (
    updater: (items: MediaPlaySourceRule[]) => MediaPlaySourceRule[],
  ) => {
    updateDraftPayload((current) => ({
      ...current,
      mediaPlaySourceRules: updater(current.mediaPlaySourceRules.map((rule) => ({ ...rule }))),
    }))
  }

  const handleOpenRuleSelector = () => {
    if (!selectedRuleId && ruleItems[0]) {
      setSelectedRuleId(ruleItems[0].id)
    }
    setDialogAppRulesOpen(true)
  }

  const handleOpenRuleEditor = (ruleId: string) => {
    setSelectedRuleId(ruleId)
    setDialogAppRuleEditorOpen(false)
    setDialogAppRulesOpen(true)
  }

  const handleAppRuleEditorOpenChange = (open: boolean) => {
    setDialogAppRuleEditorOpen(open)
    if (!open) {
      setDialogAppRulesOpen(true)
    }
  }

  const openMobileRuleEditor = (rule: RuleToolsRuleItem) => {
    setSelectedRuleId(rule.id)
    setDialogAppRulesOpen(false)
    setDialogAppRuleEditorOpen(true)
  }

  const handleStartEditListItem = (listKey: RuleToolsListKey, value: string) => {
    setEditingListItem({
      listKey,
      currentValue: value,
      draftValue: value,
    })
  }

  const handleCancelEditListItem = () => {
    setEditingListItem(null)
  }

  const handleSaveEditedListItem = () => {
    if (!editingListItem) return
    const nextValue = normalizeDraftListValue(
      editingListItem.listKey,
      editingListItem.draftValue,
    )
    if (!nextValue) return
    updateDraftList(editingListItem.listKey, (items) => {
      const targetIndex = items.findIndex(
        (item) => item.toLowerCase() === editingListItem.currentValue.toLowerCase(),
      )
      if (targetIndex < 0) return items
      const duplicateIndex = items.findIndex(
        (item, index) =>
          index !== targetIndex && item.toLowerCase() === nextValue.toLowerCase(),
      )
      if (duplicateIndex >= 0) return items
      const next = [...items]
      next[targetIndex] = nextValue
      return next
    })
    setEditingListItem(null)
  }

  const handleRemoveListItem = (listKey: RuleToolsListKey, value: string) => {
    updateDraftList(listKey, (items) =>
      items.filter((item) => item.toLowerCase() !== value.toLowerCase()),
    )
    if (editingListItem?.listKey === listKey) {
      setEditingListItem(null)
    }
  }

  const handleAddFilterItem = () => {
    const listKey = currentFilterListKey
    const raw = listKey === 'appBlacklist' ? blacklistInput : whitelistInput
    const value = normalizeDraftListValue(listKey, raw)
    if (!value) return
    updateDraftList(listKey, (items) => {
      if (items.some((item) => item.toLowerCase() === value.toLowerCase())) return items
      return [...items, value]
    })
    if (listKey === 'appBlacklist') {
      setBlacklistInput('')
      setBlacklistSearchInput('')
      setBlacklistListPage(
        listMaxPage((currentPayload?.appBlacklist.length ?? 0) + 1, SETTINGS_APP_LIST_PAGE_SIZE),
      )
    } else {
      setWhitelistInput('')
      setWhitelistSearchInput('')
      setWhitelistListPage(
        listMaxPage((currentPayload?.appWhitelist.length ?? 0) + 1, SETTINGS_APP_LIST_PAGE_SIZE),
      )
    }
  }

  const handleAddNameOnlyItem = () => {
    const value = normalizeDraftListValue('appNameOnlyList', nameOnlyListInput)
    if (!value) return
    updateDraftList('appNameOnlyList', (items) => {
      if (items.some((item) => item.toLowerCase() === value.toLowerCase())) return items
      return [...items, value]
    })
    setNameOnlyListInput('')
    setNameOnlyListSearchInput('')
    setNameOnlyListPage(
      listMaxPage((currentPayload?.appNameOnlyList.length ?? 0) + 1, SETTINGS_APP_LIST_PAGE_SIZE),
    )
  }

  const handleStartEditMediaSourceRule = (rule: MediaPlaySourceRule) => {
    setEditingMediaSourceRule({ ...rule })
  }

  const handleCancelEditMediaSourceRule = () => {
    setEditingMediaSourceRule(null)
  }

  const handleSaveEditedMediaSourceRule = () => {
    if (!editingMediaSourceRule) return
    const nextRule = normalizeDraftMediaPlaySourceRule(editingMediaSourceRule)
    if (!nextRule) return
    updateMediaSourceRules((items) => {
      const targetIndex = items.findIndex(
        (item) => item.source.toLowerCase() === editingMediaSourceRule.source.toLowerCase(),
      )
      if (targetIndex < 0) return items
      const duplicateIndex = items.findIndex(
        (item, index) =>
          index !== targetIndex && item.source.toLowerCase() === nextRule.source.toLowerCase(),
      )
      if (duplicateIndex >= 0) return items
      const next = [...items]
      next[targetIndex] = nextRule
      return next
    })
    setEditingMediaSourceRule(null)
  }

  const handleRemoveMediaSourceRule = (source: string) => {
    updateMediaSourceRules((items) =>
      items.filter((item) => item.source.toLowerCase() !== source.toLowerCase()),
    )
    if (editingMediaSourceRule?.source.toLowerCase() === source.toLowerCase()) {
      setEditingMediaSourceRule(null)
    }
  }

  const handleAddMediaSourceItem = () => {
    const rule = normalizeDraftMediaPlaySourceRule({
      source: mediaSourceInput,
      action: mediaSourceAction,
      displayName: mediaSourceDisplayName,
    })
    if (!rule) return
    updateMediaSourceRules((items) => {
      if (items.some((item) => item.source.toLowerCase() === rule.source.toLowerCase())) return items
      return [...items, rule]
    })
    setMediaSourceInput('')
    setMediaSourceAction('block')
    setMediaSourceDisplayName('')
    setMediaSourceSearchInput('')
    setMediaSourceListPage(
      listMaxPage(
        (currentPayload?.mediaPlaySourceRules.length ?? 0) + 1,
        SETTINGS_APP_LIST_PAGE_SIZE,
      ),
    )
  }

  const handleAddRuleGroup = (openEditor = false) => {
    const nextId = createAppMessageRuleGroupId()
    updateDraftPayload((current) => ({
      ...current,
      appMessageRules: [
        ...current.appMessageRules,
        {
          id: nextId,
          processMatch: '',
          defaultText: undefined,
          titleRules: [],
        },
      ],
    }))
    setRuleSearchInput('')
    setGroupListPage(
      listMaxPage((currentPayload?.appMessageRules.length ?? 0) + 1, SETTINGS_RULES_PAGE_SIZE),
    )
    setSelectedRuleId(nextId)
    if (openEditor) {
      setDialogAppRulesOpen(false)
      setDialogAppRuleEditorOpen(true)
    }
  }

  const handleDeleteRuleGroup = (groupId: string) => {
    updateDraftPayload((current) => ({
      ...current,
      appMessageRules: current.appMessageRules.filter((rule) => rule.id !== groupId),
    }))
    if (selectedRuleId === groupId) {
      setSelectedRuleId(null)
    }
    if (dialogAppRuleEditorOpen) {
      setDialogAppRuleEditorOpen(false)
      setDialogAppRulesOpen(true)
    }
  }

  const handleMoveRuleGroup = (groupId: string, toIndex: number) => {
    updateDraftPayload((current) => {
      const fromIndex = current.appMessageRules.findIndex((rule) => rule.id === groupId)
      if (fromIndex < 0) return current
      return {
        ...current,
        appMessageRules: moveItem(current.appMessageRules, fromIndex, toIndex),
      }
    })
  }

  const handleAddTitleRule = () => {
    if (!selectedRule) return
    updateRuleDraft((current) => ({
      ...current,
      titleRules: [
        ...current.titleRules,
        {
          id: createAppMessageTitleRuleId(),
          mode: 'plain',
          pattern: '',
          text: '',
        },
      ],
    }))
  }

  const handleDeleteTitleRule = (titleRuleId: string) => {
    updateRuleDraft((current) => ({
      ...current,
      titleRules: current.titleRules.filter((item) => item.id !== titleRuleId),
    }))
  }

  const handleMoveTitleRule = (titleRuleId: string, toIndex: number) => {
    updateRuleDraft((current) => {
      const fromIndex = current.titleRules.findIndex((item) => item.id === titleRuleId)
      if (fromIndex < 0) return current
      return {
        ...current,
        titleRules: moveItem(current.titleRules, fromIndex, toIndex),
      }
    })
  }

  const handleTitleRuleModeChange = (titleRuleId: string, nextMode: 'plain' | 'regex') => {
    updateTitleRuleDraft(titleRuleId, (current) => ({
      ...current,
      mode: nextMode,
    }))
  }

  const resetImportSearchInputs = () => {
    setRuleSearchInput('')
    setBlacklistSearchInput('')
    setWhitelistSearchInput('')
    setNameOnlyListSearchInput('')
    setMediaSourceSearchInput('')
  }

  return {
    currentSummary,
    captureReportedAppsEnabled,
    appFilterMode,
    currentFilterModeLabel,
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
    currentFilterValues,
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
    selectedRuleId,
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
    resetImportSearchInputs,
  }
}
