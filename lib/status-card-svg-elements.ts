import {
  escapeAttr,
  escapeXml,
} from '@/lib/status-card-text'
import type {
  StatusCardDetailRow,
  StatusCardIcon,
  StatusCardOptions,
} from '@/types/status-card'

export function textElement({
  x,
  y,
  fill,
  className,
  text,
  anchor = 'start',
}: {
  x: number
  y: number
  fill: string
  className: string
  text: string
  anchor?: 'start' | 'middle' | 'end'
}): string {
  return `<text x="${x}" y="${y}" fill="${fill}" class="${className}" text-anchor="${anchor}">${escapeXml(text)}</text>`
}

export function roundedRectElement({
  x,
  y,
  width,
  height,
  radius,
  fill,
  stroke,
  opacity = 1,
  strokeOpacity = 1,
}: {
  x: number
  y: number
  width: number
  height: number
  radius: number
  fill: string
  stroke?: string
  opacity?: number
  strokeOpacity?: number
}): string {
  return [
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}"`,
    ` fill="${fill}" opacity="${opacity}"`,
    stroke ? ` stroke="${stroke}" stroke-opacity="${strokeOpacity}"` : '',
    '/>',
  ].join('')
}

export function iconElement({
  type,
  x,
  y,
  size,
  stroke,
  opacity = 1,
}: {
  type: StatusCardIcon
  x: number
  y: number
  size: number
  stroke: string
  opacity?: number
}): string {
  const common = `fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"`
  const paths: Record<StatusCardIcon, string> = {
    app: [
      '<rect x="3" y="5" width="18" height="14" rx="2"/>',
      '<path d="M3 9h18"/>',
      '<path d="M8 14h.01"/>',
      '<path d="M12 14h4"/>',
    ].join(''),
    bookOpen: [
      '<path d="M12 7v14"/>',
      '<path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3Z"/>',
    ].join(''),
    desktop: [
      '<rect x="3" y="4" width="18" height="12" rx="2"/>',
      '<path d="M8 20h8"/>',
      '<path d="M12 16v4"/>',
    ].join(''),
    gamepad: [
      '<path d="M6 11h4"/>',
      '<path d="M8 9v4"/>',
      '<path d="M15 12h.01"/>',
      '<path d="M18 10h.01"/>',
      '<path d="M17.3 6H6.7a4 4 0 0 0-3.9 3.2l-1 5A3 3 0 0 0 6.7 17L9 15h6l2.3 2a3 3 0 0 0 4.9-2.8l-1-5A4 4 0 0 0 17.3 6Z"/>',
    ].join(''),
    hourglass: [
      '<path d="M5 22h14"/>',
      '<path d="M5 2h14"/>',
      '<path d="M17 22v-4.2a4 4 0 0 0-1.2-2.8L13 12l2.8-3a4 4 0 0 0 1.2-2.8V2"/>',
      '<path d="M7 2v4.2A4 4 0 0 0 8.2 9L11 12l-2.8 3A4 4 0 0 0 7 17.8V22"/>',
    ].join(''),
    lock: [
      '<rect x="3" y="11" width="18" height="11" rx="2"/>',
      '<path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    ].join(''),
    mobile: [
      '<rect x="7" y="2" width="10" height="20" rx="2"/>',
      '<path d="M11 18h2"/>',
    ].join(''),
    moon: [
      '<path d="M12 3a6 6 0 0 0 9 7.5A9 9 0 1 1 12 3Z"/>',
    ].join(''),
    music: [
      '<path d="M9 18V5l12-2v13"/>',
      '<circle cx="6" cy="18" r="3"/>',
      '<circle cx="18" cy="16" r="3"/>',
    ].join(''),
    tablet: [
      '<rect x="5" y="2" width="14" height="20" rx="2"/>',
      '<path d="M12 18h.01"/>',
    ].join(''),
  }
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" ${common}>${paths[type]}</svg>`
}

export function multilineTextElement({
  x,
  y,
  fill,
  className,
  lines,
  lineHeight,
  dominantBaseline,
  textAnchor,
}: {
  x: number
  y: number
  fill: string
  className: string
  lines: string[]
  lineHeight: number
  dominantBaseline?: 'middle'
  textAnchor?: 'start' | 'middle' | 'end'
}): string {
  const tspans = lines
    .map((line, index) => (
      `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`
    ))
    .join('')
  const baselineAttr = dominantBaseline ? ` dominant-baseline="${dominantBaseline}"` : ''
  const anchorAttr = textAnchor ? ` text-anchor="${textAnchor}"` : ''
  return `<text x="${x}" y="${y}" fill="${fill}" class="${className}"${baselineAttr}${anchorAttr}>${tspans}</text>`
}

export function linkElement(href: string, child: string): string {
  return `<a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer">${child}</a>`
}

export function detailPillElement({
  x,
  y,
  width,
  height,
  options,
  row,
  valueLines,
}: {
  x: number
  y: number
  width: number
  height: number
  options: StatusCardOptions
  row: StatusCardDetailRow
  valueLines: string[]
}): string[] {
  const showLabel = row.label.length > 0
  const valueX = showLabel ? x + Math.min(94, Math.max(60, row.label.length * 7 + 36)) + 12 : x + 34
  return [
    roundedRectElement({
      x,
      y,
      width,
      height,
      radius: 12,
      fill: options.bg,
      stroke: options.border,
      opacity: 0.72,
      strokeOpacity: 0.62,
    }),
    iconElement({
      type: row.icon,
      x: x + 10,
      y: y + 8,
      size: 16,
      stroke: options.accent,
      opacity: 0.92,
    }),
    showLabel
      ? textElement({
          x: x + 34,
          y: y + 20,
          fill: options.muted,
          className: 'pillLabel',
          text: row.label,
        })
      : '',
    multilineTextElement({
      x: valueX,
      y: y + 20,
      fill: options.fg,
      className: 'pillValue',
      lines: valueLines,
      lineHeight: 17,
    }),
  ]
}
