import { ActivityFeedProvider } from '@/components/activity-feed-provider'
import { CurrentStatus } from '@/components/current-status'
import { InspirationHomeSection } from '@/components/inspiration-home-section'
import { ScheduleHomeInClassBanner } from '@/components/schedule-home-in-class-banner'
import { UserProfile, UserProfileNoteSection } from '@/components/user-profile'

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

export function HomepageReusedSection(props: HomepageReusedSectionProps) {
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
        </header>

        <div className="now-grid">
          <div className="gcard">
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
            <div className="ph-hint" style={{ marginTop: 14, textAlign: 'center', opacity: 0.6 }}>
              想在这里看到设备 / 音乐 / Steam ?
              安装 <code>Waken-Wa-Reporter</code> 上报状态
            </div>
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
            <span className="sec-meta">notes · 共 {props.inspirationTotal} 篇</span>
          </header>

          {props.inspirationTotal === 0 ? (
            <div className="placeholder-card">
              <div className="ph-icon">📝</div>
              <div className="ph-title">还没有灵感记录</div>
              <p>在管理后台「灵感」中添加你的第一条随笔。</p>
              <div className="ph-hint">
                <code>/admin</code> · 灵感
              </div>
            </div>
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
