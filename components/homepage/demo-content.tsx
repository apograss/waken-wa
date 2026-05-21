/**
 * Demo content for the lower sections — used when there's no real data
 * (no Reporter installed, no inspiration entries yet).
 * Shows what the page looks like in a "fully filled" state.
 *
 * To disable demo content (use real waken-wa data only), set:
 *   showDemoContent={false}
 */

import { ScheduleHomeInClassBanner } from '@/components/schedule-home-in-class-banner'

export function DemoCurrentStatus() {
  return (
    <div className="demo-now space-y-3">
      {/* Demo schedule banner */}
      <div className="demo-schedule">
        <div className="demo-schedule-eyebrow">下一节课</div>
        <div className="demo-schedule-time">14:00 <span className="demo-schedule-dash">–</span> 15:30</div>
        <div className="demo-schedule-name">操作系统</div>
        <div className="demo-schedule-meta">
          <span className="demo-schedule-row">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <b>教三 309</b>
          </span>
          <span className="demo-schedule-row">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>张老师</span>
          </span>
          <span className="demo-schedule-row" style={{ marginLeft: 'auto' }}>
            <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: 'var(--muted-foreground)' }}>90 min</span>
          </span>
        </div>
        <div className="demo-schedule-countdown">
          <span className="demo-schedule-dot"></span>
          18 分钟后开始
        </div>
      </div>

      {/* Device chip */}
      <div className="demo-sub">
        <div className="demo-device-label">设备</div>
        <div className="demo-device-row">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}>
            <rect x="2" y="4" width="20" height="14" rx="2" />
            <path d="M2 20h20" />
          </svg>
          <span className="demo-device-name">apo&apos;s MacBook Pro 14&Prime;</span>
          <span className="demo-device-battery">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="18" height="10" rx="2" />
              <path d="M22 11v2" />
              <rect x="4" y="9" width="13" height="6" rx="1" fill="var(--hero-accent)" stroke="none" />
            </svg>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--hero-accent)" stroke="none" style={{ marginLeft: -3 }}>
              <path d="M13 2L4 14h7l-2 8 9-12h-7l2-8z" />
            </svg>
            84%
          </span>
        </div>
      </div>

      {/* Status line */}
      <div className="demo-status-line">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted-foreground)' }}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18" /><path d="M9 21V9" />
        </svg>
        <span className="demo-status-title">论文 — chapter 3.docx</span>
        <span className="demo-status-sep">|</span>
        <span className="demo-status-app">Microsoft Word</span>
      </div>

      {/* Media block */}
      <div className="demo-media">
        <div className="demo-media-cover">♪</div>
        <div className="demo-media-info">
          <div className="demo-media-title">大鱼</div>
          <div className="demo-media-artist">周深 · 《大鱼海棠》印象曲</div>
          <div className="demo-media-state">
            <span className="demo-media-playing"><span className="demo-media-dot"></span>正在播放</span>
            <span className="demo-media-time">2:47 / 5:38</span>
          </div>
          <div className="demo-media-track"><div className="demo-media-fill" style={{ width: '49%' }}></div></div>
          <div className="demo-media-source">
            <span className="demo-media-source-icon">M</span>
            <span>来自 Apple Music · iPhone 16 Pro</span>
          </div>
        </div>
      </div>

      {/* Steam */}
      <div className="demo-steam">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted-foreground)' }}>
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <circle cx="8" cy="12" r="1.5" /><circle cx="16" cy="12" r="1.5" />
          <path d="M6 9h2M16 9h2" />
        </svg>
        <div className="demo-steam-thumb">STEAM</div>
        <span className="demo-steam-name">Hades II</span>
        <span className="demo-steam-meta">挂机中</span>
      </div>

      {/* Time row */}
      <div className="demo-time-row">
        <div>
          <span className="demo-time-lab">started at</span>
          <span className="demo-time-val">{getTodayTimeString(-2.5)}</span>
        </div>
        <div>
          <span className="demo-time-lab">last report</span>
          <span className="demo-time-val">{getTodayTimeString(-0.005)}</span>
        </div>
      </div>
    </div>
  )

  // Suppress unused warning — ScheduleHomeInClassBanner is imported just to keep
  // the dependency graph honest if the user later swaps demo for real data.
  void ScheduleHomeInClassBanner
}

function getTodayTimeString(hoursAgo: number): string {
  const d = new Date()
  d.setHours(d.getHours() + hoursAgo)
  d.setMinutes(d.getMinutes() + Math.floor((hoursAgo % 1) * 60))
  const M = String(d.getMonth() + 1).padStart(2, '0')
  const D = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  return `${M}/${D} ${h}:${m}:${s}`
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
