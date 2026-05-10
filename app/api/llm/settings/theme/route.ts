import { SITE_SETTINGS_THEME_CATEGORY_KEYS } from '@/constants/site-settings'
import { createLlmSettingsCategoryRoute } from '@/lib/llm-settings-category-route'
import { pickThemeSettingsFromConfig } from '@/lib/site-settings-read'
import { persistThemeSettingsFromPrepared } from '@/lib/site-settings-write'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const route = createLlmSettingsCategoryRoute({
  bucket: 'llm-settings-theme',
  categoryName: 'theme',
  allowedKeys: SITE_SETTINGS_THEME_CATEGORY_KEYS,
  read: pickThemeSettingsFromConfig,
  persist: (preparedValues) => persistThemeSettingsFromPrepared(preparedValues),
})

export const GET = route.GET
export const PATCH = route.PATCH
