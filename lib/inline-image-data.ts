export function decodeInlineImageDataUrl(
  rawUrl: string,
): { buffer: Uint8Array; contentType: string } | null {
  const match = /^data:([^,]+),([\s\S]*)$/i.exec(String(rawUrl ?? '').trim())
  if (!match) return null

  const meta = match[1]
  const payload = match[2]
  const parts = meta
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean)
  const mediaType = parts[0]?.toLowerCase() ?? ''
  if (!mediaType.startsWith('image/')) return null

  const contentType = [mediaType, ...parts.slice(1).filter((item) => item.toLowerCase() !== 'base64')].join(';')
  const isBase64 = parts.slice(1).some((item) => item.toLowerCase() === 'base64')

  try {
    const buffer = isBase64
      ? new Uint8Array(Buffer.from(payload.replace(/\s+/g, ''), 'base64'))
      : new TextEncoder().encode(decodeURIComponent(payload))
    return buffer.length > 0 ? { buffer, contentType: contentType || mediaType } : null
  } catch {
    return null
  }
}

export function inlineImageBody(buffer: Uint8Array): ArrayBuffer {
  const copy = Uint8Array.from(buffer)
  return copy.buffer
}
