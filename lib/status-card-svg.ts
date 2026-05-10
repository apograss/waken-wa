import 'server-only'

import { renderAuroraStatusCardSvg } from '@/lib/status-card-render-aurora'
import { renderClassicStatusCardSvg } from '@/lib/status-card-render-classic'
import { renderCoverStatusCardSvg } from '@/lib/status-card-render-cover'
import { resolveStatusCardAutoDimensions } from '@/lib/status-card-render-shared'
import { renderSignatureStatusCardSvg } from '@/lib/status-card-render-signature'
import type {
  StatusCardOptions,
  StatusCardRenderParams,
} from '@/types/status-card'

export function renderStatusCardSvg({
  options,
  profile,
  activity,
  avatarDataUri,
  coverDataUri,
  backgroundDataUri,
  inClassStatusActive = false,
  inClassOccurrence,
  statusPageUrl,
  state,
}: StatusCardRenderParams): string {
  const resolvedDimensions = resolveStatusCardAutoDimensions(
    options,
    profile,
    activity,
    state,
    inClassStatusActive,
    inClassOccurrence,
  )
  const resolvedOptions: StatusCardOptions = {
    ...options,
    width: resolvedDimensions.width,
    height: resolvedDimensions.height,
    widthAuto: false,
    heightAuto: false,
  }

  switch (resolvedOptions.variant) {
    case 'signature':
      return renderSignatureStatusCardSvg({
        options: resolvedOptions,
        profile,
        activity,
        avatarDataUri,
        backgroundDataUri,
        inClassStatusActive,
        inClassOccurrence,
        statusPageUrl,
        state,
      })
    case 'cover':
      return renderCoverStatusCardSvg({
        options: resolvedOptions,
        profile,
        activity,
        avatarDataUri,
        coverDataUri,
        inClassStatusActive,
        inClassOccurrence,
        statusPageUrl,
        state,
      })
    case 'aurora':
      return renderAuroraStatusCardSvg({
        options: resolvedOptions,
        profile,
        activity,
        avatarDataUri,
        inClassStatusActive,
        inClassOccurrence,
        statusPageUrl,
        state,
      })
    case 'classic':
      return renderClassicStatusCardSvg({
        options: resolvedOptions,
        profile,
        activity,
        avatarDataUri,
        inClassStatusActive,
        inClassOccurrence,
        statusPageUrl,
        state,
      })
  }
}
