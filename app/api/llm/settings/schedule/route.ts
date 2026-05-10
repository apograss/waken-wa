import { SITE_SETTINGS_SCHEDULE_CATEGORY_KEYS } from '@/constants/site-settings'
import { createLlmSettingsCategoryRoute } from '@/lib/llm-settings-category-route'
import { pickScheduleSettingsFromConfig } from '@/lib/site-settings-read'
import { persistScheduleSettingsFromPrepared } from '@/lib/site-settings-write'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const route = createLlmSettingsCategoryRoute({
  bucket: 'llm-settings-schedule',
  categoryName: 'schedule',
  allowedKeys: SITE_SETTINGS_SCHEDULE_CATEGORY_KEYS,
  read: pickScheduleSettingsFromConfig,
  persist: (preparedValues) => persistScheduleSettingsFromPrepared(preparedValues),
})

export const GET = route.GET
export const PATCH = route.PATCH
