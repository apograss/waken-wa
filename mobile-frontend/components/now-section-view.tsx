/**
 * NowSectionView — 纯展示组件，描述「02 此刻」的完整布局
 *
 * 这是 demo 模式（DemoNowSection）和真实模式（LiveNowSection）共用的视觉骨架。
 * 数据全部从 props 来，**不**自己拉数据、**不**含业务逻辑。
 */

import type { ReactNode } from 'react'

export type NowDeviceIcon = 'laptop' | 'phone' | 'tablet'

export interface NowDeviceItem {
  /** 唯一 key（设备 ID 或 hash） */
  key: string
  icon: NowDeviceIcon
  /** 「apo's MacBook Pro 14″」 */
  name: string
  /** 「macOS · M3 Pro」「iPhone · iOS 18.4」「12:34 最后活跃」 */
  meta: string
  /** 0–100；null 表示设备没上报电量 */
  battery: number | null
  charging?: boolean
  /** 是否在线 / 当前活跃；离线设备显示为灰色 */
  active: boolean
}

export interface NowDoingItem {
  /** 大标题，例如「论文 — chapter 3.docx」 */
  title: string
  /** 副标题，例如「Microsoft Word · 已打开 2 小时 27 分」 */
  app: string
}

export interface NowHistoryItem {
  /** 「14:32」 */
  time: string
  /** 应用名「Visual Studio Code」 */
  app: string
  /** 文件 / 标题「homepage.css」 */
  title: string
}

export interface NowListenItem {
  title: string
  artist: string | null
  /** 0–100；null 时不显示进度 */
  progressPercent: number | null
  /** 「2:47 / 5:38」 */
  positionLabel: string | null
  state: 'playing' | 'paused' | 'stopped' | null
  /** 来源行：「来自 Apple Music · iPhone 16 Pro」 */
  sourceLine: string | null
  coverUrl: string | null
  /** 区块眉标；浏览器里放视频时是「正在看 · watching」，默认「正在听 · listening」 */
  eyebrow?: string
}

export interface NowGameItem {
  /** 「STEAM」 */
  platform: string
  /** 「Hades II」 */
  title: string
  /** 「Supergiant Games」 */
  author: string | null
  imageUrl: string | null
  /** 三个统计字段，每个 [label, value]；例如 [['本次时长','2h 14m'], ...] */
  stats: Array<{ label: string; value: string }>
  /** 「挂机中 · Erebus 区」 */
  statusLabel: string | null
}

export interface NowFooterTimes {
  /** 「05/27 14:00」 */
  startedAt: string | null
  /** 「05/27 14:46」 */
  lastReportAt: string | null
}

export interface NowSectionViewProps {
  /** 多设备列表；可空数组 */
  devices: NowDeviceItem[]
  /** 当前正在做（process_title / process_name 派生） */
  doing: NowDoingItem | null
  /** 过去 4 小时历史 */
  history: NowHistoryItem[]
  /** 正在听 */
  listen: NowListenItem | null
  /** 游戏卡（Steam now playing） */
  game: NowGameItem | null
  /** 课程区块（节点已经由调用方决定要不要传） */
  scheduleSlot?: ReactNode
  /** footer 时间戳 */
  footer: NowFooterTimes | null
}

/**
 * 渲染 02 此刻区块的完整内容。会自动在右栏没有内容（无游戏 + 无课程）时退化为单栏布局。
 */
export function NowSectionView(props: NowSectionViewProps) {
  const hasSide = !!props.game || !!props.scheduleSlot
  return (
    <div className={`now-grid${hasSide ? '' : ' now-grid-single'}`}>
      {/* LEFT COLUMN — activity feed (1.5fr) */}
      <div className="now-col now-col-main">
        {/* 设备 */}
        <div className="now-block">
          <div className="now-eyebrow">设备 · devices</div>
          <div className="now-devices">
            {props.devices.length === 0 ? (
              <div className="now-empty">还没有设备上报，去 admin · 设备管理 添加</div>
            ) : (
              props.devices.map(d => (
                <DeviceRow
                  key={d.key}
                  icon={d.icon}
                  name={d.name}
                  meta={d.meta}
                  battery={d.battery}
                  charging={d.charging}
                  active={d.active}
                />
              ))
            )}
          </div>
        </div>

        <div className="now-divider"></div>

        {/* 正在做 + 过去做的（hover 展开） */}
        <div className="now-block">
          <div className="now-eyebrow">正在做 · doing</div>
          {props.doing ? (
            <div className="now-doing">
              <div className="now-doing-icon">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18M9 21V9" />
                </svg>
              </div>
              <div className="now-doing-text">
                <div className="now-doing-title">{props.doing.title}</div>
                <div className="now-doing-app">{props.doing.app}</div>
              </div>
            </div>
          ) : (
            <div className="now-empty">暂时空闲</div>
          )}

          {props.history.length > 0 && (
            <div className="now-history-wrap">
              <button
                type="button"
                className="now-history-toggle"
                aria-label="查看历史活动"
              >
                <span>过去 4 小时</span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="now-history-chevron"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              <div className="now-history">
                {props.history.map((h, i) => (
                  <div key={i} className="now-history-item">
                    <span className="now-history-time">{h.time}</span>
                    <span className="now-history-app">{h.app}</span>
                    <span className="now-history-title">{h.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 正在听 */}
        {props.listen && (
          <>
            <div className="now-divider"></div>
            <div className="now-block">
              <div className="now-eyebrow">{props.listen.eyebrow ?? '正在听 · listening'}</div>
              <div className="now-listen">
                <div className="now-cover">
                  {props.listen.coverUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={props.listen.coverUrl}
                      alt=""
                      loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span>♪</span>
                  )}
                </div>
                <div className="now-listen-info">
                  <div className="now-listen-title">{props.listen.title}</div>
                  {props.listen.artist && (
                    <div className="now-listen-artist">{props.listen.artist}</div>
                  )}
                  {props.listen.progressPercent !== null && (
                    <div className="now-listen-track">
                      <div
                        className="now-listen-fill"
                        style={{ width: `${props.listen.progressPercent}%` }}
                      ></div>
                    </div>
                  )}
                  <div className="now-listen-state">
                    {props.listen.state === 'playing' ? (
                      <span className="now-listen-playing">
                        <span className="now-listen-dot"></span>正在播放
                      </span>
                    ) : props.listen.state === 'paused' ? (
                      <span className="now-listen-playing">
                        <span
                          className="now-listen-dot"
                          style={{ background: 'var(--muted-foreground)' }}
                        ></span>
                        已暂停
                      </span>
                    ) : null}
                    {props.listen.positionLabel && (
                      <span className="now-listen-time">{props.listen.positionLabel}</span>
                    )}
                  </div>
                  {props.listen.sourceLine && (
                    <div className="now-listen-source">{props.listen.sourceLine}</div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* footer timestamps */}
        {props.footer && (props.footer.startedAt || props.footer.lastReportAt) && (
          <div className="now-foot">
            {props.footer.startedAt && (
              <div>
                <span className="now-foot-lab">started at</span>
                <span className="now-foot-val">{props.footer.startedAt}</span>
              </div>
            )}
            {props.footer.lastReportAt && (
              <div className="now-foot-live">
                <span className="now-foot-dot"></span>
                <span className="now-foot-lab">last report</span>
                <span className="now-foot-val">{props.footer.lastReportAt}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT COLUMN — 仅当有内容时渲染 */}
      {hasSide && (
        <div className="now-col now-col-side">
          {props.game && <GameFeatureCard game={props.game} />}
          {props.scheduleSlot && <div className="now-schedule-slot">{props.scheduleSlot}</div>}
        </div>
      )}
    </div>
  )
}

/* ---------- 子组件：设备行 ---------- */

interface DeviceRowProps {
  icon: NowDeviceIcon
  name: string
  meta: string
  battery: number | null
  charging?: boolean
  active: boolean
}

function DeviceRow({ icon, name, meta, battery, charging, active }: DeviceRowProps) {
  const iconSvg = {
    laptop: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="4" width="20" height="14" rx="2" />
        <path d="M2 20h20" />
      </svg>
    ),
    phone: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="6" y="2" width="12" height="20" rx="3" />
        <path d="M11 18h2" />
      </svg>
    ),
    tablet: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <path d="M11 19h2" />
      </svg>
    ),
  }[icon]

  return (
    <div className={`now-device ${active ? 'now-device-active' : 'now-device-idle'}`}>
      <span className="now-device-icon">{iconSvg}</span>
      <div className="now-device-text">
        <span className="now-device-name">{name}</span>
        <span className="now-device-meta">{meta}</span>
      </div>
      {battery !== null && (
        <div className="now-device-battery">
          <div className="now-battery-shell">
            <div className="now-battery-fill" style={{ width: `${battery}%` }}></div>
          </div>
          <span className="now-battery-text">
            {charging && <span className="now-battery-charging">⚡</span>}
            {battery}%
          </span>
        </div>
      )}
    </div>
  )
}

/* ---------- 子组件：大游戏 feature card ---------- */

function GameFeatureCard({ game }: { game: NowGameItem }) {
  return (
    <div className="now-game-feature">
      <div className="now-game-cover-large">
        <div
          className="now-game-cover-bg"
          style={
            game.imageUrl
              ? {
                  backgroundImage: `url(${game.imageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : undefined
          }
        ></div>
        <div className="now-game-cover-content">
          <div className="now-game-platform">{game.platform}</div>
          <div className="now-game-cover-title">{game.title}</div>
          {game.author && <div className="now-game-cover-author">{game.author}</div>}
        </div>
      </div>
      {game.stats.length > 0 && (
        <div className="now-game-stats">
          {game.stats.map((s, i) => (
            <div key={i} className="now-game-stat">
              <span className="now-game-stat-lab">{s.label}</span>
              <span className="now-game-stat-val">{s.value}</span>
            </div>
          ))}
        </div>
      )}
      {game.statusLabel && (
        <div className="now-game-status-row">
          <span className="now-game-status-pulse"></span>
          <span>{game.statusLabel}</span>
        </div>
      )}
    </div>
  )
}
