import {
  HOMEPAGE_DEFAULT_COVER_IMAGE,
  HOMEPAGE_DEFAULT_ENGINE,
  HOMEPAGE_DEFAULT_VISIBLE_ENGINES,
  HOMEPAGE_GREETING_CUSTOM_TEXT_MAX_LENGTH,
  HOMEPAGE_SEARCH_ENGINE_IDS,
  HOMEPAGE_SETTINGS_DEFAULTS,
} from '@/constants/homepage-settings'
import { parseJsonString } from '@/lib/json-parse'
import type {
  HomepageGreetingSource,
  HomepageSearchEngineId,
  HomepageSettings,
} from '@/types/homepage-settings'

const HOMEPAGE_SEARCH_ENGINE_ID_SET = new Set<string>(HOMEPAGE_SEARCH_ENGINE_IDS)

export function IsHomepageSearchEngineId(value: unknown): value is HomepageSearchEngineId {
  return typeof value === 'string' && HOMEPAGE_SEARCH_ENGINE_ID_SET.has(value)
}

export function NormalizeHomepageVisibleEngines(raw: unknown): HomepageSearchEngineId[] {
  const parsed = parseJsonString(raw)
  const items = Array.isArray(parsed) ? parsed : []
  const output: HomepageSearchEngineId[] = []
  const seen = new Set<HomepageSearchEngineId>()

  for (const item of items) {
    const value = String(item ?? '').trim()
    if (!IsHomepageSearchEngineId(value) || seen.has(value)) continue
    seen.add(value)
    output.push(value)
  }

  return output.length > 0 ? output : [...HOMEPAGE_DEFAULT_VISIBLE_ENGINES]
}

export function NormalizeHomepageDefaultEngine(
  raw: unknown,
  visibleEngines?: readonly HomepageSearchEngineId[],
): HomepageSearchEngineId {
  const visible = visibleEngines?.length
    ? [...visibleEngines]
    : HOMEPAGE_DEFAULT_VISIBLE_ENGINES
  const value = String(raw ?? '').trim()

  if (IsHomepageSearchEngineId(value) && visible.includes(value)) {
    return value
  }
  if (visible.includes(HOMEPAGE_DEFAULT_ENGINE)) {
    return HOMEPAGE_DEFAULT_ENGINE
  }
  return visible[0] ?? HOMEPAGE_DEFAULT_ENGINE
}

export function NormalizeHomepageGreetingSource(raw: unknown): HomepageGreetingSource {
  return String(raw ?? '').trim().toLowerCase() === 'custom' ? 'custom' : 'hitokoto'
}

export function NormalizeHomepageGreetingCustomText(raw: unknown): string {
  return String(raw ?? '').trim().slice(0, HOMEPAGE_GREETING_CUSTOM_TEXT_MAX_LENGTH)
}

export function NormalizeHomepageCoverImage(raw: unknown): string {
  return String(raw ?? '').trim() || HOMEPAGE_DEFAULT_COVER_IMAGE
}

export function NormalizeHomepageSettings(
  config: Record<string, unknown>,
): HomepageSettings {
  const visibleEngines = NormalizeHomepageVisibleEngines(config.homepageVisibleEngines)

  return {
    visibleEngines,
    defaultEngine: NormalizeHomepageDefaultEngine(
      config.homepageDefaultEngine,
      visibleEngines,
    ),
    greetingSource: NormalizeHomepageGreetingSource(config.homepageGreetingSource),
    greetingCustomText: NormalizeHomepageGreetingCustomText(
      config.homepageGreetingCustomText,
    ),
    weatherEnabled:
      config.homepageWeatherEnabled === undefined
        ? HOMEPAGE_SETTINGS_DEFAULTS.weatherEnabled
        : config.homepageWeatherEnabled === true,
    demoEnabled:
      config.homepageDemoEnabled === undefined
        ? HOMEPAGE_SETTINGS_DEFAULTS.demoEnabled
        : config.homepageDemoEnabled === true,
    coverImage: NormalizeHomepageCoverImage(config.homepageCoverImage),
  }
}
