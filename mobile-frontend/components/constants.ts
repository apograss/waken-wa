import {
  HOMEPAGE_SEARCH_ENGINES,
} from '@/constants/homepage-settings'
import type { HomepageSearchEngine as SearchEngine } from '@/types/homepage-settings'

export type { SearchEngine }

export const DEFAULT_SEARCH_ENGINES = HOMEPAGE_SEARCH_ENGINES

export const TIME_PERIODS = {
  morning: { start: 5, end: 11 },
  afternoon: { start: 12, end: 17 },
  evening: { start: 18, end: 4 },
} as const

export const LOCALSTORAGE_KEYS = {
  preferredEngine: 'homepage_preferred_engine',
} as const

export function getTimePeriod(hour: number): 'morning' | 'afternoon' | 'evening' {
  if (hour >= 5 && hour <= 11) return 'morning'
  if (hour >= 12 && hour <= 17) return 'afternoon'
  return 'evening'
}

export function buildSearchUrl(engine: SearchEngine, query: string): string {
  return engine.searchUrl.replace('{query}', encodeURIComponent(query))
}
