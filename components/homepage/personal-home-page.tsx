import type { CSSProperties } from 'react'

import type { HomepageSettings } from '@/types/homepage-settings'

import { HeroClock } from './hero-clock'
import { HeroGreeting } from './hero-greeting'
import { HeroSearch } from './hero-search'
import { HeroSubtitle } from './hero-subtitle'
import { HeroWeather } from './hero-weather'
import { HomepageReusedSection, type HomepageReusedSectionProps } from './homepage-reused-section'

interface PersonalHomePageProps {
  homepageSettings: HomepageSettings
  reusedSectionProps: HomepageReusedSectionProps
  userName: string
}

export function PersonalHomePage({
  homepageSettings,
  reusedSectionProps,
  userName,
}: PersonalHomePageProps) {
  const heroStyle: CSSProperties = {
    backgroundImage: `url("${homepageSettings.coverImage.replace(/"/g, '\\"')}")`,
  }

  return (
    <>
      {/* ====== HERO (above the fold) ====== */}
      <section className="hero" style={heroStyle}>
        {/* Top meta strip */}
        <div className="top-meta">
          <div className="top-meta-left">
            <span className="accent-bar"></span>
            <HeroClock />
          </div>
          <div className="top-meta-right">
            {homepageSettings.weatherEnabled ? <HeroWeather /> : null}
          </div>
        </div>

        {/* Hero body — left half */}
        <div className="hero-body">
          <HeroGreeting />
          <HeroSubtitle
            customText={homepageSettings.greetingCustomText}
            source={homepageSettings.greetingSource}
          />
          <HeroSearch
            defaultEngineId={homepageSettings.defaultEngine}
            visibleEngineIds={homepageSettings.visibleEngines}
          />
        </div>

        {/* Glance status — single line */}
        <div className="glance">
          <span className="dot-name"><span className="dot"></span><b>{userName || 'apograss'}</b></span>
          <span className="sep"></span>
          <span>在线</span>
        </div>

        {/* Scroll cue */}
        <a className="scroll-cue" href="#more" aria-label="向下浏览">
          <span>continue</span>
          <span className="line"></span>
        </a>
      </section>

      {/* ====== BELOW THE FOLD ====== */}
      <section className="scroll-section" id="more">
        <div className="scroll-inner">
          <HomepageReusedSection {...reusedSectionProps} />
        </div>
      </section>
    </>
  )
}
