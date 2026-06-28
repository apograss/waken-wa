import { ActivityFeedProvider } from '@/components/activity-feed-provider'
import type { AboutProfileFields } from '@/lib/about-profile'
import type { TodaySummary } from '@/lib/activity-daily'
import type { HaloBlogPost } from '@/lib/halo-blog'
import type { SteamGamesResult } from '@/lib/steam-games'

import { BlogStrip } from './blog-strip'
import { DemoAboutSection, DemoInspirationStage } from './demo-content'
import { LiveInspirationStage } from './live-inspiration-stage'
import { LiveNowBanner } from './live-now-banner'
import { LiveNowSection } from './live-now-section'
import { TodaySection } from './today-section'

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
  aboutProfile: AboutProfileFields
  aboutDisplayTimezone: string
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
  todaySummary: TodaySummary
  steamGames: SteamGamesResult
}

export function HomepageReusedSection(props: HomepageReusedSectionProps) {
  const hasRealInspiration = props.inspirationTotal > 0
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
          aboutProfile={props.aboutProfile}
          displayTimezone={props.aboutDisplayTimezone}
          todayStatusEmoji={props.todayStatusEmoji}
          todayStatusText={props.todayStatusText}
          todayStatusExpiresAt={props.todayStatusExpiresAt}
          todayStatusBusy={props.todayStatusBusy}
        />
      </section>

      {/* SECTION 02 — 此刻 */}
      <section className="sec sec-now">
        <header className="sec-head">
          <span className="sec-num">02</span>
          <h2 className="sec-title">此刻</h2>
          <div className="sec-rule"></div>
          <span className="sec-meta"><span className="live-dot"></span>live</span>
        </header>

        {/* 此刻永远使用真实数据：在线显示实时，离线（4h 内）显示最后记录，
            无数据显示真实空态——不再回退到 demo 占位 */}
        <LiveNowBanner hideMedia={props.hideActivityMedia} />

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

        <TodaySection today={props.todaySummary} steam={props.steamGames} />
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
