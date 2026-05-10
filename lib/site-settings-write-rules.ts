import 'server-only'

import { eq } from 'drizzle-orm'

import { SITE_SETTINGS_SITE_CONFIG_ID } from '@/constants/site-settings'
import {
  SITE_SETTINGS_RULES_SCALAR_KEYS,
  SITE_SETTINGS_RULES_STRING_LIST_KEYS,
} from '@/constants/site-settings-storage'
import { normalizeAppMessageRules } from '@/lib/app-message-rules'
import {
  siteSettingsV2RuleGroups,
  siteSettingsV2RuleTitleRules,
} from '@/lib/drizzle-schema'
import {
  BuildSiteSettingsScalarEntryRows,
  BuildSiteSettingsStringListEntryRows,
  ReplaceSiteSettingsScalarEntries,
  ReplaceSiteSettingsStringListEntries,
} from '@/lib/site-settings-write-entries'
import { NormalizeSiteSettingsStringOrNull } from '@/lib/site-settings-write-utils'
import { sqlTimestamp } from '@/lib/sql-timestamp'
import type { SiteSettingsRecord } from '@/types/site-settings'

export async function ReplaceRulesSettingsRows(
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
