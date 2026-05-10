import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import {
  fetchAdminDevicesPage,
  fetchAdminTokenOptions,
} from '@/components/admin/admin-query-fetchers'
import { adminQueryKeys as keys } from '@/components/admin/admin-query-keys'
import { DEVICE_LIST_PAGE_SIZE } from '@/constants/device'

type DeviceListQueryStateT = (
  key: string,
  values?: Record<string, string | number>,
) => string

export function useDeviceListQueryState({
  initialHashKey,
  t,
}: {
  initialHashKey?: string
  t: DeviceListQueryStateT
}) {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [q, setQ] = useState(() => initialHashKey?.trim() ?? '')
  const [status, setStatus] = useState('')

  const tokensQuery = useQuery({
    queryKey: keys.tokens.options(),
    queryFn: fetchAdminTokenOptions,
  })

  const devicesQuery = useQuery({
    queryKey: keys.devices.page({ page, q, status }),
    queryFn: () => fetchAdminDevicesPage({ page, q, status, pageSize: DEVICE_LIST_PAGE_SIZE }),
    placeholderData: keepPreviousData,
  })

  const items = useMemo(() => devicesQuery.data?.items ?? [], [devicesQuery.data?.items])
  const total = devicesQuery.data?.total ?? 0
  const loading = devicesQuery.isLoading
  const refreshing = devicesQuery.isFetching && !devicesQuery.isLoading
  const tokens = tokensQuery.data ?? []

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / DEVICE_LIST_PAGE_SIZE)),
    [total],
  )
  const safePage = useMemo(() => Math.min(page, Math.max(0, totalPages - 1)), [page, totalPages])

  useEffect(() => {
    if (page <= safePage) return
    const timer = window.setTimeout(() => {
      setPage(safePage)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [page, safePage])

  const refreshDevices = async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'devices'] })
      await devicesQuery.refetch()
    } catch {
      toast.error(t('devices.refreshFailed'))
    }
  }

  const setQuery = (value: string) => {
    setQ(value)
    setPage(0)
  }

  const setStatusFilter = (value: string) => {
    setStatus(value)
    setPage(0)
  }

  return {
    q,
    status,
    page,
    safePage,
    totalPages,
    items,
    total,
    loading,
    refreshing,
    tokens,
    setPage,
    setQuery,
    setStatusFilter,
    refreshDevices,
  }
}
