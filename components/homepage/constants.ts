export interface SearchEngine {
  id: string;
  name: string; // i18n key
  icon: string; // path to SVG icon
  searchUrl: string; // {query} placeholder
}

export const DEFAULT_SEARCH_ENGINES: SearchEngine[] = [
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
];

export const TIME_PERIODS = {
  morning: { start: 5, end: 11 }, // 05:00-11:59
  afternoon: { start: 12, end: 17 }, // 12:00-17:59
  evening: { start: 18, end: 4 }, // 18:00-04:59
} as const;

export const LOCALSTORAGE_KEYS = {
  preferredEngine: 'homepage_preferred_engine',
} as const;

export function getTimePeriod(hour: number): 'morning' | 'afternoon' | 'evening' {
  if (hour >= 5 && hour <= 11) return 'morning';
  if (hour >= 12 && hour <= 17) return 'afternoon';
  return 'evening';
}

export function buildSearchUrl(engine: SearchEngine, query: string): string {
  return engine.searchUrl.replace('{query}', encodeURIComponent(query));
}
