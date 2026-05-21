import type {
  HomepageGreetingSource,
  HomepageSearchEngine,
  HomepageSearchEngineId,
  HomepageSettings,
} from '@/types/homepage-settings'

export const HOMEPAGE_SEARCH_ENGINES = [
  {
    id: 'baidu',
    name: 'homepage.search.engine.baidu',
    icon: '/icons/baidu.svg',
    searchUrl: 'https://www.baidu.com/s?wd={query}',
  },
  {
    id: 'bing',
    name: 'homepage.search.engine.bing',
    icon: '/icons/bing.svg',
    searchUrl: 'https://www.bing.com/search?q={query}',
  },
  {
    id: 'google',
    name: 'homepage.search.engine.google',
    icon: '/icons/google.svg',
    searchUrl: 'https://www.google.com/search?q={query}',
  },
  {
    id: 'yandex',
    name: 'homepage.search.engine.yandex',
    icon: '/icons/yandex.svg',
    searchUrl: 'https://yandex.com/search/?text={query}',
  },
  {
    id: 'sogou',
    name: 'homepage.search.engine.sogou',
    icon: '/icons/sogou.svg',
    searchUrl: 'https://www.sogou.com/web?query={query}',
  },
  {
    id: '360',
    name: 'homepage.search.engine.360',
    icon: '/icons/360.svg',
    searchUrl: 'https://www.so.com/s?q={query}',
  },
] as const satisfies readonly HomepageSearchEngine[]

export const HOMEPAGE_SEARCH_ENGINE_IDS = HOMEPAGE_SEARCH_ENGINES.map(
  (engine) => engine.id,
) as HomepageSearchEngineId[]

export const HOMEPAGE_DEFAULT_VISIBLE_ENGINES: HomepageSearchEngineId[] = [
  'baidu',
  'bing',
  'google',
  'yandex',
  'sogou',
  '360',
]

export const HOMEPAGE_DEFAULT_ENGINE: HomepageSearchEngineId = 'bing'

export const HOMEPAGE_GREETING_SOURCES: HomepageGreetingSource[] = [
  'hitokoto',
  'custom',
]

export const HOMEPAGE_DEFAULT_COVER_IMAGE = '/assets/cover.png'

export const HOMEPAGE_GREETING_CUSTOM_TEXT_MAX_LENGTH = 160

export const HOMEPAGE_SETTINGS_DEFAULTS: HomepageSettings = {
  visibleEngines: HOMEPAGE_DEFAULT_VISIBLE_ENGINES,
  defaultEngine: HOMEPAGE_DEFAULT_ENGINE,
  greetingSource: 'hitokoto',
  greetingCustomText: '',
  weatherEnabled: true,
  demoEnabled: true,
  coverImage: HOMEPAGE_DEFAULT_COVER_IMAGE,
}
