import { HeroClock } from './hero-clock'
import { HeroGreeting } from './hero-greeting'
import { HeroSearch } from './hero-search'
import { HeroWeather } from './hero-weather'
import { HomepageReusedSection, type HomepageReusedSectionProps } from './homepage-reused-section'

interface PersonalHomePageProps {
  reusedSectionProps: HomepageReusedSectionProps
  userName: string
}

export function PersonalHomePage({ reusedSectionProps, userName }: PersonalHomePageProps) {
  return (
    <>
      {/* ====== HERO (above the fold) ====== */}
      <section className="hero">
        {/* Top meta strip */}
        <div className="top-meta">
          <div className="top-meta-left">
            <span className="accent-bar"></span>
            <HeroClock />
          </div>
          <div className="top-meta-right">
            <HeroWeather />
          </div>
        </div>

        {/* Hero body — left half */}
        <div className="hero-body">
          <HeroGreeting />
          <p className="hero-subtitle">
            欢迎来到我的个人空间。
          </p>
          <HeroSearch />
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
