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

export function renderAuroraStatusCardSvg({
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
  const padding = Math.max(20, Math.min(32, Math.round(width * 0.055)))
  const innerWidth = width - padding * 2
  const fullTextMaxChars = Math.max(18, Math.floor(innerWidth / 8))
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
  const sectionTitle = getSectionTitle(
    state,
    truncateText(profile.currentlyText || '当前状态', fullTextMaxChars),
  )
  const statusIcon = getDisplayStatusIcon({
    state,
    activity,
    statusLine,
    shouldPrioritizeGame,
    shouldUseInClassStatus,
    inactiveFallback: 'hourglass',
  }) ?? 'hourglass'
  const deviceIcon = getDisplayDeviceIcon(state, deviceLine, activity)
  const detailRows: StatusCardDetailRow[] = [
    { label: '', value: deviceLine, icon: deviceIcon },
  ]
  if (mediaLine) {
    detailRows.push({ label: '', value: mediaLine, icon: 'music' })
  }
  if (steamLine && !shouldPrioritizeGame) {
    detailRows.push({ label: 'Game', value: steamLine, icon: 'gamepad' })
  }

  const nodes: string[] = []
  const defs: string[] = [
    `<linearGradient id="auroraBg" x1="0" y1="0" x2="${width}" y2="${options.height}">
      <stop offset="0%" stop-color="${options.accent}" stop-opacity="0.18"/>
      <stop offset="46%" stop-color="${options.bg}"/>
      <stop offset="100%" stop-color="${options.bg}"/>
    </linearGradient>`,
    `<radialGradient id="auroraGlowA" cx="18%" cy="10%" r="75%">
      <stop offset="0%" stop-color="${options.accent}" stop-opacity="0.34"/>
      <stop offset="46%" stop-color="${options.accent}" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="${options.accent}" stop-opacity="0"/>
    </radialGradient>`,
    `<radialGradient id="auroraGlowB" cx="88%" cy="82%" r="72%">
      <stop offset="0%" stop-color="${options.muted}" stop-opacity="0.2"/>
      <stop offset="58%" stop-color="${options.muted}" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="${options.muted}" stop-opacity="0"/>
    </radialGradient>`,
    `<linearGradient id="auroraSheen" x1="0" y1="0" x2="${width}" y2="0">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0"/>
      <stop offset="42%" stop-color="#FFFFFF" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
    </linearGradient>`,
    '<filter id="auroraShadow" x="-16%" y="-18%" width="132%" height="140%"><feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#0F172A" flood-opacity="0.14"/></filter>',
  ]

  let cursorY = padding
  if (options.showHeader) {
    const avatarSize = 58
    const avatarX = padding
    const avatarY = padding
    const headerTextX = options.showAvatar ? avatarX + avatarSize + 16 : padding
    const headerTextMaxChars = Math.max(16, Math.floor((width - headerTextX - padding) / 7.6))

    if (options.showAvatar) {
      defs.push(
        `<clipPath id="auroraAvatarClip"><circle cx="${avatarX + avatarSize / 2}" cy="${avatarY + avatarSize / 2}" r="${avatarSize / 2}"/></clipPath>`,
      )
      nodes.push(
        `<circle cx="${avatarX + avatarSize / 2}" cy="${avatarY + avatarSize / 2}" r="${avatarSize / 2 + 5}" fill="${options.accent}" opacity="0.13"/>`,
      )
      nodes.push(
        `<circle cx="${avatarX + avatarSize / 2}" cy="${avatarY + avatarSize / 2}" r="${avatarSize / 2 + 1}" fill="#FFFFFF" opacity="0.72"/>`,
      )
      if (avatarDataUri) {
        nodes.push(
          `<image href="${escapeAttr(avatarDataUri)}" x="${avatarX}" y="${avatarY}" width="${avatarSize}" height="${avatarSize}" preserveAspectRatio="xMidYMid slice" clip-path="url(#auroraAvatarClip)"/>`,
        )
      } else {
        nodes.push(
          `<text x="${avatarX + avatarSize / 2}" y="${avatarY + 38}" fill="${options.accent}" class="auroraAvatarInitials" text-anchor="middle">${escapeXml(getInitials(profile.name))}</text>`,
        )
      }
      nodes.push(
        `<circle cx="${avatarX + avatarSize - 6}" cy="${avatarY + avatarSize - 8}" r="6.5" fill="${state === 'active' ? options.accent : options.muted}" stroke="${options.bg}" stroke-width="3"/>`,
      )
    }

    let headerTextY = avatarY + 17
    if (options.showName) {
      nodes.push(textElement({
        x: headerTextX,
        y: headerTextY,
        fill: options.fg,
        className: 'auroraName',
        text: truncateText(profile.name || 'Waken', headerTextMaxChars),
      }))
      headerTextY += 21
    }
    if (options.showBio && profile.bio) {
      nodes.push(textElement({
        x: headerTextX,
        y: headerTextY,
        fill: options.muted,
        className: 'auroraBio',
        text: truncateText(profile.bio, headerTextMaxChars),
      }))
      headerTextY += 19
    }
    cursorY = Math.max(avatarY + avatarSize, headerTextY) + 22

    if (options.showNote && profile.note) {
      const noteLines = wrapTextLines(profile.note, Math.max(22, Math.floor(innerWidth / 7.4)), 2)
      nodes.push(
        roundedRectElement({
          x: padding,
          y: cursorY - 4,
          width: innerWidth,
          height: noteLines.length > 1 ? 52 : 34,
          radius: 14,
          fill: '#FFFFFF',
          stroke: options.border,
          opacity: 0.38,
          strokeOpacity: 0.44,
        }),
      )
      nodes.push(multilineTextElement({
        x: padding + 14,
        y: cursorY + 17,
        fill: options.muted,
        className: 'auroraNote',
        lines: noteLines,
        lineHeight: 17,
      }))
      cursorY += noteLines.length > 1 ? 62 : 44
    }
  }

  const heroY = cursorY
  const heroHeight = 94
  const heroIconX = padding + 20
  const heroIconY = heroY + 35
  const heroTextX = padding + 58
  const heroTextWidth = innerWidth - 76
  const statusTextMaxUnits = Math.max(18, Math.floor((innerWidth - 76) / 9.2))
  nodes.push(
    `<rect x="${padding}" y="${heroY}" width="${innerWidth}" height="${heroHeight}" rx="22" fill="#FFFFFF" opacity="0.48" stroke="${options.border}" stroke-opacity="0.5" filter="url(#auroraShadow)"/>`,
  )
  nodes.push(
    `<rect x="${padding + 1}" y="${heroY + 1}" width="${innerWidth - 2}" height="${Math.floor(heroHeight * 0.52)}" rx="21" fill="url(#auroraSheen)" opacity="0.75"/>`,
  )
  nodes.push(
    `<rect x="${heroIconX - 4}" y="${heroIconY - 4}" width="28" height="28" rx="10" fill="${options.accent}" opacity="0.12"/>`,
  )
  nodes.push(iconElement({
    type: statusIcon,
    x: heroIconX,
    y: heroIconY,
    size: 20,
    stroke: options.accent,
    opacity: 0.88,
  }))
  nodes.push(textElement({
    x: heroTextX,
    y: heroY + 35,
    fill: options.muted,
    className: 'auroraKicker',
    text: sectionTitle,
  }))
  nodes.push(multilineTextElement({
    x: heroTextX,
    y: heroY + 62,
    fill: options.fg,
    className: 'auroraStatus',
    lines: [truncateTextByUnits(statusLine, Math.max(18, Math.floor(heroTextWidth / 9.2)))],
    lineHeight: 22,
    dominantBaseline: 'middle',
  }))

  let detailY = heroY + heroHeight + 14
  const detailHeight = 36
  const footerHeight = 28
  const minHeight = detailY + detailRows.length * (detailHeight + 8) + footerHeight + padding
  const height = Math.max(options.height, minHeight, options.showHeader ? 310 : 218)
  const detailBottom = height - padding - footerHeight
  for (const row of detailRows) {
    if (detailY + detailHeight > detailBottom) break
    const showLabel = row.label.length > 0
    const labelWidth = showLabel ? Math.min(104, Math.max(60, row.label.length * 6.8 + 34)) : 0
    const valueX = showLabel ? padding + labelWidth + 18 : padding + 38
    const valueMaxUnits = Math.max(12, Math.floor((innerWidth - labelWidth - (showLabel ? 52 : 44)) / 8))
    nodes.push(
      `<rect x="${padding}" y="${detailY}" width="${innerWidth}" height="${detailHeight}" rx="18" fill="${options.bg}" opacity="0.58" stroke="${options.border}" stroke-opacity="0.42"/>`,
    )
    nodes.push(iconElement({
      type: row.icon,
      x: padding + 14,
      y: detailY + 10,
      size: 16,
      stroke: row.icon === 'music' || row.icon === 'gamepad' ? options.accent : options.muted,
      opacity: 0.82,
    }))
    if (showLabel) {
      nodes.push(textElement({
        x: padding + 38,
        y: detailY + 23,
        fill: options.muted,
        className: 'auroraPillLabel',
        text: row.label,
      }))
    }
    nodes.push(textElement({
      x: valueX,
      y: detailY + 23,
      fill: options.fg,
      className: 'auroraPillValue',
      text: truncateTextByUnits(row.value, valueMaxUnits),
    }))
    detailY += detailHeight + 8
  }

  const footerY = height - padding + 1
  nodes.push(
    `<line x1="${padding}" y1="${footerY - 19}" x2="${width - padding}" y2="${footerY - 19}" stroke="${options.border}" stroke-width="1" opacity="0.42"/>`,
  )
  nodes.push(linkElement(
    statusPageUrl,
    textElement({
      x: padding,
      y: footerY,
      fill: options.muted,
      className: 'auroraFooter',
      text: truncateText(STATUS_CARD_DEFAULT_FOOTER_TEXT, fullTextMaxChars),
    }),
  ))
  nodes.push(
    `<circle cx="${padding + 126}" cy="${footerY - 4}" r="3.5" fill="${state === 'active' ? options.accent : options.muted}" opacity="0.72"/>`,
  )

  const ariaLabel = state === 'active'
    ? `${profile.currentlyText || '当前状态'}: ${statusLine}${steamLine ? `. Playing: ${steamLine}` : ''}${mediaLine ? `. Listening: ${mediaLine}` : ''}`
    : statusLine

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttr(ariaLabel)}">`,
    '<style>',
    'text{font-family:"SF Pro Rounded","Segoe UI",ui-rounded,-apple-system,BlinkMacSystemFont,sans-serif;letter-spacing:0}',
    '.auroraKicker{font-size:11px;font-weight:780;letter-spacing:.12em;text-transform:uppercase}',
    '.auroraStatus{font-size:17px;font-weight:760;letter-spacing:-.01em}',
    '.auroraName{font-size:18px;font-weight:800;letter-spacing:-.01em}',
    '.auroraBio,.auroraNote{font-size:13px;font-weight:560}',
    '.auroraPillLabel{font-size:11px;font-weight:760;letter-spacing:.04em}',
    '.auroraPillValue{font-size:13px;font-weight:680}',
    '.auroraFooter{font-size:10.5px;font-weight:700;letter-spacing:.03em}',
    '.auroraAvatarInitials{font-size:18px;font-weight:850}',
    '</style>',
    `<defs>${defs.join('')}</defs>`,
    `<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${options.radius}" fill="url(#auroraBg)" stroke="${options.border}" stroke-opacity="0.72"/>`,
    `<rect x="0" y="0" width="${width}" height="${height}" rx="${options.radius}" fill="url(#auroraGlowA)"/>`,
    `<rect x="0" y="0" width="${width}" height="${height}" rx="${options.radius}" fill="url(#auroraGlowB)"/>`,
    `<path d="M${Math.round(width * 0.56)} -18 C ${Math.round(width * 0.76)} ${Math.round(height * 0.18)}, ${Math.round(width * 0.32)} ${Math.round(height * 0.36)}, ${width + 22} ${Math.round(height * 0.58)}" fill="none" stroke="${options.accent}" stroke-width="28" stroke-opacity="0.055" stroke-linecap="round"/>`,
    ...nodes,
    '</svg>',
  ].join('')
}
