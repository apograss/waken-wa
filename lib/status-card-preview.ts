import {
  normalizeStatusCardCoverKey,
  normalizeStatusCardSettings,
  normalizeStatusCardTag,
} from '@/lib/status-card-options'
import type {
  StatusCardPreviewDraft,
  StatusCardPreviewSource,
} from '@/types/status-card'

export function ToStatusCardHexColor(value: string, fallback: string): string {
  const normalized = value.trim()
  if (/^#[0-9a-f]{6}$/i.test(normalized)) return normalized.toUpperCase()
  return fallback
}

export function ExtractStatusCardAssetKeyFromImageSourceUrl(value: string): string {
  const normalized = value.trim()
  const match = /\/api\/image-src\/([0-9a-f-]{16,64})/i.exec(normalized)
  return match?.[1] ?? normalizeStatusCardCoverKey(normalized) ?? ''
}

export function GetStatusCardDimensions(
  width: unknown,
  height: unknown,
  radius: unknown,
): {
  width: number
  height: number
  radius: number
} {
  const normalized = normalizeStatusCardSettings({
    statusCardWidth: width,
    statusCardHeight: height,
    statusCardRadius: radius,
  })
  return {
    width: normalized.statusCardWidth,
    height: normalized.statusCardHeight,
    radius: normalized.statusCardRadius,
  }
}

export function FormatStatusCardDimensionValue(value: number | string): string {
  return typeof value === 'string' && value.trim().toLowerCase() === 'auto'
    ? 'auto'
    : String(value)
}

export async function HashStatusCardPreviewText(value: string): Promise<string> {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function BuildStatusCardPreviewPath(
  draft: StatusCardPreviewDraft,
  form: StatusCardPreviewSource,
): string {
  const dimensions = GetStatusCardDimensions(
    form.statusCardWidth,
    form.statusCardHeight,
    form.statusCardRadius,
  )
  const params = new URLSearchParams()
  params.set('variant', form.statusCardVariant)
  const tag = normalizeStatusCardTag(form.statusCardTag)
  if (tag) params.set('tag', tag)

  switch (form.statusCardVariant) {
    case 'signature': {
      const backgroundKey = normalizeStatusCardCoverKey(form.statusCardBackgroundKey) ?? ''
      if (backgroundKey) {
        params.set('bgImage', backgroundKey)
        if (form.statusCardBackgroundRev.trim()) {
          params.set('bgRev', form.statusCardBackgroundRev.trim())
        }
      }
      break
    }
    case 'cover': {
      const coverKey = normalizeStatusCardCoverKey(form.statusCardCoverKey) ?? ''
      if (coverKey) {
        params.set('cover', coverKey)
        if (form.statusCardCoverRev.trim()) {
          params.set('coverRev', form.statusCardCoverRev.trim())
        }
      }
      break
    }
    case 'aurora':
    case 'classic':
      break
  }

  params.set('showHeader', form.statusCardShowHeader ? '1' : '0')
  if (form.statusCardShowHeader) {
    params.set('showAvatar', form.statusCardShowAvatar ? '1' : '0')
    params.set('showName', form.statusCardShowName ? '1' : '0')
    params.set('showBio', form.statusCardShowBio ? '1' : '0')
    params.set('showNote', form.statusCardShowNote ? '1' : '0')
  }
  if (draft.deviceMode !== 'auto' && draft.deviceValue) {
    params.set(draft.deviceMode, draft.deviceValue)
  }
  params.set('preferGame', form.statusCardPreferGame ? '1' : '0')
  params.set('showInClassStatus', form.statusCardShowInClassStatus ? '1' : '0')
  params.set('width', String(dimensions.width))
  params.set('height', String(dimensions.height))
  params.set('radius', String(dimensions.radius))
  params.set('bg', form.statusCardBg)
  if (form.statusCardVariant === 'signature') {
    params.set('signatureBg', form.statusCardSignatureBg)
  }
  params.set('fg', form.statusCardFg)
  params.set('muted', form.statusCardMuted)
  params.set('accent', form.statusCardAccent)
  params.set('border', form.statusCardBorder)
  return `/api/status-card?${params.toString()}`
}

export function EscapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
