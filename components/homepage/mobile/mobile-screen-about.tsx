'use client'

import Link from 'next/link'
import { useState } from 'react'

import type { AboutProfileFields } from '@/lib/about-profile'
import { useIsEmbedded } from '@/lib/embed'

export interface MobileScreenAboutProps {
  userName: string
  userBio: string | null | undefined
  avatarSrc: string | null | undefined
  aboutProfile: AboutProfileFields
  todayStatusEmoji: string
  todayStatusText: string
  todayStatusBusy: boolean
  blogHomeUrl: string
}

export function MobileScreenAbout({
  userName,
  userBio,
  avatarSrc,
  aboutProfile,
  todayStatusEmoji,
  todayStatusText,
  todayStatusBusy,
  blogHomeUrl,
}: MobileScreenAboutProps) {
  const name = (userName || 'apograss').trim()
  const showStatus = aboutProfile.statusEnabled && Boolean(todayStatusText.trim())
  const [year] = useState(() => new Date().getFullYear())
  const embedded = useIsEmbedded()

  return (
    <section className="m-screen m-about" data-screen="about">
      <div className="m-sec-head">
        <span className="m-sec-num">03</span>
        <h2 className="m-sec-title">关于我</h2>
        <span className="m-sec-rule" />
        <span className="m-mono m-sec-meta">ABOUT</span>
      </div>

      <div className="m-about-id">
        <div className="m-avatar-wrap">
          {avatarSrc ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img className="m-avatar" src={avatarSrc} alt={name} />
          ) : (
            <div className="m-avatar" />
          )}
          <span className="m-avatar-dot" />
        </div>
        <div style={{ minWidth: 0 }}>
          <h3 className="m-about-name">{name}</h3>
          {aboutProfile.domainEnabled && aboutProfile.domain ? (
            <div className="m-mono m-about-domain">{aboutProfile.domain}</div>
          ) : null}
          {showStatus ? (
            <span className="m-about-status">
              {todayStatusEmoji ? `${todayStatusEmoji} ` : ''}{todayStatusText}
              {todayStatusBusy ? <span className="m-mono m-about-status-busy">BUSY</span> : null}
            </span>
          ) : null}
        </div>
      </div>

      {userBio ? <p className="m-about-bio">{userBio}</p> : null}

      <div className="m-about-rows">
        {aboutProfile.cityEnabled && aboutProfile.city ? (
          <div className="m-about-row">
            <span className="m-mono m-about-row-lab">CITY</span>
            <span className="m-about-row-val">{aboutProfile.city}</span>
          </div>
        ) : null}
        {aboutProfile.emailEnabled && aboutProfile.email ? (
          <div className="m-about-row">
            <span className="m-mono m-about-row-lab">EMAIL</span>
            <a className="m-mono m-about-row-val" href={`mailto:${aboutProfile.email}`} style={{ color: 'var(--soft)', textDecoration: 'none' }}>{aboutProfile.email}</a>
          </div>
        ) : null}
        <div className="m-about-row">
          <span className="m-mono m-about-row-lab">LINKS</span>
          <span className="m-about-links">
            {aboutProfile.githubEnabled && aboutProfile.githubUrl ? (
              <a href={aboutProfile.githubUrl} target="_blank" rel="noopener noreferrer">GitHub</a>
            ) : null}
            <a href={blogHomeUrl} target="_blank" rel="noopener noreferrer">Blog</a>
            <a href={`${blogHomeUrl.replace(/\/+$/, '')}/rss.xml`} target="_blank" rel="noopener noreferrer">RSS</a>
          </span>
        </div>
      </div>

      {aboutProfile.quoteEnabled && aboutProfile.quoteText ? (
        <div className="m-about-quote">
          <p>{aboutProfile.quoteText}</p>
          {aboutProfile.quoteSource ? <div className="m-mono m-about-quote-src">{aboutProfile.quoteSource}</div> : null}
        </div>
      ) : null}

      <Link className="m-admin-btn" href="/admin" target={embedded ? '_top' : undefined}>
        <span className="m-admin-btn-ic">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fdf8f0" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.3 1a7 7 0 0 0-1.7-1L16.5 2h-4l-.4 2.3a7 7 0 0 0-1.7 1l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 1.7 1l.4 2.3h4l.4-2.3a7 7 0 0 0 1.7-1l2.3 1 2-3.4-2-1.5a7 7 0 0 0 .1-1z" /></svg>
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span className="m-admin-btn-title">管理控制台</span>
          <span className="m-admin-btn-sub">设备 · 课表 · 灵感 · 首页设置</span>
        </span>
        <span className="m-admin-btn-status"><span className="m-admin-btn-status-dot" />进入 →</span>
      </Link>

      <div className="m-mono m-about-foot">
        <span>© {year} {name}</span>
        <span>{aboutProfile.domain || 'apograss.cn'}</span>
      </div>
    </section>
  )
}
