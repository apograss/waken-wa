/**
 * Pure parsers for Steam Web API game responses (GetRecentlyPlayedGames /
 * GetOwnedGames). No fetch / DB / alias imports — kept unit-testable.
 * Playtimes are minutes, as Steam reports them.
 */

const STEAM_APP_HEADER_CDN = 'https://cdn.cloudflare.steamstatic.com/steam/apps'
const STEAM_APP_ICON_CDN = 'https://media.steampowered.com/steamcommunity/public/images/apps'

export interface ParsedSteamGame {
  appId: string
  name: string
  playtime2weeksMin: number
  playtimeForeverMin: number
  headerImageUrl: string
  iconUrl: string | null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function toNonNegInt(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
}

export function steamAppHeaderImageUrl(appId: string): string {
  return `${STEAM_APP_HEADER_CDN}/${encodeURIComponent(appId)}/header.jpg`
}

function mapSteamGame(raw: unknown): ParsedSteamGame | null {
  const g = asRecord(raw)
  if (!g) return null
  const appId = String(g.appid ?? '').trim()
  const name = String(g.name ?? '').trim()
  if (!appId || !name) return null
  const icon = String(g.img_icon_url ?? '').trim()
  return {
    appId,
    name,
    playtime2weeksMin: toNonNegInt(g.playtime_2weeks),
    playtimeForeverMin: toNonNegInt(g.playtime_forever),
    headerImageUrl: steamAppHeaderImageUrl(appId),
    iconUrl: icon ? `${STEAM_APP_ICON_CDN}/${appId}/${icon}.jpg` : null,
  }
}

/** Parse `IPlayerService/GetRecentlyPlayedGames` → `.response.games`. */
export function parseRecentlyPlayedGames(json: unknown): ParsedSteamGame[] {
  const response = asRecord(asRecord(json)?.response)
  const games = response?.games
  if (!Array.isArray(games)) return []
  const out: ParsedSteamGame[] = []
  for (const raw of games) {
    const game = mapSteamGame(raw)
    if (game) out.push(game)
  }
  return out
}
