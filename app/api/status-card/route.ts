import { NextRequest, NextResponse } from 'next/server'

import { ACTIVITY_FEED_DEFAULT_LIMIT } from '@/lib/activity-api-constants'
import { getActivityFeedData } from '@/lib/activity-feed'
import { getSession, isSiteLockSatisfied } from '@/lib/auth'
import { getPublicOrigin } from '@/lib/public-request-url'
import { getSiteConfigMemoryFirst } from '@/lib/site-config-cache'
import {
  getStatusCardProfile,
  parseStatusCardOptions,
  renderStatusCardSvg,
  resolveStatusCardAvatarDataUri,
  selectStatusCardActivity,
} from '@/lib/status-card-svg'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

function svgResponse(svg: string, status = 200): NextResponse {
  return new NextResponse(svg, {
    status,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

export async function GET(request: NextRequest) {
  try {
    const config = await getSiteConfigMemoryFirst()
    const options = parseStatusCardOptions(request.nextUrl.searchParams, config)
    const profile = getStatusCardProfile(config)
    const adminSession = await getSession()
    const statusPageUrl = `${getPublicOrigin(request)}/`

    if (config?.statusCardEnabled !== true && !adminSession) {
      return svgResponse(
        renderStatusCardSvg({
          options,
          profile,
          activity: null,
          avatarDataUri: null,
          statusPageUrl,
          state: 'disabled',
        }),
        404,
      )
    }

    const siteLockOk = await isSiteLockSatisfied()

    if (!siteLockOk && !adminSession) {
      return svgResponse(
        renderStatusCardSvg({
          options,
          profile,
          activity: null,
          avatarDataUri: null,
          statusPageUrl,
          state: 'locked',
        }),
        403,
      )
    }

    const feed = await getActivityFeedData(ACTIVITY_FEED_DEFAULT_LIMIT, {
      forPublicFeed: true,
      includeGeneratedHashKey: true,
    })
    const activity = selectStatusCardActivity(feed, options)
    const avatarDataUri =
      options.showHeader && options.showAvatar
        ? await resolveStatusCardAvatarDataUri(profile)
        : null

    return svgResponse(
      renderStatusCardSvg({
        options,
        profile,
        activity,
        avatarDataUri,
        statusPageUrl,
        state: activity ? 'active' : 'empty',
      }),
    )
  } catch (error) {
    console.error('[status-card] render failed:', error)
    const options = parseStatusCardOptions(request.nextUrl.searchParams)
    return svgResponse(
      renderStatusCardSvg({
        options,
        profile: getStatusCardProfile(null),
        activity: null,
        avatarDataUri: null,
        statusPageUrl: `${getPublicOrigin(request)}/`,
        state: 'empty',
      }),
      500,
    )
  }
}
