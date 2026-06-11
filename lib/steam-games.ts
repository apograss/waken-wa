import 'server-only'

import { db } from '@/lib/db'
import { steamGameRecords } from '@/lib/drizzle-schema'
import { sqlTimestamp } from '@/lib/sql-timestamp'
import { isValidSteamId } from '@/lib/steam'
import { type ParsedSteamGame,parseRecentlyPlayedGames } from '@/lib/steam-games-parse'

/** Re-fetch from Steam at most this often; otherwise serve the DB cache. */
const CACHE_TTL_MS = 30 * 60 * 1000
const MAX_GAMES = 8

export interface SteamGameRecordView {
  appId: string
  name: string
  headerImageUrl: string | null
  iconUrl: string | null
  playtime2weeksMin: number
  playtimeForeverMin: number
}

export interface SteamGamesResult {
  games: SteamGameRecordView[]
  lastFetchedAt: string | null
}

const EMPTY: SteamGamesResult = { games: [], lastFetchedAt: null }

export interface GetSteamGameRecordsOptions {
  steamEnabled: boolean
  apiKey: string
  steamId: string
  nowMs: number
}

/**
 * Steam "recently played" records, cached in DB and refreshed when stale.
 * Degrades silently: a failed / private / unconfigured fetch returns the
 * existing cache (or empty), never throws.
 */
export async function getSteamGameRecords(
  options: GetSteamGameRecordsOptions,
): Promise<SteamGamesResult> {
  if (!options.steamEnabled) return EMPTY
  const apiKey = options.apiKey.trim()
  const steamId = options.steamId.trim()
  if (!apiKey || !steamId || !isValidSteamId(steamId)) return EMPTY

  const cached = await readCache()
  if (cached.games.length > 0 && cached.lastFetchedAt) {
    const ageMs = options.nowMs - Date.parse(cached.lastFetchedAt)
    if (Number.isFinite(ageMs) && ageMs >= 0 && ageMs < CACHE_TTL_MS) {
      return cached
    }
  }

  const fresh = await fetchRecentlyPlayed(steamId, apiKey)
  if (fresh.length === 0) {
    // Fetch failed / profile private / no recent games → keep showing the cache.
    return cached
  }

  await persist(fresh)
  return readCache()
}

type SteamGameCacheRow = {
  appId: string
  name: string
  headerImageUrl: string | null
  iconUrl: string | null
  playtime2weeksMin: number
  playtimeForeverMin: number
  lastFetchedAt: Date | string | null
}

async function readCache(): Promise<SteamGamesResult> {
  const rows = (await db
    .select({
      appId: steamGameRecords.appId,
      name: steamGameRecords.name,
      headerImageUrl: steamGameRecords.headerImageUrl,
      iconUrl: steamGameRecords.iconUrl,
      playtime2weeksMin: steamGameRecords.playtime2weeksMin,
      playtimeForeverMin: steamGameRecords.playtimeForeverMin,
      lastFetchedAt: steamGameRecords.lastFetchedAt,
    })
    .from(steamGameRecords)
    .orderBy(steamGameRecords.position)) as SteamGameCacheRow[]
  if (rows.length === 0) return EMPTY
  let lastFetchedAt: string | null = null
  const games: SteamGameRecordView[] = rows.map((row) => {
    const iso = toIso(row.lastFetchedAt)
    if (iso && (!lastFetchedAt || iso > lastFetchedAt)) lastFetchedAt = iso
    return {
      appId: row.appId,
      name: row.name,
      headerImageUrl: row.headerImageUrl ?? null,
      iconUrl: row.iconUrl ?? null,
      playtime2weeksMin: row.playtime2weeksMin,
      playtimeForeverMin: row.playtimeForeverMin,
    }
  })
  return { games, lastFetchedAt }
}

async function fetchRecentlyPlayed(steamId: string, apiKey: string): Promise<ParsedSteamGame[]> {
  try {
    const url = new URL(
      'https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/',
    )
    url.searchParams.set('key', apiKey)
    url.searchParams.set('steamid', steamId)
    url.searchParams.set('count', String(MAX_GAMES))
    const response = await fetch(url.toString(), { cache: 'no-store' })
    if (!response.ok) return []
    const json = await response.json()
    return parseRecentlyPlayedGames(json)
  } catch (error) {
    console.error('Steam recently-played 拉取失败:', error)
    return []
  }
}

async function persist(games: ParsedSteamGame[]): Promise<void> {
  const top = [...games]
    .sort((a, b) => b.playtime2weeksMin - a.playtime2weeksMin)
    .slice(0, MAX_GAMES)
  const now = sqlTimestamp()
  await db.delete(steamGameRecords)
  if (top.length === 0) return
  await db.insert(steamGameRecords).values(
    top.map((game, index) => ({
      appId: game.appId,
      name: game.name,
      headerImageUrl: game.headerImageUrl,
      iconUrl: game.iconUrl,
      playtime2weeksMin: game.playtime2weeksMin,
      playtimeForeverMin: game.playtimeForeverMin,
      position: index,
      lastFetchedAt: now,
      updatedAt: now,
    })),
  )
}

function toIso(value: unknown): string | null {
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string' && value.trim()) {
    const t = Date.parse(value)
    return Number.isFinite(t) ? new Date(t).toISOString() : null
  }
  return null
}
