'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useT } from 'next-i18next/client'

import { useSharedActivityFeed } from '@/components/activity-feed-provider'
import { CurrentStatusCard } from '@/components/current-status-card'
import {
  getSiteSectionTransition,
  getSiteSectionVariants,
} from '@/components/site-motion'

interface CurrentStatusProps {
  hideActivityMedia?: boolean
  showMediaSource?: boolean
  showMediaCover?: boolean
  showMediaNcmLink?: boolean
}

export function CurrentStatus({
  hideActivityMedia = false,
  showMediaSource = false,
  showMediaCover = false,
  showMediaNcmLink = false,
}: CurrentStatusProps) {
  const { t } = useT('common')
  const { feed, error } = useSharedActivityFeed()
  const prefersReducedMotion = Boolean(useReducedMotion())
  const sectionTransition = getSiteSectionTransition(prefersReducedMotion)
  const sectionVariants = getSiteSectionVariants(prefersReducedMotion, {
    enterY: 12,
    exitY: 8,
    scale: 0.996,
  })

  if (error) {
    return <div className="text-sm text-destructive">{error}</div>
  }

  const statuses = feed?.activeStatuses ?? []

  if (statuses.length === 0) {
    return (
      <motion.div
        className="home-glass-card border border-t-0 border-r-0 border-border rounded-lg shadow-sm p-6 sm:p-8 bg-card"
        variants={sectionVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={sectionTransition}
      >
        <div className="text-center text-muted-foreground">
          <div className="text-sm">{t('site.currentStatus.noActiveStatus')}</div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div className="space-y-3" layout>
      <AnimatePresence initial={false}>
        {statuses.map((activity) => (
          <CurrentStatusCard
            key={
              activity.deviceId != null
                ? `device-${activity.deviceId}`
                : `device-${activity.device || activity.processName || activity.id}`
            }
            activity={activity}
            hideActivityMedia={hideActivityMedia}
            showMediaSource={showMediaSource}
            showMediaCover={showMediaCover}
            showMediaNcmLink={showMediaNcmLink}
            sectionTransition={sectionTransition}
            sectionVariants={sectionVariants}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  )
}
