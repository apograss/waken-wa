/**
 * Demo content for the lower sections — used when there's no real data
 * (no Reporter installed, no inspiration entries yet).
 * Shows what the page looks like in a "fully filled" state.
 */

export function DemoNowSection() {
  return (
    <div className="now-grid">
      {/* LEFT COLUMN — activity feed (1.5fr) */}
      <div className="now-col now-col-main">
        {/* 设备 */}
        <div className="now-block">
          <div className="now-eyebrow">设备 · device</div>
          <div className="now-device">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="now-device-icon">
              <rect x="2" y="4" width="20" height="14" rx="2" />
              <path d="M2 20h20" />
            </svg>
            <div className="now-device-text">
              <span className="now-device-name">apo&apos;s MacBook Pro 14&Prime;</span>
              <span className="now-device-meta">macOS 15.2 · Apple M3 Pro</span>
            </div>
            <div className="now-device-battery">
              <div className="now-battery-shell">
                <div className="now-battery-fill" style={{ width: '84%' }}></div>
              </div>
              <span className="now-battery-text">⚡ 84%</span>
            </div>
          </div>
        </div>

        <div className="now-divider"></div>

        {/* 正在做 */}
        <div className="now-block">
          <div className="now-eyebrow">正在做 · doing</div>
          <div className="now-doing">
            <div className="now-doing-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
            </div>
            <div className="now-doing-text">
              <div className="now-doing-title">论文 — chapter 3.docx</div>
              <div className="now-doing-app">Microsoft Word · 已打开 2 小时 27 分</div>
            </div>
          </div>
        </div>

        <div className="now-divider"></div>

        {/* 正在听 */}
        <div className="now-block">
          <div className="now-eyebrow">正在听 · listening</div>
          <div className="now-listen">
            <div className="now-cover">
              <span>♪</span>
            </div>
            <div className="now-listen-info">
              <div className="now-listen-title">大鱼</div>
              <div className="now-listen-artist">周深 · 《大鱼海棠》印象曲</div>
              <div className="now-listen-track">
                <div className="now-listen-fill" style={{ width: '49%' }}></div>
              </div>
              <div className="now-listen-state">
                <span className="now-listen-playing"><span className="now-listen-dot"></span>正在播放</span>
                <span className="now-listen-time">2:47 / 5:38</span>
              </div>
              <div className="now-listen-source">
                <span className="now-listen-source-icon">M</span>
                来自 Apple Music · iPhone 16 Pro
              </div>
            </div>
          </div>
        </div>

        <div className="now-divider"></div>

        {/* 在玩 */}
        <div className="now-block">
          <div className="now-eyebrow">在玩 · gaming</div>
          <div className="now-game">
            <div className="now-game-cover"></div>
            <div className="now-game-info">
              <div className="now-game-title">Hades II</div>
              <div className="now-game-meta">Supergiant Games · Steam</div>
            </div>
            <div className="now-game-state">
              <span className="now-game-status">挂机中</span>
              <span className="now-game-duration">2h 14m</span>
            </div>
          </div>
        </div>

        {/* footer timestamps */}
        <div className="now-foot">
          <div>
            <span className="now-foot-lab">started at</span>
            <span className="now-foot-val">{getTimeOffset(-2.5)}</span>
          </div>
          <div className="now-foot-live">
            <span className="now-foot-dot"></span>
            <span className="now-foot-lab">last report</span>
            <span className="now-foot-val">{getTimeOffset(-0.005)}</span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN — schedule (1fr, sticky-ish) */}
      <div className="now-col now-col-side">
        <div className="now-schedule">
          <div className="now-schedule-eyebrow">下一节课 · next class</div>
          <div className="now-schedule-time">
            14:00<span className="now-schedule-dash"> – </span>15:30
          </div>
          <div className="now-schedule-name">操作系统</div>

          <div className="now-schedule-meta">
            <div className="now-schedule-row">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <b>教三 309</b>
            </div>
            <div className="now-schedule-row">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>张老师</span>
              <span className="now-schedule-duration">90 min</span>
            </div>
          </div>

          <div className="now-schedule-countdown">
            <span className="now-schedule-pulse"></span>
            <span>18 分钟后开始</span>
          </div>

          {/* upcoming peek */}
          <div className="now-schedule-upcoming">
            <div className="now-schedule-upcoming-eyebrow">之后</div>
            <div className="now-schedule-upcoming-row">
              <span className="now-schedule-upcoming-time">15:50</span>
              <span className="now-schedule-upcoming-name">软件工程</span>
              <span className="now-schedule-upcoming-loc">教二 405</span>
            </div>
            <div className="now-schedule-upcoming-row">
              <span className="now-schedule-upcoming-time">19:00</span>
              <span className="now-schedule-upcoming-name">实验室例会</span>
              <span className="now-schedule-upcoming-loc">研发楼 B302</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function getTimeOffset(hoursAgo: number): string {
  const d = new Date()
  d.setHours(d.getHours() + hoursAgo)
  d.setMinutes(d.getMinutes() + Math.floor((hoursAgo % 1) * 60))
  const M = String(d.getMonth() + 1).padStart(2, '0')
  const D = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${M}/${D} ${h}:${m}`
}

export function DemoInspirationList() {
  const items = [
    {
      letter: 'A',
      bg: 'linear-gradient(135deg, color-mix(in srgb, var(--hero-accent) 22%, var(--muted)), color-mix(in srgb, var(--primary) 18%, var(--muted)))',
      title: '写在论文之间的字',
      date: '05·19 · 23:14',
      emoji: '🌧',
      status: '在写论文',
      preview:
        '凌晨三点的图书馆，灯白得像一种警告。我又一次想到那个关于时间的悖论——一切都被时间稀释，所以才需要"现在"。',
    },
    {
      letter: 'Z',
      bg: 'linear-gradient(135deg, #3b4a6b, #1e2a44)',
      title: '一个关于睡眠的 hypothesis',
      date: '05·18 · 21:02',
      emoji: '🌙',
      status: '失眠了',
      preview:
        '也许我们一直在错的时间里醒着。也许 22:00 才是真正的深夜，0:00 已经太晚了；只是我们集体把闹钟拨到了一个不诚实的位置。',
    },
    {
      letter: 'C',
      bg: 'linear-gradient(135deg, #c08854, #7d4a26)',
      title: '在地铁上读 Calvino',
      date: '05·17 · 15:48',
      emoji: '🚇',
      status: '通勤',
      preview:
        '"轻"不是逃避，是另一种诚实。卡尔维诺说这句话的时候是 1985 年——他坐在书桌前，窗外是热那亚的雨，而我在 41 年后的地铁里读到它。',
    },
  ]

  return (
    <ul className="demo-notes-list">
      {items.map((item) => (
        <li key={item.letter} className="demo-note-item">
          <div
            className="demo-note-thumb"
            style={{ background: item.bg, color: 'rgba(255,255,255,0.55)' }}
          >
            {item.letter}
          </div>
          <div className="demo-note-body">
            <div className="demo-note-head">
              <h4 className="demo-note-title">{item.title}</h4>
              <time className="demo-note-date">{item.date}</time>
            </div>
            <span className="demo-note-status">
              <span className="demo-note-emoji">{item.emoji}</span>
              {item.status}
            </span>
            <p className="demo-note-preview">{item.preview}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}
