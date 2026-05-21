import { ActivityFeedProvider } from '@/components/activity-feed-provider'
import { CurrentStatus } from '@/components/current-status'
import { InspirationHomeSection } from '@/components/inspiration-home-section'
import { ScheduleHomeInClassBanner } from '@/components/schedule-home-in-class-banner'
import { UserProfile, UserProfileNoteSection } from '@/components/user-profile'

import { DemoCurrentStatus, DemoInspirationList } from './demo-content'

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
}

// When there's no real data yet (no Reporter, no inspiration entries),
// fall back to demo content so the page looks "filled in" for design preview.
const SHOW_DEMO_WHEN_EMPTY = true

export function HomepageReusedSection(props: HomepageReusedSectionProps) {
  const hasRealActivity =
    !!(props.activityInitialFeed as { activeStatuses?: unknown[] })?.activeStatuses?.length
  const hasRealInspiration = props.inspirationTotal > 0

  const showDemoActivity = SHOW_DEMO_WHEN_EMPTY && !hasRealActivity
  const showDemoInspiration = SHOW_DEMO_WHEN_EMPTY && !hasRealInspiration

  return (
    <ActivityFeedProvider
      initialFeed={props.activityInitialFeed as never}
      mode={props.activityUpdateMode as never}
    >
      {/* SECTION 01 — 关于我 */}
      <section className="sec">
        <header className="sec-head">
          <span className="sec-num">01</span>
          <h2 className="sec-title">关于我</h2>
          <div className="sec-rule"></div>
          <span className="sec-meta">about · profile</span>
        </header>

        <div className="gcard">
          <UserProfile
            name={props.userName}
            bio={props.userBio ?? undefined}
            avatarUrl={props.avatarSrc ?? undefined}
            profileOnlineAccentColor={props.profileOnlineAccentColor ?? undefined}
            profileOnlinePulseEnabled={props.profileOnlinePulseEnabled ?? undefined}
            todayStatusEmoji={props.todayStatusEmoji}
            todayStatusText={props.todayStatusText}
            todayStatusExpiresAt={props.todayStatusExpiresAt ?? undefined}
            todayStatusBusy={props.todayStatusBusy}
          />

          <UserProfileNoteSection
            note={props.userNote ?? undefined}
            avatarUrl={props.avatarSrc ?? undefined}
            noteHitokotoEnabled={props.noteHitokotoEnabled}
            noteTypewriterEnabled={props.noteTypewriterEnabled}
            noteSignatureFontEnabled={props.noteSignatureFontEnabled}
            noteSignatureFontFamily={props.noteSignatureFontFamily}
            noteHitokotoCategories={props.noteHitokotoCategories}
            noteHitokotoEncode={props.noteHitokotoEncode as never}
            noteHitokotoFallbackToNote={props.noteHitokotoFallbackToNote}
          />
        </div>
      </section>

      {/* SECTION 02 — 此刻 */}
      <section className="sec">
        <header className="sec-head">
          <span className="sec-num">02</span>
          <h2 className="sec-title">此刻</h2>
          <div className="sec-rule"></div>
          <span className="sec-meta"><span className="live-dot"></span>live</span>
          {showDemoActivity && <span className="demo-banner">demo</span>}
        </header>

        <div className="now-grid">
          <div className="gcard">
            {showDemoActivity ? (
              <DemoCurrentStatus />
            ) : (
              <>
                {props.showScheduleHomeColumn && (
                  <ScheduleHomeInClassBanner
                    courses={props.scheduleCoursesForHome as never}
                    showLocation={props.scheduleHomeShowLocation}
                    showTeacher={props.scheduleHomeShowTeacher}
                    periodTemplate={props.schedulePeriodTemplate as never}
                    showNextUpcoming={props.scheduleHomeShowNextUpcoming}
                    afterClassesLabel={props.scheduleHomeAfterClassesLabel}
                  />
                )}
                <CurrentStatus
                  hideActivityMedia={props.hideActivityMedia}
                  showMediaSource={props.mediaDisplayShowSource}
                  showMediaCover={props.mediaDisplayShowCover}
                  showMediaNcmLink={props.mediaDisplayShowNcmLink}
                />
              </>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 03 — 灵感 */}
      {props.hideInspirationOnHome ? null : (
        <section className="sec">
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
            <DemoInspirationList />
          ) : (
            <InspirationHomeSection
              entries={props.inspirationHomeEntries as never}
              showArchiveLink={props.inspirationTotal > 3}
            />
          )}
        </section>
      )}
    </ActivityFeedProvider>
  )
}
