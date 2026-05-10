import { SITE_SETTINGS_RULES_KEYS } from '@/constants/site-settings'
import { createLlmSettingsCategoryRoute } from '@/lib/llm-settings-category-route'
import { pickRulesSettingsFromConfig } from '@/lib/site-settings-read'
import { persistRulesSettingsValues } from '@/lib/site-settings-write'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const route = createLlmSettingsCategoryRoute({
  bucket: 'llm-settings-rules',
  categoryName: 'rules',
  allowedKeys: SITE_SETTINGS_RULES_KEYS,
  read: pickRulesSettingsFromConfig,
  persist: async (preparedValues) => {
    await persistRulesSettingsValues(preparedValues)
    const data = await import('@/lib/llm-site-config').then(({ getSafeSiteConfig }) =>
      getSafeSiteConfig('admin'),
    )
    return data as Record<string, unknown> | null
  },
})

export const GET = route.GET
export const PATCH = route.PATCH
