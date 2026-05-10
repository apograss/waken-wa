import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { fetchAdminDeviceSummaries } from '@/components/admin/admin-query-fetchers'
import { adminQueryKeys as keys } from '@/components/admin/admin-query-keys'
import type { AdminDeviceItem, AdminDeviceSummary } from '@/types'

type DeviceCustomStatusEditorT = (
  key: string,
  values?: Record<string, string | number>,
) => string

type DeviceCustomStatusValues = {
  customOfflineStatus: string | null
  customOfflineStatusEnabled: boolean
  customOfflineStatusBypassOnlineDeviceKeys: string[]
  customLockStatus: string | null
  customLockStatusEnabled: boolean
  customLockStatusBypassOnlineDeviceKeys: string[]
}

type DeviceCustomStatusPatchPayload = DeviceCustomStatusValues & {
  id: number
}

type DeviceCustomStatusApiResponse = {
  data?: Partial<DeviceCustomStatusValues>
}

async function PatchDeviceCustomStatus({
  id,
  customOfflineStatus,
  customOfflineStatusEnabled,
  customOfflineStatusBypassOnlineDeviceKeys,
  customLockStatus,
  customLockStatusEnabled,
  customLockStatusBypassOnlineDeviceKeys,
}: DeviceCustomStatusPatchPayload) {
  const response = await fetch(`/api/admin/devices/${id}/custom-status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customOfflineStatus,
      customOfflineStatusEnabled,
      customOfflineStatusBypassOnlineDeviceKeys,
      customLockStatus,
      customLockStatusEnabled,
      customLockStatusBypassOnlineDeviceKeys,
    }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || 'Failed to update custom status')
  }
  return response.json()
}

async function FetchDeviceCustomStatus(id: number): Promise<DeviceCustomStatusApiResponse | null> {
  const response = await fetch(`/api/admin/devices/${id}/custom-status`)
  if (!response.ok) return null
  return response.json()
}

function ReadString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function ReadBoolean(value: unknown): boolean {
  return value === true
}

function ReadStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

export function useDeviceCustomStatusEditor(t: DeviceCustomStatusEditorT) {
  const queryClient = useQueryClient()
  const [editCustomStatusDeviceId, setEditCustomStatusDeviceId] = useState<number | null>(null)
  const [customOfflineStatus, setCustomOfflineStatus] = useState('')
  const [customOfflineStatusEnabled, setCustomOfflineStatusEnabled] = useState(false)
  const [customOfflineStatusBypassOnlineDeviceKeys, setCustomOfflineStatusBypassOnlineDeviceKeys] =
    useState<string[]>([])
  const [customLockStatus, setCustomLockStatus] = useState('')
  const [customLockStatusEnabled, setCustomLockStatusEnabled] = useState(false)
  const [customLockStatusBypassOnlineDeviceKeys, setCustomLockStatusBypassOnlineDeviceKeys] =
    useState<string[]>([])
  const [customStatusBypassSearch, setCustomStatusBypassSearch] = useState('')

  const deviceSummaryQuery = useQuery({
    queryKey: keys.devices.list({ limit: 500, status: 'active' }),
    queryFn: () => fetchAdminDeviceSummaries({ limit: 500, status: 'active' }),
  })

  const updateCustomStatusMutation = useMutation({
    mutationFn: PatchDeviceCustomStatus,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'devices'] })
      await queryClient.invalidateQueries({ queryKey: ['activity-feed'] })
      setEditCustomStatusDeviceId(null)
      toast.success(t('devices.customStatus.saved'))
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('common.networkError'))
    },
  })

  const resetCustomStatusEditor = () => {
    setEditCustomStatusDeviceId(null)
    setCustomOfflineStatus('')
    setCustomOfflineStatusEnabled(false)
    setCustomOfflineStatusBypassOnlineDeviceKeys([])
    setCustomLockStatus('')
    setCustomLockStatusEnabled(false)
    setCustomLockStatusBypassOnlineDeviceKeys([])
    setCustomStatusBypassSearch('')
  }

  const applyCustomStatusValues = (values?: Partial<DeviceCustomStatusValues>) => {
    setCustomOfflineStatus(ReadString(values?.customOfflineStatus))
    setCustomOfflineStatusEnabled(ReadBoolean(values?.customOfflineStatusEnabled))
    setCustomOfflineStatusBypassOnlineDeviceKeys(
      ReadStringArray(values?.customOfflineStatusBypassOnlineDeviceKeys),
    )
    setCustomLockStatus(ReadString(values?.customLockStatus))
    setCustomLockStatusEnabled(ReadBoolean(values?.customLockStatusEnabled))
    setCustomLockStatusBypassOnlineDeviceKeys(
      ReadStringArray(values?.customLockStatusBypassOnlineDeviceKeys),
    )
  }

  const openCustomStatusEditor = async (item: AdminDeviceItem) => {
    setEditCustomStatusDeviceId(item.id)
    try {
      const result = await FetchDeviceCustomStatus(item.id)
      applyCustomStatusValues(result?.data)
    } catch {
      applyCustomStatusValues()
      setCustomStatusBypassSearch('')
    }
  }

  const saveCustomStatus = async () => {
    if (editCustomStatusDeviceId === null) return
    await updateCustomStatusMutation.mutateAsync({
      id: editCustomStatusDeviceId,
      customOfflineStatus: customOfflineStatus.trim() || null,
      customOfflineStatusEnabled,
      customOfflineStatusBypassOnlineDeviceKeys,
      customLockStatus: customLockStatus.trim() || null,
      customLockStatusEnabled,
      customLockStatusBypassOnlineDeviceKeys,
    })
  }

  const availableBypassDevices = useMemo(
    () =>
      (deviceSummaryQuery.data ?? []).filter(
        (item: AdminDeviceSummary) => item.id !== editCustomStatusDeviceId,
      ),
    [deviceSummaryQuery.data, editCustomStatusDeviceId],
  )

  return {
    editCustomStatusDeviceId,
    customOfflineStatus,
    customOfflineStatusEnabled,
    customOfflineStatusBypassOnlineDeviceKeys,
    customLockStatus,
    customLockStatusEnabled,
    customLockStatusBypassOnlineDeviceKeys,
    customStatusBypassSearch,
    availableBypassDevices,
    updateCustomStatusMutation,
    setCustomOfflineStatus,
    setCustomOfflineStatusEnabled,
    setCustomOfflineStatusBypassOnlineDeviceKeys,
    setCustomLockStatus,
    setCustomLockStatusEnabled,
    setCustomLockStatusBypassOnlineDeviceKeys,
    setCustomStatusBypassSearch,
    openCustomStatusEditor,
    resetCustomStatusEditor,
    saveCustomStatus,
  }
}
