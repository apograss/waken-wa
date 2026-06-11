import { describe, expect, it } from 'vitest'

import { parseRecentlyPlayedGames } from './steam-games-parse'

describe('parseRecentlyPlayedGames', () => {
  it('extracts games with playtimes (minutes) and image urls', () => {
    const json = {
      response: {
        total_count: 1,
        games: [
          {
            appid: 1145360,
            name: 'Hades II',
            playtime_2weeks: 360,
            playtime_forever: 1200,
            img_icon_url: 'abc123',
          },
        ],
      },
    }
    const out = parseRecentlyPlayedGames(json)
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({
      appId: '1145360',
      name: 'Hades II',
      playtime2weeksMin: 360,
      playtimeForeverMin: 1200,
    })
    expect(out[0].headerImageUrl).toContain('1145360')
    expect(out[0].iconUrl).toContain('abc123')
  })

  it('returns [] when response/games are missing or malformed', () => {
    expect(parseRecentlyPlayedGames(null)).toEqual([])
    expect(parseRecentlyPlayedGames({})).toEqual([])
    expect(parseRecentlyPlayedGames({ response: {} })).toEqual([])
    expect(parseRecentlyPlayedGames({ response: { games: 'nope' } })).toEqual([])
  })

  it('skips entries without appid or name', () => {
    const json = {
      response: { games: [{ name: 'no id' }, { appid: 5 }, { appid: 7, name: 'ok' }] },
    }
    const out = parseRecentlyPlayedGames(json)
    expect(out).toHaveLength(1)
    expect(out[0].appId).toBe('7')
  })

  it('defaults missing playtimes to 0 and missing icon to null', () => {
    const json = { response: { games: [{ appid: 9, name: 'No Playtime' }] } }
    const out = parseRecentlyPlayedGames(json)
    expect(out[0].playtime2weeksMin).toBe(0)
    expect(out[0].playtimeForeverMin).toBe(0)
    expect(out[0].iconUrl).toBeNull()
  })
})
