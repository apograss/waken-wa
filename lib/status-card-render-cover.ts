import 'server-only'

import { STATUS_CARD_DEFAULT_FOOTER_TEXT } from '@/constants/status-card'
import {
  getDisplayDeviceIcon,
  getDisplayStatusIcon,
  getInitials,
  getSectionTitle,
  resolveStatusCardRenderLines,
} from '@/lib/status-card-render-shared'
import {
  iconElement,
  linkElement,
  multilineTextElement,
  textElement,
} from '@/lib/status-card-svg-elements'
import {
  escapeAttr,
  escapeXml,
  truncateText,
  truncateTextByUnits,
  wrapTextLines,
} from '@/lib/status-card-text'
import type { StatusCardCoverRenderParams } from '@/types/status-card'

export function renderCoverStatusCardSvg({
  options,
  profile,
  activity,
  avatarDataUri,
  coverDataUri,
  inClassStatusActive = false,
  inClassOccurrence,
  statusPageUrl,
  state,
}: StatusCardCoverRenderParams): string {
  const width = options.width
  let height = Math.max(options.height, options.showHeader ? 400 : 320)
  const padding = 24
  const innerWidth = width - padding * 2
  const coverHeight = Math.max(86, Math.min(128, Math.round(height * 0.31)))
  const avatarSize = options.showHeader && options.showAvatar ? 66 : 0
  const avatarX = padding
  const avatarY = coverHeight - Math.round(avatarSize * 0.45)
  const fullTextMaxChars = Math.max(18, Math.floor(innerWidth / 8))
  let contentTop = options.showHeader
    ? Math.max(coverHeight + 24, avatarY + avatarSize + 16)
    : coverHeight + 22
  const {
    steamLine,
    statusLine,
    deviceLine,
    mediaLine,
    shouldPrioritizeGame,
    shouldUseInClassStatus,
  } = resolveStatusCardRenderLines({
    options,
    activity,
    state,
    inClassStatusActive,
    inClassOccurrence,
  })
  const statusIcon = getDisplayStatusIcon({
    state,
    activity,
    statusLine,
    shouldPrioritizeGame,
    shouldUseInClassStatus,
    inactiveFallback: 'hourglass',
  }) ?? 'hourglass'
  const deviceIcon = getDisplayDeviceIcon(state, deviceLine, activity)
  const sectionTitle = getSectionTitle(
    state,
    truncateText(profile.currentlyText || '当前状态', fullTextMaxChars),
  )
  const defs: string[] = [
    `<clipPath id="coverCardClip"><rect x="0" y="0" width="${width}" height="${height}" rx="${options.radius}"/></clipPath>`,
    `<linearGradient id="coverFallback" x1="0" y1="0" x2="${width}" y2="${coverHeight}">
      <stop offset="0%" stop-color="${options.accent}" stop-opacity="0.86"/>
      <stop offset="100%" stop-color="${options.muted}" stop-opacity="0.72"/>
    </linearGradient>`,
    '<linearGradient id="coverShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0F172A" stop-opacity="0.08"/><stop offset="100%" stop-color="#0F172A" stop-opacity="0.42"/></linearGradient>',
    '<filter id="coverAvatarShadow" x="-28%" y="-28%" width="156%" height="156%"><feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#0F172A" flood-opacity="0.24"/></filter>',
    '<filter id="coverPanelShadow" x="-8%" y="-16%" width="116%" height="132%"><feDropShadow dx="0" dy="7" stdDeviation="9" flood-color="#0F172A" flood-opacity="0.12"/></filter>',
  ]
  if (avatarSize > 0) {
    defs.push(
      `<clipPath id="coverAvatarClip"><circle cx="${avatarX + avatarSize / 2}" cy="${avatarY + avatarSize / 2}" r="${avatarSize / 2}"/></clipPath>`,
    )
  }

  const nodes: string[] = [
    `<g clip-path="url(#coverCardClip)">`,
    coverDataUri
      ? `<image href="${escapeAttr(coverDataUri)}" x="0" y="0" width="${width}" height="${coverHeight}" preserveAspectRatio="xMidYMid slice"/>`
      : `<rect x="0" y="0" width="${width}" height="${coverHeight}" fill="url(#coverFallback)"/>`,
    `<rect x="0" y="0" width="${width}" height="${coverHeight}" fill="url(#coverShade)"/>`,
    `<line x1="0" y1="${coverHeight}" x2="${width}" y2="${coverHeight}" stroke="${options.border}" stroke-width="1.2" opacity="0.72"/>`,
    '</g>',
  ]

  if (options.showHeader) {
    if (avatarSize > 0) {
      nodes.push(
        `<circle cx="${avatarX + avatarSize / 2}" cy="${avatarY + avatarSize / 2}" r="${avatarSize / 2 + 4}" fill="${options.bg}" filter="url(#coverAvatarShadow)"/>`,
      )
      if (avatarDataUri) {
        nodes.push(
          `<image href="${escapeAttr(avatarDataUri)}" x="${avatarX}" y="${avatarY}" width="${avatarSize}" height="${avatarSize}" preserveAspectRatio="xMidYMid slice" clip-path="url(#coverAvatarClip)"/>`,
        )
      } else {
        nodes.push(
          `<circle cx="${avatarX + avatarSize / 2}" cy="${avatarY + avatarSize / 2}" r="${avatarSize / 2}" fill="${options.accent}" opacity="0.16"/>`,
          `<text x="${avatarX + avatarSize / 2}" y="${avatarY + 42}" fill="${options.accent}" class="coverAvatarInitials" text-anchor="middle">${escapeXml(getInitials(profile.name))}</text>`,
        )
      }
      nodes.push(
        `<circle cx="${avatarX + avatarSize - 7}" cy="${avatarY + avatarSize - 9}" r="7" fill="${state === 'active' ? options.accent : options.muted}" stroke="${options.bg}" stroke-width="3"/>`,
      )
    }

    const headerX = avatarSize > 0 ? avatarX + avatarSize + 16 : padding
    const headerY = coverHeight + 23
    const headerMaxChars = Math.max(14, Math.floor((width - headerX - padding) / 8))
    let headerBottom = headerY
    if (options.showName) {
      nodes.push(textElement({
        x: headerX,
        y: headerY,
        fill: options.fg,
        className: 'coverName',
        text: truncateText(profile.name || 'Waken', headerMaxChars),
      }))
      headerBottom = Math.max(headerBottom, headerY + 4)
    }
    if (options.showBio && profile.bio) {
      nodes.push(textElement({
        x: headerX,
        y: headerY + 20,
        fill: options.muted,
        className: 'coverBio',
        text: truncateText(profile.bio, headerMaxChars),
      }))
      headerBottom = Math.max(headerBottom, headerY + 24)
    }
    if (options.showNote && profile.note) {
      const noteLines = wrapTextLines(profile.note, Math.max(24, Math.floor(innerWidth / 7.4)), 2)
      const noteY = Math.max(avatarY + avatarSize + 18, headerBottom + 18)
      nodes.push(multilineTextElement({
        x: padding,
        y: noteY,
        fill: options.muted,
        className: 'coverNote',
        lines: noteLines,
        lineHeight: 17,
      }))
      contentTop = Math.max(contentTop, noteY + noteLines.length * 17 + 12)
    }
  }

  const panelY = contentTop
  const panelHeight = 76
  nodes.push(
    `<rect x="${padding}" y="${panelY}" width="${innerWidth}" height="${panelHeight}" rx="16" fill="${options.bg}" stroke="${options.border}" stroke-width="1.1" filter="url(#coverPanelShadow)"/>`,
  )
  nodes.push(
    `<rect x="${padding}" y="${panelY}" width="5" height="${panelHeight}" rx="2.5" fill="${options.accent}" opacity="0.9"/>`,
  )
  nodes.push(iconElement({
    type: statusIcon,
    x: padding + 22,
    y: panelY + 44,
    size: 16,
    stroke: options.accent,
    opacity: 0.72,
  }))
  nodes.push(textElement({
    x: padding + 48,
    y: panelY + 27,
    fill: options.muted,
    className: 'coverKicker',
    text: sectionTitle,
  }))
  nodes.push(multilineTextElement({
    x: padding + 48,
    y: panelY + 53,
    fill: options.fg,
    className: 'coverStatus',
    lines: [truncateTextByUnits(statusLine, Math.max(18, Math.floor((innerWidth - 68) / 9)))],
    lineHeight: 20,
    dominantBaseline: 'middle',
  }))

  const metaY = panelY + panelHeight + 10
  const metaItems = [
    { icon: deviceIcon, text: deviceLine },
    ...(mediaLine ? [{ icon: 'music' as const, text: mediaLine }] : []),
    ...(steamLine && !shouldPrioritizeGame ? [{ icon: 'gamepad' as const, text: steamLine }] : []),
  ]
  const requiredMetaBottom = metaItems.length > 0
    ? metaY + metaItems.length * 31
    : metaY
  height = Math.max(height, requiredMetaBottom + padding + 28)
  let cursorY = metaY
  for (const item of metaItems) {
    if (cursorY + 31 > height - padding - 28) break
    nodes.push(
      `<line x1="${padding}" y1="${cursorY}" x2="${width - padding}" y2="${cursorY}" stroke="${options.border}" stroke-width="1" opacity="0.58"/>`,
    )
    nodes.push(iconElement({
      type: item.icon,
      x: padding,
      y: cursorY + 9,
      size: 14,
      stroke: options.muted,
      opacity: 0.62,
    }))
    nodes.push(textElement({
      x: padding + 22,
      y: cursorY + 21,
      fill: options.muted,
      className: 'coverMeta',
      text: truncateTextByUnits(item.text, Math.max(18, Math.floor((innerWidth - 28) / 7.4))),
    }))
    cursorY += 31
  }

  const footerY = height - padding + 2
  nodes.push(
    `<line x1="${padding}" y1="${footerY - 18}" x2="${width - padding}" y2="${footerY - 18}" stroke="${options.border}" stroke-width="1" opacity="0.62"/>`,
  )
  nodes.push(linkElement(
    statusPageUrl,
    textElement({
      x: padding,
      y: footerY,
      fill: options.muted,
      className: 'coverFooter',
      text: truncateText(STATUS_CARD_DEFAULT_FOOTER_TEXT, fullTextMaxChars),
    }),
  ))

  const ariaLabel = state === 'active'
    ? `${profile.currentlyText || '当前状态'}: ${statusLine}${steamLine ? `. Playing: ${steamLine}` : ''}${mediaLine ? `. Listening: ${mediaLine}` : ''}`
    : statusLine

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttr(ariaLabel)}">`,
    '<style>',
    'text{font-family:"SF Pro Rounded","Segoe UI",ui-rounded,-apple-system,BlinkMacSystemFont,sans-serif;letter-spacing:0}',
    '.coverName{font-size:18px;font-weight:800;letter-spacing:-.01em}',
    '.coverBio,.coverNote{font-size:13px;font-weight:560}',
    '.coverKicker{font-size:11px;font-weight:780;letter-spacing:.12em;text-transform:uppercase}',
    '.coverStatus{font-size:16px;font-weight:760;letter-spacing:-.01em}',
    '.coverMeta{font-size:12px;font-weight:560}',
    '.coverFooter{font-size:10.5px;font-weight:700;letter-spacing:.03em}',
    '.coverAvatarInitials{font-size:19px;font-weight:850}',
    '</style>',
    `<defs>${defs.join('')}</defs>`,
    `<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${options.radius}" fill="${options.bg}" stroke="${options.border}" stroke-width="1.25"/>`,
    ...nodes,
    '</svg>',
  ].join('')
}
