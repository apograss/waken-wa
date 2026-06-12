/** Admin users list from GET /api/admin/users (JSON). */
export interface AdminUserRow {
  id: number
  username: string
  createdAt: string
}

export type ToolMode = 'skills' | 'mcp'

export interface RecentDeviceRow {
  displayName: string
  generatedHashKey: string
  lastSeenAt: string | null
}

/** API tokens list row (serialized dates). */
export interface ApiTokenListRow {
  id: number
  name: string
  token: string
  isActive: boolean
  bypassSecondaryReview?: boolean
  bypassSecondaryReviewFirstUseOnly?: boolean
  createdAt: string
  lastUsedAt: string | null
  recentDevices?: RecentDeviceRow[]
}

export interface AdminTokenOption {
  id: number
  name: string
  isActive: boolean
  bypassSecondaryReview?: boolean
  bypassSecondaryReviewFirstUseOnly?: boolean
}

export interface AdminDeviceItem {
  id: number
  displayName: string
  generatedHashKey: string
  showSteamNowPlaying?: boolean
  pinToTop?: boolean
  status: 'active' | 'pending' | 'revoked'
  apiTokenId: number | null
  lastSeenAt: string | null
  updatedAt: string
  apiToken?: AdminTokenOption | null
  approvalUrl?: string
}

export interface AdminDeviceCustomStatusConfig {
  id: number
  displayName: string
  customOfflineStatus: string | null
  customOfflineStatusEnabled: boolean
  customOfflineStatusUpdatedAt: string | null
  customOfflineStatusBypassOnlineDeviceKeys?: string[]
  customLockStatus: string | null
  customLockStatusEnabled: boolean
  customLockStatusUpdatedAt: string | null
  customLockStatusBypassOnlineDeviceKeys?: string[]
}

export interface AdminDeviceSummary {
  id: number
  displayName: string
  generatedHashKey: string
  status: string
}

export interface AdminActivityHistoryAppRow {
  processName: string
  lastSeenAt: string
}

export interface AdminActivityHistoryPlaySourceRow {
  playSource: string
  lastSeenAt: string
}
