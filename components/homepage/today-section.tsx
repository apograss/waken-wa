/**
 * TodaySection — server-rendered "今日" block under 此刻.
 *
 * Pure presentation: today's rollup + Steam records arrive as props from the
 * server (SSR). No client JS; tooltips use the native `title` attribute.
 */

import type { TodaySummary } from '@/lib/activity-daily'
import type { SteamGamesResult } from '@/lib/steam-games'

export interface TodaySectionProps {
  today: TodaySummary
  steam: SteamGamesResult
}

const SLOT_SECONDS = 30 * 60

/** Seconds → "2h 14m" / "45m" / "—". */
function formatSeconds(seconds: number): string {
  return formatMinutes(Math.round(seconds / 60))
}

/** Minutes → "2h 14m" / "45m" / "—". */
function formatMinutes(minutes: number): string {
  if (minutes <= 0) return '—'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest > 0 ? `${hours}h ${rest}m` : `${hours}h`
}

/** Half-hour slot index (0..47) → "HH:MM". */
function slotLabel(slot: number): string {
  const hour = Math.floor(slot / 2)
  const minute = slot % 2 === 0 ? '00' : '30'
  return `${String(hour).padStart(2, '0')}:${minute}`
}

export function TodaySection({ today, steam }: TodaySectionProps) {
  const hasActivity = today.activeSeconds > 0 || today.topApps.length > 0
  const hasGames = steam.games.length > 0
  if (!hasActivity && !hasGames) return null

  return (
    <div className="today">
      <div className="today-head">
        <span className="now-eyebrow">今日 · today</span>
        <span className="today-date">{today.date}</span>
      </div>

      {hasActivity && (
        <>
          <div className="today-stats">
            <TodayStat label="活跃" value={formatSeconds(today.activeSeconds)} />
            {today.listenSeconds > 0 && (
              <TodayStat label="听" value={formatSeconds(today.listenSeconds)} />
            )}
            {today.watchSeconds > 0 && (
              <TodayStat label="看" value={formatSeconds(today.watchSeconds)} />
            )}
            <TodayStat label="应用" value={String(today.distinctApps)} unit="个" />
          </div>

          {today.topApps.length > 0 && (
            <div className="today-apps">
              {today.topApps.map((app) => (
                <div key={app.processName} className="today-app">
                  <span className="today-app-name">{app.displayName}</span>
                  <span className="today-app-bar">
                    <span className="today-app-fill" style={{ width: `${app.percent}%` }} />
                  </span>
                  <span className="today-app-time">{formatSeconds(app.activeSeconds)}</span>
                </div>
              ))}
            </div>
          )}

          <TodayTimeline timeline={today.timeline} />
        </>
      )}

      {hasGames && <TodaySteam steam={steam} />}
    </div>
  )
}

function TodayStat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="today-stat">
      <span className="today-stat-value">
        {value}
        {unit && <span className="today-stat-unit">{unit}</span>}
      </span>
      <span className="today-stat-label">{label}</span>
    </div>
  )
}

function TodayTimeline({ timeline }: { timeline: TodaySummary['timeline'] }) {
  return (
    <div className="today-timeline">
      <div className="today-tl-track">
        {timeline.map((slot) => {
          const active = slot.activeSeconds > 0
          const intensity = Math.min(1, slot.activeSeconds / SLOT_SECONDS)
          return (
            <span
              key={slot.slot}
              className={`today-tl-slot${active ? ' is-active' : ''}`}
              style={active ? { opacity: 0.28 + 0.72 * intensity } : undefined}
              title={
                active && slot.displayName
                  ? `${slotLabel(slot.slot)} · ${slot.displayName}`
                  : slotLabel(slot.slot)
              }
            />
          )
        })}
      </div>
      <div className="today-tl-axis">
        <span>0</span>
        <span>6</span>
        <span>12</span>
        <span>18</span>
        <span>24</span>
      </div>
    </div>
  )
}

function TodaySteam({ steam }: { steam: SteamGamesResult }) {
  const games = steam.games
  const total2w = games.reduce((sum, g) => sum + g.playtime2weeksMin, 0)
  const totalForever = games.reduce((sum, g) => sum + g.playtimeForeverMin, 0)
  const max2w = Math.max(1, ...games.map((g) => g.playtime2weeksMin))
  return (
    <div className="today-steam">
      <div className="today-steam-head">
        <span className="now-eyebrow">Steam · recently played</span>
        <span className="today-steam-summary">
          {games.length} 款 · 近两周 {formatMinutes(total2w)} · 累计 {formatMinutes(totalForever)}
        </span>
      </div>
      <div className="today-games">
        {games.map((game) => (
          <a
            key={game.appId}
            className="today-game"
            href={`https://store.steampowered.com/app/${game.appId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span
              className="today-game-cover"
              style={
                game.headerImageUrl ? { backgroundImage: `url(${game.headerImageUrl})` } : undefined
              }
            />
            <span className="today-game-body">
              <span className="today-game-name">{game.name}</span>
              {game.playtime2weeksMin > 0 && (
                <span
                  className="today-game-bar"
                  title={`近两周 ${formatMinutes(game.playtime2weeksMin)}`}
                >
                  <span
                    className="today-game-bar-fill"
                    style={{ width: `${Math.max(6, (game.playtime2weeksMin / max2w) * 100)}%` }}
                  />
                </span>
              )}
              <span className="today-game-times">
                <span className="today-game-2w">近两周 {formatMinutes(game.playtime2weeksMin)}</span>
                <span className="today-game-total">累计 {formatMinutes(game.playtimeForeverMin)}</span>
              </span>
            </span>
          </a>
        ))}
      </div>
    </div>
  )
}
