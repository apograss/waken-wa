/**
 * 极简移动端 UA 判断（服务端用）。
 * 仅用于首页选择渲染移动版还是桌面版，不做精细设备识别。
 */
const MOBILE_UA_RE = /Android|iPhone|iPod|Windows Phone|BlackBerry|IEMobile|Opera Mini|Mobile/i
const TABLET_UA_RE = /iPad|Tablet|PlayBook|Silk/i

export function isMobileUserAgent(userAgent: string | null | undefined): boolean {
  const ua = (userAgent ?? '').trim()
  if (!ua) return false
  // iPad 等平板按桌面处理（屏幕够大）
  if (TABLET_UA_RE.test(ua)) return false
  return MOBILE_UA_RE.test(ua)
}
