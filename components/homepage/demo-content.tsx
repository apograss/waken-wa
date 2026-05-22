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
        {/* 设备 — multi-device */}
        <div className="now-block">
          <div className="now-eyebrow">设备 · devices</div>
          <div className="now-devices">
            <DemoDeviceRow
              icon="laptop"
              name="apo's MacBook Pro 14″"
              meta="macOS 15.2 · Apple M3 Pro"
              battery={84}
              charging
              active
            />
            <DemoDeviceRow
              icon="phone"
              name="iPhone 16 Pro"
              meta="iOS 18.4 · 微信 / Apple Music"
              battery={62}
              active
            />
            <DemoDeviceRow
              icon="tablet"
              name="iPad Air"
              meta="iPadOS 18.2 · 离线 · 12:34 最后活跃"
              battery={28}
              active={false}
            />
          </div>
        </div>

        <div className="now-divider"></div>

        {/* 正在做 + 过去做的（hover 展开） */}
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

          <div className="now-history-wrap">
            <button type="button" className="now-history-toggle" aria-label="查看历史活动">
              <span>过去 4 小时</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="now-history-chevron">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div className="now-history">
              <div className="now-history-item">
                <span className="now-history-time">14:32</span>
                <span className="now-history-app">Visual Studio Code</span>
                <span className="now-history-title">homepage.css</span>
              </div>
              <div className="now-history-item">
                <span className="now-history-time">13:18</span>
                <span className="now-history-app">Chrome</span>
                <span className="now-history-title">github.com/apograss</span>
              </div>
              <div className="now-history-item">
                <span className="now-history-time">12:05</span>
                <span className="now-history-app">Terminal</span>
                <span className="now-history-title">pnpm dev</span>
              </div>
              <div className="now-history-item">
                <span className="now-history-time">11:40</span>
                <span className="now-history-app">Spotify</span>
                <span className="now-history-title">Lo-fi for studying</span>
              </div>
              <div className="now-history-item">
                <span className="now-history-time">10:22</span>
                <span className="now-history-app">Notion</span>
                <span className="now-history-title">论文 outline v3</span>
              </div>
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

      {/* RIGHT COLUMN — game (large) + schedule */}
      <div className="now-col now-col-side">
        {/* 在玩 — featured large game card */}
        <div className="now-game-feature">
          <div className="now-game-cover-large">
            <div className="now-game-cover-bg"></div>
            <div className="now-game-cover-content">
              <div className="now-game-platform">STEAM</div>
              <div className="now-game-cover-title">Hades II</div>
              <div className="now-game-cover-author">Supergiant Games</div>
            </div>
          </div>
          <div className="now-game-stats">
            <div className="now-game-stat">
              <span className="now-game-stat-lab">本次时长</span>
              <span className="now-game-stat-val">2h 14m</span>
            </div>
            <div className="now-game-stat">
              <span className="now-game-stat-lab">总时长</span>
              <span className="now-game-stat-val">47h</span>
            </div>
            <div className="now-game-stat">
              <span className="now-game-stat-lab">进度</span>
              <span className="now-game-stat-val">68%</span>
            </div>
          </div>
          <div className="now-game-status-row">
            <span className="now-game-status-pulse"></span>
            <span>挂机中 · Erebus 区</span>
          </div>
        </div>

        {/* 课程 */}
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

interface DemoDeviceRowProps {
  icon: 'laptop' | 'phone' | 'tablet'
  name: string
  meta: string
  battery: number
  charging?: boolean
  active: boolean
}

function DemoDeviceRow({ icon, name, meta, battery, charging, active }: DemoDeviceRowProps) {
  const iconSvg = {
    laptop: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="14" rx="2" />
        <path d="M2 20h20" />
      </svg>
    ),
    phone: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="2" width="12" height="20" rx="3" />
        <path d="M11 18h2" />
      </svg>
    ),
    tablet: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
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
      <div className="now-device-battery">
        <div className="now-battery-shell">
          <div className="now-battery-fill" style={{ width: `${battery}%` }}></div>
        </div>
        <span className="now-battery-text">
          {charging && <span className="now-battery-charging">⚡</span>}
          {battery}%
        </span>
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

export function DemoInspirationStage() {
  const items = [
    {
      n: '01',
      date: '05·19 · 23:14',
      title: '写在论文之间的字',
      emoji: '🌧',
      mood: '在写论文',
      preview:
        '凌晨三点的图书馆，灯白得像一种警告。我又一次想到那个关于时间的悖论——一切都被时间稀释，所以才需要"现在"。',
    },
    {
      n: '02',
      date: '05·18 · 21:02',
      title: '一个关于睡眠的 hypothesis',
      emoji: '🌙',
      mood: '失眠了',
      preview:
        '也许我们一直在错的时间里醒着。也许 22:00 才是真正的深夜，0:00 已经太晚了；只是我们集体把闹钟拨到了一个不诚实的位置。',
    },
    {
      n: '03',
      date: '05·17 · 15:48',
      title: '在地铁上读 Calvino',
      emoji: '🚇',
      mood: '通勤',
      preview:
        '"轻"不是逃避，是另一种诚实。卡尔维诺说这句话的时候是 1985 年——他坐在书桌前，窗外是热那亚的雨，而我在 41 年后的地铁里读到它。',
    },
  ]

  return (
    <>
      <div className="ins-stage">
        <img
          src="/assets/homepage/section-inspiration-companion.png"
          alt=""
          loading="lazy"
        />
        <div className="papers">
          {items.map((item, i) => (
            <a key={item.n} className={`paper paper-${i + 1}`} href="#">
              <span className="paper-pin"></span>
              <div className="paper-head">
                <span className="paper-date">{item.date}</span>
                <span className="paper-num">N°{item.n}</span>
              </div>
              <h4 className="paper-title">{item.title}</h4>
              <p className="paper-preview">{item.preview}</p>
              <div className="paper-foot">
                <span className="paper-mood">
                  <span className="paper-emoji">{item.emoji}</span>
                  {item.mood}
                </span>
                <span className="paper-more">read →</span>
              </div>
            </a>
          ))}
        </div>
      </div>

      <div className="ins-more-row">
        <div className="ins-more-left">
          <span className="ins-more-bar"></span>
          <span>3 / 15 — 最近三篇</span>
        </div>
        <a className="ins-more-link" href="/inspiration">
          查看全部 15 篇 →
        </a>
      </div>
    </>
  )
}


interface DemoAboutSectionProps {
  userName: string
  userBio?: string | null
  avatarSrc?: string | null
}

export function DemoAboutSection({ userName, userBio, avatarSrc }: DemoAboutSectionProps) {
  const name = userName || 'apograss'
  const bio = userBio || '在写论文 / 听周深 / 偶尔失眠 · CS @ 北邮'
  const initial = name.charAt(0).toLowerCase()

  return (
    <>
      <div className="about-grid">
        {/* LEFT — identity card (avatar + name + status + facts) */}
        <div className="about-left">
          <div className="about-avatar-wrap">
            {avatarSrc ? (
              <img src={avatarSrc} alt={name} className="about-avatar-img" />
            ) : (
              <div className="about-avatar-fallback">{initial}</div>
            )}
            <span className="about-online-dot" title="在线"></span>
          </div>

          <div className="about-identity">
            <h3 className="about-name">{name}</h3>
            <span className="about-domain">apograss.cn</span>
          </div>

          <p className="about-bio">{bio}</p>

          <div className="about-status">
            <span className="about-status-emoji">🌧</span>
            <span className="about-status-text">在写论文</span>
            <span className="about-status-busy">busy</span>
            <span className="about-status-expire">至 13:42</span>
          </div>

          <div className="about-meta">
            <span className="about-meta-row">
              <span className="about-meta-lab">CITY</span>
              <span className="about-meta-val">深圳 · 福田</span>
            </span>
            <span className="about-meta-row">
              <span className="about-meta-lab">EMAIL</span>
              <span className="about-meta-val">apograss@example.com</span>
            </span>
            <span className="about-meta-row">
              <span className="about-meta-lab">GITHUB</span>
              <span className="about-meta-val">github.com/apograss</span>
            </span>
            <span className="about-meta-row">
              <span className="about-meta-lab">UPTIME</span>
              <span className="about-meta-val">823 days online</span>
            </span>
          </div>
        </div>

        {/* RIGHT — large editorial figure */}
        <figure className="about-figure" aria-hidden="true">
          <span className="about-figure-label">
            <span className="about-figure-dot"></span>
            profile · 2026 spring
          </span>
          <img
            src="/assets/homepage/section-about-companion.png"
            alt=""
            loading="lazy"
            className="about-figure-img"
          />
          <figcaption className="about-figure-caption">
            <span className="about-figure-caption-name">{name}</span>
            <span className="about-figure-caption-meta">2026 · 春</span>
          </figcaption>
        </figure>
      </div>

      {/* Pull-quote signature spans full width below the grid */}
      <div className="about-signature">
        <p className="about-signature-text">
          所谓自由，是能在下雨的星期天，一个人写完一段不被催促的字。
        </p>
        <div className="about-signature-src">
          <span>— hitokoto · 子集</span>
        </div>
      </div>
    </>
  )
}
