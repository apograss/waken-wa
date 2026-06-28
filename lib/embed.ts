'use client'

import { useSyncExternalStore } from 'react'

/**
 * Whether the current document is running inside an iframe (e.g. embedded as a
 * browser new-tab page). Cross-origin access to `window.top` throws, which
 * itself means we are embedded in a different-origin parent.
 */
export function isEmbedded(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.self !== window.top
  } catch {
    return true
  }
}

/**
 * Navigate the top-level browsing context when embedded, otherwise the current
 * window. Setting `top.location` is permitted cross-origin when triggered by a
 * user gesture (search submit, link click), so this breaks search/links out of
 * the embedding frame into the full tab.
 */
export function navigateTopLevel(url: string): void {
  if (typeof window === 'undefined') return
  if (isEmbedded()) {
    try {
      if (window.top) {
        window.top.location.href = url
        return
      }
    } catch {
      // Fall back to in-frame navigation if the browser blocks it.
    }
  }
  window.location.href = url
}

/** React hook returning whether the document is embedded in an iframe. */
const subscribeNoop = () => () => {}

export function useIsEmbedded(): boolean {
  return useSyncExternalStore(
    subscribeNoop,
    () => isEmbedded(),
    () => false,
  )
}
