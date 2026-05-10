export function getTrimmedText(value: unknown, fallback = ''): string {
  const text = typeof value === 'string' ? value : fallback
  return text.replace(/\s+/g, ' ').trim()
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function escapeAttr(value: string): string {
  return escapeXml(value)
}

export function truncateText(value: string, maxChars: number): string {
  const text = getTrimmedText(value)
  if (text.length <= maxChars) return text
  return `${text.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`
}

export function truncateTextByUnits(value: string, maxUnits: number): string {
  const text = getTrimmedText(value)
  if (!text) return ''

  let currentUnits = 0
  let output = ''
  for (const char of Array.from(text)) {
    const units = getTextUnit(char)
    if (output && currentUnits + units > maxUnits) {
      return `${output.trimEnd()}…`
    }
    if (!output && units > maxUnits) {
      return '…'
    }
    output += char
    currentUnits += units
  }
  return output
}

function getTextUnit(char: string): number {
  const codePoint = char.codePointAt(0) ?? 0
  if (
    codePoint > 0xffff ||
    (codePoint >= 0x1100 && codePoint <= 0x11ff) ||
    (codePoint >= 0x2e80 && codePoint <= 0xa4cf) ||
    (codePoint >= 0xac00 && codePoint <= 0xd7af) ||
    (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
    (codePoint >= 0xff01 && codePoint <= 0xff60)
  ) {
    return 2
  }
  if (/\s/.test(char)) return 0.5
  return 1
}

export function estimateTextUnits(value: string): number {
  return Array.from(getTrimmedText(value)).reduce((total, char) => total + getTextUnit(char), 0)
}

export function wrapTextLines(value: string, maxUnits: number, maxLines: number): string[] {
  const source = getTrimmedText(value)
  if (!source) return []

  const lines: string[] = []
  let line = ''
  let lineUnits = 0
  for (const char of Array.from(source)) {
    const units = getTextUnit(char)
    if (line && lineUnits + units > maxUnits) {
      lines.push(line.trimEnd())
      line = ''
      lineUnits = 0
      if (lines.length >= maxLines) break
    }
    line += char
    lineUnits += units
  }
  if (line && lines.length < maxLines) {
    lines.push(line.trimEnd())
  }

  const consumed = lines.join('').length
  if (consumed < source.length && lines.length > 0) {
    const lastIndex = lines.length - 1
    lines[lastIndex] = `${lines[lastIndex]!.replace(/\s+$/, '').replace(/.$/u, '')}…`
  }
  return lines
}
