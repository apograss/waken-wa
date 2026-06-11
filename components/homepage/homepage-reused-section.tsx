import { ActivityFeedProvider } from '@/components/activity-feed-provider'
import type { HaloBlogPost } from '@/lib/halo-blog'

import { BlogStrip } from './blog-strip'
import { DemoAboutSection, DemoInspirationStage, DemoNowSection } from './demo-content'
import { LiveInspirationStage } from './live-inspiration-stage'
import { LiveNowBanner } from './live-now-banner'
import { LiveNowSection } from './live-now-section'

export interface HomepageReusedSectionProps {
  activityInitialFeed: unknown
  activityUpdateMode: string
  userName: string
  userBio: string | null | undefined
  avatarSrc: string | null | undefined
  profileOnlineAccentColor: string | null | undefined
  profileOnlinePulseEnabled: boolean | null | undefined
  todayStatusEmoji: string
  todayStatusText: string
  todayStatusExpiresAt: string | null | undefined
  todayStatusBusy: boolean
  userNote: string | null | undefined
  noteHitokotoEnabled: boolean
  noteTypewriterEnabled: boolean
  noteSignatureFontEnabled: boolean
  noteSignatureFontFamily: string
  noteHitokotoCategories: string[]
  noteHitokotoEncode: string
  noteHitokotoFallbackToNote: boolean
  currentlyText: string
  hideActivityMedia: boolean
  mediaDisplayShowSource: boolean
  mediaDisplayShowCover: boolean
  mediaDisplayShowNcmLink: boolean
  showScheduleHomeColumn: boolean
  scheduleCoursesForHome: unknown[]
  scheduleHomeShowLocation: boolean
  scheduleHomeShowTeacher: boolean
  schedulePeriodTemplate: unknown
  scheduleHomeShowNextUpcoming: boolean
  scheduleHomeAfterClassesLabel: string
  hideInspirationOnHome: boolean
  earlierText: string
  inspirationHomeEntries: unknown[]
  inspirationTotal: number
  blogPosts: HaloBlogPost[]
  blogHomeUrl: string
  demoEnabled: boolean
}

export function HomepageReusedSection(props: HomepageReusedSectionProps) {
  const hasRealActivity =
    !!(props.activityInitialFeed as { activeStatuses?: unknown[] })?.activeStatuses?.length
  const hasRealInspiration = props.inspirationTotal > 0

  const showDemoActivity = props.demoEnabled && !hasRealActivity
  const showDemoInspiration = props.demoEnabled && !hasRealInspiration

  return (
    <ActivityFeedProvider
      initialFeed={props.activityInitialFeed as never}
      mode={props.activityUpdateMode as never}
    >
      {/* SECTION 01 — 关于我 */}
      <section className="sec sec-about">
        <header className="sec-head">
          <span className="sec-num">01</span>
          <h2 className="sec-title">关于我</h2>
          <div className="sec-rule"></div>
          <span className="sec-meta">about · profile</span>
        </header>

        <DemoAboutSection
          userName={props.userName}
          userBio={props.userBio}
          avatarSrc={props.avatarSrc}
        />
      </section>

      {/* SECTION 02 — 此刻 */}
      <section className="sec sec-now">
        <header className="sec-head">
          <span className="sec-num">02</span>
          <h2 className="sec-title">此刻</h2>
          <div className="sec-rule"></div>
          <span className="sec-meta"><span className="live-dot"></span>live</span>
          {showDemoActivity && <span className="demo-banner">demo</span>}
        </header>

        {/* Editorial banner — 立绘 + LIVE 角标 + (demo 时写死 / 真实时读现在播放) */}
        {showDemoActivity ? (
          <DemoNowBanner />
        ) : (
          <LiveNowBanner hideMedia={props.hideActivityMedia} />
        )}

        {showDemoActivity ? (
          <DemoNowSection />
        ) : (
          <LiveNowSection
            hideMedia={props.hideActivityMedia}
            schedule={
              props.showScheduleHomeColumn
                ? {
                    show: true,
                    courses: props.scheduleCoursesForHome,
                    showLocation: props.scheduleHomeShowLocation,
                    showTeacher: props.scheduleHomeShowTeacher,
                    periodTemplate: props.schedulePeriodTemplate,
                    showNextUpcoming: props.scheduleHomeShowNextUpcoming,
                    afterClassesLabel: props.scheduleHomeAfterClassesLabel,
                  }
                : undefined
            }
          />
        )}
      </section>

      {/* SECTION 03 — 灵感 */}
      {props.hideInspirationOnHome ? null : (
        <section className="sec sec-inspiration">
          <header className="sec-head">
            <span className="sec-num">03</span>
            <h2 className="sec-title">灵感</h2>
            <div className="sec-rule"></div>
            <span className="sec-meta">
              notes · 共 {showDemoInspiration ? 3 : props.inspirationTotal} 篇
            </span>
            {showDemoInspiration && <span className="demo-banner">demo</span>}
          </header>

          {showDemoInspiration ? (
            <DemoInspirationStage />
          ) : (
            <LiveInspirationStage
              entries={props.inspirationHomeEntries as never}
              total={props.inspirationTotal}
            />
          )}

          <BlogStrip posts={props.blogPosts} blogHomeUrl={props.blogHomeUrl} />
        </section>
      )}
    </ActivityFeedProvider>
  )
}

/** 02 此刻顶部的 demo banner —— 立绘 + 写死的 LIVE / quote / now-playing chip */
function DemoNowBanner() {
  return (
    <figure className="now-banner" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/homepage/section-now-companion.png"
        alt=""
        loading="lazy"
        className="now-banner-img"
      />
      <span className="now-banner-live">
        <span className="now-banner-pulse"></span>
        live · 在线
      </span>
      <div className="now-banner-quote">
        <span className="now-banner-quote-eyebrow">现在</span>
        <p className="now-banner-quote-text">
          听见雨声<br />写到第三章
        </p>
        <span className="now-banner-quote-time">15:42 · 周三</span>
      </div>
      <div className="now-banner-chip">
        <div className="now-banner-cover">♪</div>
        <div className="now-banner-info">
          <div className="now-banner-title">大鱼</div>
          <div className="now-banner-artist">周深 · 《大鱼海棠》印象曲</div>
        </div>
        <div className="now-banner-time">2:47 / 5:38</div>
      </div>
    </figure>
  )
}
