import {
  SITE_SETTINGS_CORE_CATEGORY_KEYS,
} from '@/constants/site-settings'
import { createLlmSettingsCategoryRoute } from '@/lib/llm-settings-category-route'
import {
  pickCoreSettingsFromConfig,
} from '@/lib/site-settings-read'
import { persistCoreSettingsFromPrepared } from '@/lib/site-settings-write'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const route = createLlmSettingsCategoryRoute({
  bucket: 'llm-settings-core',
  categoryName: 'core',
  allowedKeys: SITE_SETTINGS_CORE_CATEGORY_KEYS,
  read: pickCoreSettingsFromConfig,
  persist: persistCoreSettingsFromPrepared,
})

export const GET = route.GET
export const PATCH = route.PATCH
