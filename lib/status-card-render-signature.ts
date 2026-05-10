import 'server-only'

import {
  STATUS_CARD_DEFAULT_FOOTER_TEXT,
  STATUS_CARD_SIGNATURE_HEIGHT,
} from '@/constants/status-card'
import {
  getDisplayDeviceIcon,
  getInitials,
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
import type { StatusCardSignatureRenderParams } from '@/types/status-card'

export function renderSignatureStatusCardSvg({
  options,
  profile,
  activity,
  avatarDataUri,
  backgroundDataUri,
  inClassStatusActive = false,
  inClassOccurrence,
  statusPageUrl,
  state,
}: StatusCardSignatureRenderParams): string {
  const width = 700
  const height = STATUS_CARD_SIGNATURE_HEIGHT
  const avatarSize = 58
  const leftInset = 36
  const leftWidth = 270
  const dividerX = leftWidth
  const rightX = dividerX + 28
  const rightWidth = width - rightX - 34
  const leftCenterX = leftWidth / 2
  const leftTextWidth = leftWidth - leftInset * 2
  const avatarX = leftCenterX - avatarSize / 2
  const avatarY = 30
  const nameY = 116
  const tagPillY = 124
  const bioY = options.tag ? tagPillY + 40 : nameY + 25
  const centerY = height / 2
  const statusPanelY = 36
  const statusPanelHeight = 58
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
  const deviceIcon = getDisplayDeviceIcon(state, deviceLine, activity)
  const defs: string[] = [
    `<linearGradient id="signatureBg" x1="0" y1="0" x2="${width}" y2="${height}">
      <stop offset="0%" stop-color="${options.signatureBg}"/>
      <stop offset="58%" stop-color="${options.signatureBg}"/>
      <stop offset="100%" stop-color="${options.bg}"/>
    </linearGradient>`,
    `<linearGradient id="signatureBeam" x1="74" y1="0" x2="${width - 74}" y2="${height}">
      <stop offset="0%" stop-color="${options.bg}" stop-opacity="0"/>
      <stop offset="42%" stop-color="#A78BFA" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="#F9A8D4" stop-opacity="0.08"/>
    </linearGradient>`,
    `<linearGradient id="signatureDividerFade" x1="${dividerX}" y1="44" x2="${dividerX}" y2="${height - 38}">
      <stop offset="0%" stop-color="#C4B5FD" stop-opacity="0"/>
      <stop offset="18%" stop-color="#C4B5FD" stop-opacity="0.5"/>
      <stop offset="82%" stop-color="#C4B5FD" stop-opacity="0.38"/>
      <stop offset="100%" stop-color="#C4B5FD" stop-opacity="0"/>
    </linearGradient>`,
    `<linearGradient id="signaturePanel" x1="${rightX}" y1="${statusPanelY}" x2="${rightX + rightWidth}" y2="${statusPanelY + statusPanelHeight}">
      <stop offset="0%" stop-color="${options.bg}" stop-opacity="0.96"/>
      <stop offset="58%" stop-color="${options.bg}" stop-opacity="0.84"/>
      <stop offset="100%" stop-color="#A78BFA" stop-opacity="0.08"/>
    </linearGradient>`,
    '<filter id="signatureShadow" x="-8%" y="-18%" width="116%" height="136%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#0F172A" flood-opacity="0.1"/></filter>',
    '<filter id="signatureMetaShadow" x="-4%" y="-40%" width="108%" height="180%"><feDropShadow dx="0" dy="1.5" stdDeviation="1.6" flood-color="#1E1B4B" flood-opacity="0.1"/></filter>',
    '<filter id="signatureAvatarGlow" x="-70%" y="-70%" width="240%" height="240%"><feGaussianBlur stdDeviation="12" result="blur"/><feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.55 0 0 0 0 0.42 0 0 0 0 0.95 0 0 0 0.28 0"/></filter>',
    `<clipPath id="signatureCardClip"><rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${options.radius}"/></clipPath>`,
    `<clipPath id="signatureAvatarClip"><circle cx="${avatarX + avatarSize / 2}" cy="${avatarY + avatarSize / 2}" r="${avatarSize / 2}"/></clipPath>`,
  ]
  const nodes: string[] = []

  nodes.push(
    `<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${options.radius}" fill="url(#signatureBg)" stroke="#D9CCFF" stroke-width="1.2" filter="url(#signatureShadow)"/>`,
  )
  if (backgroundDataUri) {
    nodes.push(
      `<image href="${escapeAttr(backgroundDataUri)}" x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" preserveAspectRatio="xMidYMid slice" opacity="0.34" clip-path="url(#signatureCardClip)"/>`,
    )
    nodes.push(`<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${options.radius}" fill="${options.signatureBg}" opacity="0.34"/>`)
    nodes.push(`<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${options.radius}" fill="url(#signatureBg)" opacity="0.48"/>`)
  }
  nodes.push(`<path d="M82 -18 C178 72 286 91 425 34 C518 -4 601 14 726 90 L726 0 L82 0 Z" fill="url(#signatureBeam)" opacity="0.68"/>`)
  nodes.push(`<circle cx="${width - 104}" cy="44" r="54" fill="#F9A8D4" opacity="0.12"/>`)
  nodes.push(`<circle cx="${width - 58}" cy="86" r="34" fill="#A78BFA" opacity="0.1"/>`)
  nodes.push(`<path d="M${width - 188} 34 C ${width - 138} 20, ${width - 90} 31, ${width - 42} 18" fill="none" stroke="#FFFFFF" stroke-width="1.4" stroke-linecap="round" opacity="0.5"/>`)
  nodes.push(
    `<line x1="${dividerX}" y1="44" x2="${dividerX}" y2="${height - 38}" stroke="url(#signatureDividerFade)" stroke-width="1.2"/>`,
  )

  nodes.push(`<circle cx="${avatarX + avatarSize / 2}" cy="${avatarY + avatarSize / 2}" r="41" fill="#8B5CF6" opacity="0.42" filter="url(#signatureAvatarGlow)"/>`)
  nodes.push(`<circle cx="${avatarX + avatarSize / 2 - 16}" cy="${avatarY + avatarSize / 2 - 14}" r="18" fill="#C4B5FD" opacity="0.24"/>`)
  nodes.push(`<circle cx="${avatarX + avatarSize / 2}" cy="${avatarY + avatarSize / 2}" r="${avatarSize / 2 + 3}" fill="${options.bg}" opacity="0.8"/>`)
  nodes.push(`<circle cx="${avatarX + avatarSize / 2}" cy="${avatarY + avatarSize / 2}" r="${avatarSize / 2}" fill="${options.accent}" opacity="0.16"/>`)
  if (avatarDataUri) {
    nodes.push(
      `<image href="${escapeAttr(avatarDataUri)}" x="${avatarX}" y="${avatarY}" width="${avatarSize}" height="${avatarSize}" preserveAspectRatio="xMidYMid slice" clip-path="url(#signatureAvatarClip)"/>`,
    )
  } else {
    nodes.push(
      `<text x="${avatarX + avatarSize / 2}" y="${avatarY + 34}" fill="${options.accent}" class="signatureAvatarInitials" text-anchor="middle">${escapeXml(getInitials(profile.name))}</text>`,
    )
  }

  const leftTextX = leftInset
  const leftTextMaxChars = Math.max(18, Math.floor(leftTextWidth / 7.4))
  const tagText = options.tag
  nodes.push(textElement({
    x: leftCenterX,
    y: nameY,
    fill: options.fg,
    className: 'signatureName',
    text: truncateText(profile.name || 'Waken', leftTextMaxChars),
    anchor: 'middle',
  }))
  if (tagText) {
    const tagMaxChars = Math.max(10, Math.floor(leftTextWidth / 6.8))
    const tagPillWidth = 112
    const tagPillX = leftCenterX - tagPillWidth / 2
    nodes.push(`<rect x="${tagPillX}" y="${tagPillY}" width="${tagPillWidth}" height="24" rx="12" fill="#FFFFFF" opacity="0.36" stroke="#8B5CF6" stroke-width="0.8" stroke-opacity="0.54" filter="url(#signatureMetaShadow)"/>`)
    nodes.push(`<svg x="${tagPillX + 17}" y="${tagPillY + 7}" width="10" height="10" viewBox="0 0 512 512" aria-hidden="true" fill="#8B5CF6" opacity="0.74"><path d="M0 252.118V48C0 21.49 21.49 0 48 0h204.118a48 48 0 0 1 33.941 14.059l211.882 211.882c18.745 18.745 18.745 49.137 0 67.882L293.823 497.941c-18.745 18.745-49.137 18.745-67.882 0L14.059 286.059A48 48 0 0 1 0 252.118zM112 64c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.49-48-48-48z"/></svg>`)
    nodes.push(textElement({
      x: tagPillX + 36,
      y: tagPillY + 16.5,
      fill: '#7C3AED',
      className: 'signatureTag',
      text: truncateText(tagText, tagMaxChars),
    }))
  }
  if (profile.bio) {
    nodes.push(multilineTextElement({
      x: leftCenterX,
      y: bioY,
      fill: options.muted,
      className: 'signatureBio',
      lines: wrapTextLines(profile.bio, Math.max(26, Math.floor(leftTextWidth / 5.8)), 2),
      lineHeight: 14,
      textAnchor: 'middle',
    }))
  }
  const statusContentX = rightX + 34
  nodes.push(
    `<rect x="${rightX}" y="${statusPanelY}" width="${rightWidth}" height="${statusPanelHeight}" rx="12" fill="url(#signaturePanel)" stroke="#A78BFA" stroke-opacity="0.86"/>`,
  )
  nodes.push(`<rect x="${rightX + 1}" y="${statusPanelY + 1}" width="${rightWidth - 2}" height="${statusPanelHeight - 2}" rx="11" fill="#FFFFFF" opacity="0.18"/>`)
  nodes.push(`<path d="M${rightX + 16} ${statusPanelY + 1} H${rightX + rightWidth - 18}" stroke="#FFFFFF" stroke-width="1" stroke-linecap="round" opacity="0.62"/>`)
  nodes.push(`<circle cx="${rightX + 18}" cy="${statusPanelY + statusPanelHeight / 2}" r="3.2" fill="${options.accent}" opacity="0.9"/>`)
  nodes.push(textElement({
    x: statusContentX,
    y: statusPanelY + 20,
    fill: options.muted,
    className: 'signatureKicker',
    text: truncateText(profile.currentlyText || '当前状态', Math.max(12, Math.floor((rightWidth - 44) / 8))),
  }))
  nodes.push(multilineTextElement({
    x: statusContentX,
    y: statusPanelY + 40,
    fill: options.fg,
    className: 'signatureStatus',
    lines: [truncateTextByUnits(statusLine, Math.max(30, Math.floor((rightWidth - 44) / 7.2)))],
    lineHeight: 20,
    dominantBaseline: 'middle',
  }))

  const metaItems = [
    { value: deviceLine, icon: deviceIcon },
    ...(mediaLine ? [{ value: mediaLine, icon: 'music' as const }] : []),
    ...(steamLine && !shouldPrioritizeGame ? [{ value: steamLine, icon: 'gamepad' as const }] : []),
  ].slice(0, 2)
  const metaY = statusPanelY + statusPanelHeight + 12
  const metaPillHeight = 30
  const metaRowGap = 7
  for (const [index, item] of metaItems.entries()) {
    const itemTop = metaY + index * (metaPillHeight + metaRowGap)
    const itemCenterY = itemTop + metaPillHeight / 2
    const itemWidth = rightWidth
    const iconColor = item.icon === 'music' || item.icon === 'gamepad' ? '#8B5CF6' : '#A78BFA'
    nodes.push(
      `<rect x="${rightX}" y="${itemTop}" width="${itemWidth}" height="${metaPillHeight}" rx="12" fill="#FFFFFF" opacity="0.38" stroke="#8B5CF6" stroke-width="1" stroke-opacity="0.78" filter="url(#signatureMetaShadow)"/>`,
    )
    nodes.push(iconElement({
      type: item.icon,
      x: rightX + 12,
      y: itemCenterY - 6,
      size: 12,
      stroke: iconColor,
      opacity: 0.68,
    }))
    nodes.push(textElement({
      x: rightX + 32,
      y: itemCenterY + 3.5,
      fill: '#7C3AED',
      className: 'signatureMeta',
      text: truncateTextByUnits(item.value, Math.max(10, Math.floor((itemWidth - 44) / 5.7))),
    }))
  }

  nodes.push(linkElement(
    statusPageUrl,
    [
      `<line x1="${width - 102}" y1="${height - 20}" x2="${width - 88}" y2="${height - 20}" stroke="#E8B4A0" stroke-width="1.4" stroke-linecap="round" opacity="0.6"/>`,
      textElement({
        x: width - 34,
        y: height - 16,
        fill: options.muted,
        className: 'signatureFooter',
        text: truncateText(STATUS_CARD_DEFAULT_FOOTER_TEXT, Math.max(22, Math.floor(rightWidth / 7.5))),
        anchor: 'end',
      }),
    ].join(''),
  ))

  const ariaLabel = state === 'active'
    ? `${profile.currentlyText || '当前状态'}: ${statusLine}${steamLine ? `. Playing: ${steamLine}` : ''}${mediaLine ? `. Listening: ${mediaLine}` : ''}`
    : statusLine

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttr(ariaLabel)}">`,
    '<style>',
    'text{font-family:"SF Pro Rounded","Segoe UI",ui-rounded,-apple-system,BlinkMacSystemFont,sans-serif;letter-spacing:0}',
    '.signatureName{font-size:15px;font-weight:800;letter-spacing:-.01em}',
    '.signatureTag{font-size:11px;font-weight:720}',
    '.signatureBio{font-size:11.5px;font-weight:660}',
    '.signatureKicker{font-size:10px;font-weight:780;letter-spacing:.02em}',
    '.signatureStatus{font-size:14.4px;font-weight:800;letter-spacing:-.01em}',
    '.signatureMeta{font-size:10px;font-weight:650}',
    '.signatureFooter{font-size:10px;font-weight:680;letter-spacing:.02em}',
    '.signatureAvatarInitials{font-size:17px;font-weight:850}',
    '</style>',
    `<defs>${defs.join('')}</defs>`,
    ...nodes,
    '</svg>',
  ].join('')
}
