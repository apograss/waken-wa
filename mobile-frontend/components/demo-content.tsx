/**
 * Demo content for the lower sections — used when there's no real data
 * (no Reporter installed, no inspiration entries yet).
 * Shows what the page looks like in a "fully filled" state.
 */

import type { AboutProfileFields } from '@/lib/about-profile'
import { formatDisplayPattern } from '@/lib/timezone'
import { isTodayStatusActive } from '@/lib/today-status'

import {
  type InspirationPaperItem,
  InspirationStageView,
} from './inspiration-stage-view'
import { NowSectionView } from './now-section-view'

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

export function DemoNowSection() {
  return (
    <NowSectionView
      devices={[
        {
          key: 'demo-mac',
          icon: 'laptop',
          name: "apo's MacBook Pro 14″",
          meta: 'macOS 15.2 · Apple M3 Pro',
          battery: 84,
          charging: true,
          active: true,
        },
        {
          key: 'demo-iphone',
          icon: 'phone',
          name: 'iPhone 16 Pro',
          meta: 'iOS 18.4 · 微信 / Apple Music',
          battery: 62,
          active: true,
        },
        {
          key: 'demo-ipad',
          icon: 'tablet',
          name: 'iPad Air',
          meta: 'iPadOS 18.2 · 离线 · 12:34 最后活跃',
          battery: 28,
          active: false,
        },
      ]}
      doing={{
        title: '论文 — chapter 3.docx',
        app: 'Microsoft Word · 已打开 2 小时 27 分',
      }}
      history={[
        { time: '14:32', app: 'Visual Studio Code', title: 'homepage.css' },
        { time: '13:18', app: 'Chrome', title: 'github.com/apograss' },
        { time: '12:05', app: 'Terminal', title: 'pnpm dev' },
        { time: '11:40', app: 'Spotify', title: 'Lo-fi for studying' },
        { time: '10:22', app: 'Notion', title: '论文 outline v3' },
      ]}
      listen={{
        title: '大鱼',
        artist: '周深 · 《大鱼海棠》印象曲',
        progressPercent: 49,
        positionLabel: '2:47 / 5:38',
        state: 'playing',
        sourceLine: '来自 Apple Music · iPhone 16 Pro',
        coverUrl: null,
      }}
      game={{
        platform: 'STEAM',
        title: 'Hades II',
        author: 'Supergiant Games',
        imageUrl: null,
        stats: [
          { label: '本次时长', value: '2h 14m' },
          { label: '总时长', value: '47h' },
          { label: '进度', value: '68%' },
        ],
        statusLabel: '挂机中 · Erebus 区',
      }}
      scheduleSlot={
        <div className="now-schedule">
          <div className="now-schedule-eyebrow">下一节课 · next class</div>
          <div className="now-schedule-time">
            14:00<span className="now-schedule-dash"> – </span>15:30
          </div>
          <div className="now-schedule-name">操作系统</div>
          <div className="now-schedule-meta">
            <div className="now-schedule-row">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <b>教三 309</b>
            </div>
            <div className="now-schedule-row">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
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
      }
      footer={{
        startedAt: getTimeOffset(-2.5),
        lastReportAt: getTimeOffset(-0.005),
      }}
    />
  )
}

export function DemoInspirationStage() {
  const items: InspirationPaperItem[] = [
    {
      key: '01',
      num: '01',
      date: '05·19 · 23:14',
      title: '写在论文之间的字',
      emoji: '🌧',
      mood: '在写论文',
      preview:
        '凌晨三点的图书馆，灯白得像一种警告。我又一次想到那个关于时间的悖论——一切都被时间稀释，所以才需要"现在"。',
      href: '#',
    },
    {
      key: '02',
      num: '02',
      date: '05·18 · 21:02',
      title: '一个关于睡眠的 hypothesis',
      emoji: '🌙',
      mood: '失眠了',
      preview:
        '也许我们一直在错的时间里醒着。也许 22:00 才是真正的深夜，0:00 已经太晚了；只是我们集体把闹钟拨到了一个不诚实的位置。',
      href: '#',
    },
    {
      key: '03',
      num: '03',
      date: '05·17 · 15:48',
      title: '在地铁上读 Calvino',
      emoji: '🚇',
      mood: '通勤',
      preview:
        '"轻"不是逃避，是另一种诚实。卡尔维诺说这句话的时候是 1985 年——他坐在书桌前，窗外是热那亚的雨，而我在 41 年后的地铁里读到它。',
      href: '#',
    },
  ]

  return <InspirationStageView items={items} total={15} />
}

interface DemoAboutSectionProps {
  userName: string
  userBio?: string | null
  avatarSrc?: string | null
  aboutProfile: AboutProfileFields
  displayTimezone: string
  todayStatusEmoji: string
  todayStatusText: string
  todayStatusExpiresAt: string | null | undefined
  todayStatusBusy: boolean
}

export function DemoAboutSection({
  userName,
  userBio,
  avatarSrc,
  aboutProfile,
  displayTimezone,
  todayStatusEmoji,
  todayStatusText,
  todayStatusExpiresAt,
  todayStatusBusy,
}: DemoAboutSectionProps) {
  const name = userName || 'apograss'
  const bio = userBio || '在写论文 / 听周深 / 偶尔失眠 · CS @ 北邮'
  const initial = name.charAt(0).toLowerCase()

  const showStatus =
    aboutProfile.statusEnabled &&
    isTodayStatusActive({ todayStatusEmoji, todayStatusExpiresAt }) &&
    todayStatusText.trim().length > 0
  const statusExpireLabel = todayStatusExpiresAt
    ? formatDisplayPattern(todayStatusExpiresAt, 'HH:mm', displayTimezone)
    : ''
  const figureSrc =
    aboutProfile.figureImage.trim() || '/assets/homepage/section-about-companion.png'

  return (
    <>
      <div className="about-grid">
        {/* LEFT — identity card (avatar + name + status + facts) */}
        <div className="about-left">
          <div className="about-avatar-wrap">
            {avatarSrc ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={avatarSrc} alt={name} className="about-avatar-img" />
            ) : (
              <div className="about-avatar-fallback">{initial}</div>
            )}
            <span className="about-online-dot" title="在线"></span>
          </div>

          <div className="about-identity">
            <h3 className="about-name">{name}</h3>
            {aboutProfile.domainEnabled && aboutProfile.domain.trim() ? (
              <span className="about-domain">{aboutProfile.domain}</span>
            ) : null}
          </div>

          <p className="about-bio">{bio}</p>

          {showStatus ? (
            <div className="about-status">
              {todayStatusEmoji ? (
                <span className="about-status-emoji">{todayStatusEmoji}</span>
              ) : null}
              <span className="about-status-text">{todayStatusText}</span>
              {todayStatusBusy ? <span className="about-status-busy">busy</span> : null}
              {statusExpireLabel ? (
                <span className="about-status-expire">至 {statusExpireLabel}</span>
              ) : null}
            </div>
          ) : null}

          <div className="about-meta">
            {aboutProfile.cityEnabled && aboutProfile.city.trim() ? (
              <span className="about-meta-row">
                <span className="about-meta-lab">CITY</span>
                <span className="about-meta-val">{aboutProfile.city}</span>
              </span>
            ) : null}
            {aboutProfile.emailEnabled && aboutProfile.email.trim() ? (
              <span className="about-meta-row">
                <span className="about-meta-lab">EMAIL</span>
                <span className="about-meta-val">{aboutProfile.email}</span>
              </span>
            ) : null}
            {aboutProfile.githubEnabled && aboutProfile.githubLabel.trim() ? (
              <span className="about-meta-row">
                <span className="about-meta-lab">GITHUB</span>
                {aboutProfile.githubUrl.trim() ? (
                  <a
                    className="about-meta-val"
                    href={aboutProfile.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {aboutProfile.githubLabel}
                  </a>
                ) : (
                  <span className="about-meta-val">{aboutProfile.githubLabel}</span>
                )}
              </span>
            ) : null}
          </div>
        </div>

        {/* RIGHT — large editorial figure */}
        {aboutProfile.figureEnabled ? (
          <figure className="about-figure" aria-hidden="true">
            {aboutProfile.figureLabel.trim() ? (
              <span className="about-figure-label">
                <span className="about-figure-dot"></span>
                {aboutProfile.figureLabel}
              </span>
            ) : null}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={figureSrc}
              alt=""
              loading="lazy"
              className="about-figure-img"
            />
            <figcaption className="about-figure-caption">
              <span className="about-figure-caption-name">{name}</span>
              {aboutProfile.figureCaption.trim() ? (
                <span className="about-figure-caption-meta">{aboutProfile.figureCaption}</span>
              ) : null}
            </figcaption>
          </figure>
        ) : null}
      </div>

      {/* Pull-quote signature spans full width below the grid */}
      {aboutProfile.quoteEnabled && aboutProfile.quoteText.trim() ? (
        <div className="about-signature">
          <p className="about-signature-text">{aboutProfile.quoteText}</p>
          {aboutProfile.quoteSource.trim() ? (
            <div className="about-signature-src">
              <span>{aboutProfile.quoteSource}</span>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  )
}
