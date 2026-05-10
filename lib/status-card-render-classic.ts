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
  detailPillElement,
  iconElement,
  linkElement,
  multilineTextElement,
  roundedRectElement,
  textElement,
} from '@/lib/status-card-svg-elements'
import {
  escapeAttr,
  escapeXml,
  truncateText,
  truncateTextByUnits,
  wrapTextLines,
} from '@/lib/status-card-text'
import type {
  StatusCardDetailRow,
  StatusCardRenderBaseParams,
} from '@/types/status-card'

export function renderClassicStatusCardSvg({
  options,
  profile,
  activity,
  avatarDataUri,
  inClassStatusActive = false,
  inClassOccurrence,
  statusPageUrl,
  state,
}: StatusCardRenderBaseParams): string {
  const width = options.width
  let height = options.height
  const padding = 24
  const innerWidth = width - padding * 2
  const headerEnabled = options.showHeader
  const avatarSize = 54
  const avatarX = padding
  const avatarY = padding
  const headerTextX = options.showAvatar ? avatarX + avatarSize + 14 : padding
  const textMaxChars = Math.max(18, Math.floor((width - headerTextX - padding) / 8))
  const fullTextMaxChars = Math.max(18, Math.floor(innerWidth / 8))
  const defs: string[] = [
    '<filter id="classicCardShadow" x="-6%" y="-8%" width="112%" height="116%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#0F172A" flood-opacity="0.16"/></filter>',
    '<filter id="classicInsetShadow" x="-8%" y="-16%" width="116%" height="132%"><feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#0F172A" flood-opacity="0.11"/></filter>',
  ]
  const nodes: string[] = []
  let headerBottom = headerEnabled ? avatarY + avatarSize : padding

  if (headerEnabled) {
    if (options.showAvatar) {
      defs.push(
        `<clipPath id="avatarClip"><circle cx="${avatarX + avatarSize / 2}" cy="${avatarY + avatarSize / 2}" r="${avatarSize / 2}"/></clipPath>`,
      )
      nodes.push(
        `<circle cx="${avatarX + avatarSize / 2}" cy="${avatarY + avatarSize / 2}" r="${avatarSize / 2}" fill="${options.accent}" opacity="0.14"/>`,
      )
      if (avatarDataUri) {
        nodes.push(
          `<image href="${escapeAttr(avatarDataUri)}" x="${avatarX}" y="${avatarY}" width="${avatarSize}" height="${avatarSize}" preserveAspectRatio="xMidYMid slice" clip-path="url(#avatarClip)"/>`,
        )
      } else {
        nodes.push(
          `<text x="${avatarX + avatarSize / 2}" y="${avatarY + 35}" fill="${options.accent}" class="avatarInitials" text-anchor="middle">${escapeXml(getInitials(profile.name))}</text>`,
        )
      }
      nodes.push(
        `<circle cx="${avatarX + avatarSize - 7}" cy="${avatarY + avatarSize - 7}" r="6" fill="${state === 'active' ? options.accent : options.muted}" stroke="${options.bg}" stroke-width="3"/>`,
      )
    }

    let headerY = avatarY + 17
    let headerTextBottom = avatarY
    if (options.showName) {
      nodes.push(textElement({
        x: headerTextX,
        y: headerY,
        fill: options.fg,
        className: 'name',
        text: truncateText(profile.name || 'Waken', textMaxChars),
      }))
      headerY += 19
      headerTextBottom = headerY - 5
    }
    if (options.showBio && profile.bio) {
      nodes.push(textElement({
        x: headerTextX,
        y: headerY,
        fill: options.muted,
        className: 'bio',
        text: truncateText(profile.bio, textMaxChars),
      }))
      headerY += 18
      headerTextBottom = headerY - 5
    }
    headerBottom = Math.max(headerBottom, headerTextBottom)

    if (options.showNote && profile.note) {
      const noteLineHeight = 17
      const noteLines = wrapTextLines(profile.note, Math.max(24, Math.floor(innerWidth / 7)), 2)
      const noteY = options.showAvatar
        ? Math.max(headerBottom + 16, avatarY + avatarSize + 16)
        : headerBottom + 14
      nodes.push(multilineTextElement({
        x: padding,
        y: noteY,
        fill: options.muted,
        className: 'note',
        lines: noteLines,
        lineHeight: noteLineHeight,
      }))
      headerBottom = noteY + (noteLines.length - 1) * noteLineHeight + 4
    }
  }

  const contentTop = headerEnabled ? headerBottom + 34 : padding + 8
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
  const footerText = STATUS_CARD_DEFAULT_FOOTER_TEXT
  const sectionTitle = truncateText(profile.currentlyText || '当前状态', fullTextMaxChars)
  const detailRows: StatusCardDetailRow[] = []
  if (mediaLine) {
    detailRows.push({ label: '', value: mediaLine, icon: 'music' })
  }
  if (steamLine && !shouldPrioritizeGame) {
    detailRows.push({ label: 'Playing', value: steamLine, icon: 'gamepad' })
  }
  const detailLayouts = detailRows.map((row) => {
    const labelWidth = row.label.length > 0
      ? Math.min(94, Math.max(60, row.label.length * 7 + 36))
      : 0
    const valueWidth = Math.max(40, innerWidth - labelWidth - (row.label.length > 0 ? 26 : 48))
    const maxUnits = Math.max(12, Math.floor(valueWidth / 8))
    return {
      row,
      valueLines: [truncateTextByUnits(row.value, maxUnits)],
      height: 32,
    }
  })
  const reservedFooterHeight = footerText ? 34 : 0
  const sectionTitleText = getSectionTitle(state, sectionTitle)
  const sectionTitleY = contentTop
  const showDeviceSection = state === 'active' && Boolean(deviceLine)
  const deviceCardY = sectionTitleY + 14
  const deviceCardHeight = 38
  const statusCardY = showDeviceSection
    ? deviceCardY + deviceCardHeight + 8
    : sectionTitleY + 14
  const statusIcon = getDisplayStatusIcon({
    state,
    activity,
    statusLine,
    shouldPrioritizeGame,
    shouldUseInClassStatus,
  })
  const deviceIcon = getDisplayDeviceIcon(state, deviceLine, activity)
  const statusDeviceLine = truncateText(deviceLine, fullTextMaxChars)
  const statusTextX = statusIcon ? padding + 42 : padding + 14
  const statusTextWidth = statusIcon ? innerWidth - 58 : innerWidth - 28
  const statusLineMaxUnits = Math.max(16, Math.floor(statusTextWidth / 8.8))
  const statusLines = [truncateTextByUnits(statusLine, statusLineMaxUnits)]
  const statusLineHeight = 18
  const statusCardHeight = 58
  const statusLabelY = showDeviceSection ? deviceCardY - 8 : statusCardY - 8
  const statusTextY = statusCardY + 31
  const statusIconY = statusTextY + ((statusLines.length - 1) * statusLineHeight) / 2 - 10
  const detailRowsHeight = detailLayouts.length > 0
    ? 16 + detailLayouts.reduce((total, item) => total + item.height + 8, 0)
    : 0
  const requiredContentBottom = statusCardY + statusCardHeight + detailRowsHeight
  height = Math.max(height, requiredContentBottom + reservedFooterHeight + padding)
  const contentBottom = height - padding
  const detailsBottom = contentBottom - reservedFooterHeight

  nodes.push(
    `<line x1="${padding}" y1="${contentTop - 22}" x2="${width - padding}" y2="${contentTop - 22}" stroke="${options.border}" stroke-width="1.2" opacity="${headerEnabled ? '0.72' : '0'}"/>`,
  )

  if (showDeviceSection) {
    nodes.push(roundedRectElement({
      x: padding,
      y: deviceCardY,
      width: innerWidth,
      height: deviceCardHeight,
      radius: 12,
      fill: options.bg,
      stroke: options.border,
      opacity: 0.74,
      strokeOpacity: 0.62,
    }))
    nodes.push(iconElement({
      type: deviceIcon,
      x: padding + 12,
      y: deviceCardY + 11,
      size: 16,
      stroke: options.muted,
      opacity: 0.72,
    }))
    nodes.push(textElement({
      x: padding + 36,
      y: deviceCardY + 25,
      fill: options.muted,
      className: 'deviceLine',
      text: statusDeviceLine,
    }))
  }

  nodes.push(roundedRectElement({
    x: padding,
    y: statusCardY,
    width: innerWidth,
    height: statusCardHeight,
    radius: 14,
    fill: options.accent,
    stroke: options.accent,
    opacity: 0.075,
    strokeOpacity: 0.36,
  }))
  nodes.push(
    `<rect x="${padding + 0.5}" y="${statusCardY + 0.5}" width="${innerWidth - 1}" height="${statusCardHeight - 1}" rx="13.5" fill="none" stroke="#0F172A" stroke-opacity="0.11" filter="url(#classicInsetShadow)"/>`,
  )
  nodes.push(
    `<rect x="${padding}" y="${statusCardY + 9}" width="3.5" height="${statusCardHeight - 18}" rx="1.75" fill="${options.accent}" opacity="0.82"/>`,
  )
  nodes.push(
    `<circle cx="${padding + 24}" cy="${statusTextY - 2}" r="16" fill="${options.accent}" opacity="${statusIcon ? '0.1' : '0'}"/>`,
  )
  nodes.push(textElement({
    x: padding + 2,
    y: statusLabelY,
    fill: options.muted,
    className: 'sectionLabel',
    text: sectionTitleText,
  }))
  if (statusIcon) {
    nodes.push(iconElement({
      type: statusIcon,
      x: padding + 15,
      y: statusIconY,
      size: 19,
      stroke: options.accent,
      opacity: 0.88,
    }))
  }
  nodes.push(
    `<text x="${statusTextX}" y="${statusTextY}" fill="${options.fg}" class="status" dominant-baseline="middle">${escapeXml(statusLines[0])}</text>`,
  )

  let detailY = statusCardY + statusCardHeight + 16
  for (const layout of detailLayouts) {
    if (detailY + layout.height > detailsBottom) break
    nodes.push(...detailPillElement({
      x: padding,
      y: detailY,
      width: innerWidth,
      height: layout.height,
      options,
      row: layout.row,
      valueLines: layout.valueLines,
    }))
    detailY += layout.height + 8
  }

  if (footerText && contentBottom - 4 > contentTop + 64) {
    nodes.push(
      `<line x1="${padding}" y1="${contentBottom - 18}" x2="${width - padding}" y2="${contentBottom - 18}" stroke="${options.border}" stroke-width="1.1" opacity="0.66"/>`,
    )
    nodes.push(linkElement(
      statusPageUrl,
      textElement({
        x: padding,
        y: contentBottom + 1,
        fill: options.muted,
        className: 'footer',
        text: truncateText(footerText, fullTextMaxChars),
      }),
    ))
  }

  const ariaLabel = state === 'active'
    ? `${profile.currentlyText || '当前状态'}: ${statusLine}${steamLine ? `. Playing: ${steamLine}` : ''}${mediaLine ? `. Listening: ${mediaLine}` : ''}`
    : statusLine

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttr(ariaLabel)}">`,
    '<style>',
    'text{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;letter-spacing:0}',
    '.sectionLabel{font-size:12px;font-weight:760}',
    '.subLabel,.pillLabel{font-size:11px;font-weight:650}',
    '.status{font-size:15px;font-weight:720;letter-spacing:-.01em}',
    '.pillValue{font-size:13px;font-weight:600}',
    '.deviceLine{font-size:13px;font-weight:600}',
    '.meta,.bio,.note{font-size:13px;font-weight:500}',
    '.footer{font-size:11px;font-weight:600}',
    '.name{font-size:17px;font-weight:700}',
    '.avatarInitials{font-size:17px;font-weight:800}',
    '</style>',
    defs.length ? `<defs>${defs.join('')}</defs>` : '',
    `<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${options.radius}" fill="${options.bg}" stroke="${options.border}" stroke-width="1.35" filter="url(#classicCardShadow)"/>`,
    `<rect x="4.5" y="4.5" width="${width - 9}" height="${height - 9}" rx="${Math.max(0, options.radius - 5)}" fill="none" stroke="#0F172A" stroke-opacity="0.13"/>`,
    `<rect x="1" y="1" width="${width - 2}" height="${Math.max(0, height * 0.45)}" rx="${Math.max(0, options.radius - 1)}" fill="${options.accent}" opacity="0.04"/>`,
    ...nodes,
    '</svg>',
  ].join('')
}
