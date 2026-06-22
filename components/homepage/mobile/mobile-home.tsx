'use client'

import { type ReactNode, useState } from 'react'

import { ActivityFeedProvider } from '@/components/activity-feed-provider'
import type { HomepageSettings } from '@/types/homepage-settings'

import type { HomepageReusedSectionProps } from '../homepage-reused-section'
import { MobileScreenHome } from './mobile-screen-home'

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

function Placeholder({ label }: { label: string }) {
  return (
    <section className="m-screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: 'var(--soft)' }}>
        <div className="m-serif" style={{ fontSize: 22, color: 'var(--ink)', marginBottom: 8 }}>{label}</div>
        <div className="m-mono" style={{ fontSize: 11, letterSpacing: '0.16em', color: 'var(--dim)' }}>即将上线</div>
      </div>
    </section>
  )
}

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
              coverImage={homepageSettings.coverImage}
              defaultEngine={homepageSettings.defaultEngine}
              visibleEngines={homepageSettings.visibleEngines}
            />
          ) : null}
          {tab === 'now' ? <Placeholder label="此刻" /> : null}
          {tab === 'inspiration' ? <Placeholder label="灵感" /> : null}
          {tab === 'about' ? <Placeholder label="关于我" /> : null}
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
