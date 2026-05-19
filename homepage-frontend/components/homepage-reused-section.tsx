/**
 * This component wraps the original waken-wa homepage content (profile, status, inspiration, etc.)
 * It receives all the props that the original page.tsx computed and passes them through.
 * This is a server component — it renders the same content as the original homepage's main section.
 */

import { ActivityFeedProvider } from '@/components/activity-feed-provider'
import { ContentReadingPanel } from '@/components/content-reading-panel'
import { CurrentStatus } from '@/components/current-status'
import { InspirationHomeSection } from '@/components/inspiration-home-section'
import { ScheduleHomeInClassBanner } from '@/components/schedule-home-in-class-banner'
import { SiteReveal } from '@/components/site-reveal'
import { UserProfile, UserProfileNoteSection } from '@/components/user-profile'

export interface HomepageReusedSectionProps {
  // Activity feed
  activityInitialFeed: unknown
  activityUpdateMode: string

  // User profile
  userName: string
  userBio: string | null | undefined
  avatarSrc: string | null | undefined
  profileOnlineAccentColor: string | null | undefined
  profileOnlinePulseEnabled: boolean | null | undefined
  todayStatusEmoji: string
  todayStatusText: string
  todayStatusExpiresAt: string | null | undefined
  todayStatusBusy: boolean

  // Note section
  userNote: string | null | undefined
  noteHitokotoEnabled: boolean
  noteTypewriterEnabled: boolean
  noteSignatureFontEnabled: boolean
  noteSignatureFontFamily: string
  noteHitokotoCategories: string[]
  noteHitokotoEncode: string
  noteHitokotoFallbackToNote: boolean

  // Current status
  currentlyText: string
  hideActivityMedia: boolean
  mediaDisplayShowSource: boolean
  mediaDisplayShowCover: boolean
  mediaDisplayShowNcmLink: boolean

  // Schedule
  showScheduleHomeColumn: boolean
  scheduleCoursesForHome: unknown[]
  scheduleHomeShowLocation: boolean
  scheduleHomeShowTeacher: boolean
  schedulePeriodTemplate: unknown
  scheduleHomeShowNextUpcoming: boolean
  scheduleHomeAfterClassesLabel: string

  // Inspiration
  hideInspirationOnHome: boolean
  earlierText: string
  inspirationHomeEntries: unknown[]
  inspirationTotal: number
}

export function HomepageReusedSection(props: HomepageReusedSectionProps) {
  return (
    <div data-global-mouse-tilt-target className="[transform-style:preserve-3d]">
      <ContentReadingPanel className="home-frost-shell p-5 sm:p-6">
        <ActivityFeedProvider
          initialFeed={props.activityInitialFeed as never}
          mode={props.activityUpdateMode as never}
        >
          <div className="flex flex-col gap-4">
            <SiteReveal delay={0.04}>
              <div
                className={
                  props.showScheduleHomeColumn
                    ? 'flex flex-col gap-3 sm:flex-row sm:flex-nowrap sm:items-start sm:gap-4'
                    : 'flex flex-col gap-4'
                }
              >
                <div
                  className={
                    props.showScheduleHomeColumn
                      ? 'min-w-0 w-full sm:flex-1 sm:basis-0 sm:overflow-hidden'
                      : 'min-w-0 w-full'
                  }
                >
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
                </div>
                {props.showScheduleHomeColumn ? (
                  <ScheduleHomeInClassBanner
                    courses={props.scheduleCoursesForHome as never}
                    showLocation={props.scheduleHomeShowLocation}
                    showTeacher={props.scheduleHomeShowTeacher}
                    periodTemplate={props.schedulePeriodTemplate as never}
                    showNextUpcoming={props.scheduleHomeShowNextUpcoming}
                    afterClassesLabel={props.scheduleHomeAfterClassesLabel}
                    className="w-full sm:w-1/3 sm:min-w-0 sm:shrink-0 sm:basis-1/3"
                  />
                ) : null}
              </div>
            </SiteReveal>

            <SiteReveal delay={0.08}>
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
            </SiteReveal>

            <SiteReveal delay={0.12}>
              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            </SiteReveal>

            <SiteReveal delay={0.16}>
              <section>
                <h2 className="text-sm font-semibold text-foreground tracking-tight mb-4">
                  {props.currentlyText}
                </h2>
                <div className="space-y-3">
                  <CurrentStatus
                    hideActivityMedia={props.hideActivityMedia}
                    showMediaSource={props.mediaDisplayShowSource}
                    showMediaCover={props.mediaDisplayShowCover}
                    showMediaNcmLink={props.mediaDisplayShowNcmLink}
                  />
                </div>
              </section>
            </SiteReveal>
          </div>
        </ActivityFeedProvider>

        {props.hideInspirationOnHome ? null : (
          <SiteReveal delay={0.2}>
            <section className="mt-8">
              <h2 className="text-sm font-semibold text-foreground tracking-tight mb-6">
                {props.earlierText}
              </h2>
              <InspirationHomeSection
                entries={props.inspirationHomeEntries as never}
                showArchiveLink={props.inspirationTotal > 3}
              />
            </section>
          </SiteReveal>
        )}
      </ContentReadingPanel>
    </div>
  )
}
