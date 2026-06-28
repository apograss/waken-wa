'use client'

import { type ReactNode, useState } from 'react'

import { ActivityFeedProvider } from '@/components/activity-feed-provider'
import { resolveAboutFigureImage } from '@/lib/about-profile'
import type { HomepageSettings } from '@/types/homepage-settings'

import type { HomepageReusedSectionProps } from '../homepage-reused-section'
import { MobileScreenAbout } from './mobile-screen-about'
import { MobileScreenHome } from './mobile-screen-home'
import { MobileScreenInspiration } from './mobile-screen-inspiration'
import { MobileScreenNow } from './mobile-screen-now'

export interface MobileHomeProps {
  homepageSettings: HomepageSettings
  reused: HomepageReusedSectionProps
}

type TabId = 'home' | 'now' | 'inspiration' | 'about'

const TABS: { id: TabId; label: string; icon: ReactNode }[] = [
  {
    id: 'home',
    label: '首页',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-8 9 8M5 10v10h14V10" /></svg>
    ),
  },
  {
    id: 'now',
    label: '此刻',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
    ),
  },
  {
    id: 'inspiration',
    label: '灵感',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 1 4 10.5c-.7.6-1 1-1 2H9c0-1-.3-1.4-1-2A6 6 0 0 1 12 3z" /></svg>
    ),
  },
  {
    id: 'about',
    label: '关于',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
    ),
  },
]

export function MobileHome({ homepageSettings, reused }: MobileHomeProps) {
  const [tab, setTab] = useState<TabId>('home')
  const [navOpen, setNavOpen] = useState(false)

  const currentLabel = TABS.find((t) => t.id === tab)?.label ?? '首页'

  return (
    <ActivityFeedProvider
      initialFeed={reused.activityInitialFeed as never}
      mode={reused.activityUpdateMode as never}
    >
      <div className="m-root">
        <div className="m-viewport">
          {tab === 'home' ? (
            <MobileScreenHome
              userName={reused.userName}
              userNote={reused.userNote}
              weatherEnabled={homepageSettings.weatherEnabled}
              backgroundImage={resolveAboutFigureImage(reused.aboutProfile)}
              defaultEngine={homepageSettings.defaultEngine}
              visibleEngines={homepageSettings.visibleEngines}
            />
          ) : null}
          {tab === 'now' ? (
            <MobileScreenNow
              scheduleCourses={reused.scheduleCoursesForHome as never}
              schedulePeriodTemplate={reused.schedulePeriodTemplate as never}
              scheduleShowLocation={reused.scheduleHomeShowLocation}
              scheduleShowTeacher={reused.scheduleHomeShowTeacher}
              scheduleEnabled={(reused.scheduleCoursesForHome as unknown[]).length > 0}
              afterClassesLabel={reused.scheduleHomeAfterClassesLabel}
              todaySummary={reused.todaySummary}
              steamGames={reused.steamGames}
            />
          ) : null}
          {tab === 'inspiration' ? (
            <MobileScreenInspiration
              entries={reused.inspirationHomeEntries as never}
              total={reused.inspirationTotal}
              blogPosts={reused.blogPosts}
              blogHomeUrl={reused.blogHomeUrl}
              earlierText={reused.earlierText}
            />
          ) : null}
          {tab === 'about' ? (
            <MobileScreenAbout
              userName={reused.userName}
              userBio={reused.userBio}
              avatarSrc={reused.avatarSrc}
              aboutProfile={reused.aboutProfile}
              todayStatusEmoji={reused.todayStatusEmoji}
              todayStatusText={reused.todayStatusText}
              todayStatusBusy={reused.todayStatusBusy}
              blogHomeUrl={reused.blogHomeUrl}
            />
          ) : null}
        </div>

        {/* 收起态把手 */}
        {!navOpen ? (
          <button type="button" className="m-nav-handle" onClick={() => setNavOpen(true)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6" /></svg>
            <span className="m-mono m-nav-handle-label">{currentLabel}</span>
          </button>
        ) : null}

        {/* 展开态遮罩 + 标签栏 */}
        {navOpen ? <div className="m-nav-backdrop" onClick={() => setNavOpen(false)} /> : null}
        <nav className="m-nav" style={{ transform: navOpen ? 'translateY(0)' : 'translateY(110%)' }}>
          <button type="button" className="m-nav-grip-btn" onClick={() => setNavOpen(false)} aria-label="收起">
            <span className="m-nav-grip" />
          </button>
          <div className="m-nav-tabs">
            {TABS.map((t) => {
              const active = t.id === tab
              return (
                <button
                  key={t.id}
                  type="button"
                  className="m-nav-tab"
                  onClick={() => {
                    setTab(t.id)
                    setNavOpen(false)
                  }}
                  style={{ color: active ? 'var(--accent)' : 'var(--soft)' }}
                >
                  {t.icon}
                  <span className="m-nav-tab-label" style={{ fontWeight: active ? 600 : 400 }}>{t.label}</span>
                  <span className="m-nav-tab-dot" style={{ background: active ? 'var(--accent)' : 'transparent' }} />
                </button>
              )
            })}
          </div>
        </nav>
      </div>
    </ActivityFeedProvider>
  )
}
