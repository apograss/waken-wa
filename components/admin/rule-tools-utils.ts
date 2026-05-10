import {
  type AppMessageTitleRule,
  normalizeAppMessageRegexPattern,
  prepareAppMessageRulesForSave,
} from '@/lib/app-message-rules'
import {
  mediaPlaySourceBlocklistFromRules,
  normalizeMediaPlaySourceRules,
} from '@/lib/media-play-source-rules'
import { normalizeReportedAppTitleLimit } from '@/lib/reported-app-title-limit'
import type {
  AppMessageRuleGroup,
  MediaPlaySourceRule,
  RuleToolsExportPayload,
  RuleToolsListItem,
  RuleToolsListKey,
  RuleToolsRuleItem,
  RuleToolsSummary,
} from '@/types/rule-tools'

export type ListEditingState = {
  listKey: RuleToolsListKey
  currentValue: string
  draftValue: string
}

export function summarizeAppRuleGroup(
  rule: AppMessageRuleGroup,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const process = rule.processMatch.trim() || t('webSettingsRuleTools.appRules.matchEmpty')
  const fallback = String(rule.defaultText ?? '').trim()
  const titleRuleCount = Array.isArray(rule.titleRules) ? rule.titleRules.length : 0
  if (fallback) {
    return t('webSettingsRuleTools.appRules.groupSummaryWithDefault', { process, text: fallback })
  }
  if (titleRuleCount > 0) {
    return t('webSettingsRuleTools.appRules.groupSummaryWithTitleRules', {
      process,
      count: titleRuleCount,
    })
  }
  return process
}

export function cloneRuleToolsPayload(payload: RuleToolsExportPayload): RuleToolsExportPayload {
  const mediaPlaySourceRules = normalizeMediaPlaySourceRules(
    payload.mediaPlaySourceRules,
    payload.mediaPlaySourceBlocklist,
  ).map((rule) => ({ ...rule }))
  return {
    appMessageRules: payload.appMessageRules.map((rule) => ({
      ...rule,
      titleRules: rule.titleRules.map((titleRule) => ({ ...titleRule })),
    })),
    appMessageRulesShowProcessName: payload.appMessageRulesShowProcessName !== false,
    appFilterMode: payload.appFilterMode === 'whitelist' ? 'whitelist' : 'blacklist',
    appBlacklist: [...payload.appBlacklist],
    appWhitelist: [...payload.appWhitelist],
    appNameOnlyList: [...payload.appNameOnlyList],
    captureReportedAppsEnabled: payload.captureReportedAppsEnabled !== false,
    captureReportedAppTitleLimit: payload.captureReportedAppTitleLimit,
    mediaPlaySourceRules,
    mediaPlaySourceBlocklist: mediaPlaySourceBlocklistFromRules(mediaPlaySourceRules),
  }
}

export function buildRuleToolsSummary(payload: RuleToolsExportPayload): RuleToolsSummary {
  const mediaPlaySourceRules = normalizeMediaPlaySourceRules(
    payload.mediaPlaySourceRules,
    payload.mediaPlaySourceBlocklist,
  )
  return {
    appMessageRulesShowProcessName: payload.appMessageRulesShowProcessName !== false,
    appFilterMode: payload.appFilterMode === 'whitelist' ? 'whitelist' : 'blacklist',
    captureReportedAppsEnabled: payload.captureReportedAppsEnabled !== false,
    captureReportedAppTitleLimit: normalizeReportedAppTitleLimit(
      payload.captureReportedAppTitleLimit,
    ),
    ruleGroupCount: payload.appMessageRules.length,
    appBlacklistCount: payload.appBlacklist.length,
    appWhitelistCount: payload.appWhitelist.length,
    appNameOnlyListCount: payload.appNameOnlyList.length,
    mediaPlaySourceRuleCount: mediaPlaySourceRules.length,
    mediaPlaySourceBlocklistCount: mediaPlaySourceBlocklistFromRules(mediaPlaySourceRules).length,
  }
}

export function buildRuleItems(payload: RuleToolsExportPayload): RuleToolsRuleItem[] {
  return payload.appMessageRules.map((rule, position) => ({
    ...rule,
    position,
  }))
}

export function filterRuleItems(items: RuleToolsRuleItem[], q: string): RuleToolsRuleItem[] {
  const normalized = q.trim().toLowerCase()
  if (!normalized) return items
  return items.filter((item) => {
    const haystacks = [
      item.processMatch,
      item.defaultText ?? '',
      ...item.titleRules.flatMap((titleRule) => [titleRule.pattern, titleRule.text]),
    ]
    return haystacks.some((value) => String(value).toLowerCase().includes(normalized))
  })
}

export function filterListValues(values: string[], q: string): RuleToolsListItem[] {
  const normalized = q.trim().toLowerCase()
  return values
    .map((value, position) => ({ value, position }))
    .filter(
      (item) => item.value.length > 0 && (normalized ? item.value.toLowerCase().includes(normalized) : true),
    )
}

export function normalizeDraftListValue(_listKey: RuleToolsListKey, raw: string): string {
  return raw.trim()
}

export function normalizeDraftMediaPlaySourceRule(raw: Partial<MediaPlaySourceRule>): MediaPlaySourceRule | null {
  const source = String(raw.source ?? '').trim().toLowerCase()
  if (!source) return null
  const action = raw.action === 'rename' ? 'rename' : 'block'
  const displayName = String(raw.displayName ?? '').trim()
  return {
    source,
    action,
    ...(action === 'rename' && displayName ? { displayName } : {}),
    ...(raw.default === true ? { default: true } : {}),
  }
}

export function dedupeMediaPlaySourceRules(rules: unknown, legacy?: unknown): MediaPlaySourceRule[] {
  return normalizeMediaPlaySourceRules(rules, legacy).map((rule) => ({ ...rule }))
}

export function dedupeDraftList(listKey: RuleToolsListKey, values: string[]): string[] {
  const next: string[] = []
  const seen = new Set<string>()
  for (const raw of values) {
    const value = normalizeDraftListValue(listKey, raw)
    if (!value) continue
    const key = value.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    next.push(value)
  }
  return next
}

export function normalizePayloadForSave(
  payload: RuleToolsExportPayload,
): {
  data: RuleToolsExportPayload
  error:
    | { type: 'regex'; group: number; rule: number; message: string }
    | { type: 'range'; message: string }
    | null
} {
  const preparedRules = prepareAppMessageRulesForSave(payload.appMessageRules)
  if (preparedRules.errors.length > 0) {
    const first = preparedRules.errors[0]
    return {
      data: cloneRuleToolsPayload(payload),
      error: {
        type: 'regex',
        group: first.groupIndex + 1,
        rule: first.titleRuleIndex + 1,
        message: first.message,
      },
    }
  }
  const titleLimit = Number(payload.captureReportedAppTitleLimit)
  if (
    !Number.isSafeInteger(titleLimit) ||
    titleLimit < 0 ||
    titleLimit > 10
  ) {
    return {
      data: cloneRuleToolsPayload(payload),
      error: {
        type: 'range',
        message: 'captureReportedAppTitleLimit must be an integer between 0 and 10',
      },
    }
  }

  return {
    data: {
      appMessageRules: preparedRules.data,
      appMessageRulesShowProcessName: payload.appMessageRulesShowProcessName !== false,
      appFilterMode: payload.appFilterMode === 'whitelist' ? 'whitelist' : 'blacklist',
      appBlacklist: dedupeDraftList('appBlacklist', payload.appBlacklist),
      appWhitelist: dedupeDraftList('appWhitelist', payload.appWhitelist),
      appNameOnlyList: dedupeDraftList('appNameOnlyList', payload.appNameOnlyList),
      captureReportedAppsEnabled: payload.captureReportedAppsEnabled !== false,
      captureReportedAppTitleLimit: titleLimit,
      mediaPlaySourceRules: dedupeMediaPlaySourceRules(
        payload.mediaPlaySourceRules,
        payload.mediaPlaySourceBlocklist,
      ),
      mediaPlaySourceBlocklist: mediaPlaySourceBlocklistFromRules(
        dedupeMediaPlaySourceRules(payload.mediaPlaySourceRules, payload.mediaPlaySourceBlocklist),
      ),
    },
    error: null,
  }
}

export function areRuleToolsPayloadEqual(
  left: RuleToolsExportPayload | null,
  right: RuleToolsExportPayload | null,
): boolean {
  if (!left || !right) return left === right
  return JSON.stringify(left) === JSON.stringify(right)
}

export function moveItem<T>(items: readonly T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex) return [...items]
  const next = [...items]
  const [item] = next.splice(fromIndex, 1)
  if (typeof item === "undefined") return next
  next.splice(toIndex, 0, item)
  return next
}

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.trim() ? error.message : fallback
}

export function getTitleRuleRegexErrorMessage(
  titleRule: AppMessageTitleRule,
  groupIndex: number,
  titleRuleIndex: number,
  t: (key: string, options?: Record<string, unknown>) => string,
): string | null {
  if (titleRule.mode !== 'regex' || !titleRule.pattern.trim()) return null
  try {
    new RegExp(normalizeAppMessageRegexPattern(titleRule.pattern), 'i')
    return null
  } catch (error) {
    return t('webSettingsRuleTools.appRules.invalidRegex', {
      group: groupIndex + 1,
      rule: titleRuleIndex + 1,
      message: error instanceof Error ? error.message : 'Invalid regular expression',
    })
  }
}
