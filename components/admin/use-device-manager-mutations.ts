import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  createAdminDevice,
  deleteAdminDevice,
  patchAdminDevice,
} from '@/components/admin/admin-query-mutations'
import { toastSwitchLabel } from '@/lib/admin-switch-toast'
import type { AdminDeviceItem } from '@/types'

type DeviceManagerMutationsT = (
  key: string,
  values?: Record<string, string | number>,
) => string

type CreateDeviceInput = {
  displayName: string
  apiTokenId: number | null
  generatedHashKey: string
}

function ResolveOptionalTokenId(apiTokenId: number | null): number | undefined {
  return typeof apiTokenId === 'number' && Number.isFinite(apiTokenId) ? apiTokenId : undefined
}

export function useDeviceManagerMutations({
  t,
  deviceStatusLabel,
  onCreated,
  onStatusUpdated,
}: {
  t: DeviceManagerMutationsT
  deviceStatusLabel: (status: AdminDeviceItem['status']) => string
  onCreated: () => void
  onStatusUpdated: (id: number) => void
}) {
  const queryClient = useQueryClient()

  const createDeviceMutation = useMutation({
    mutationFn: async ({ displayName, apiTokenId, generatedHashKey }: CreateDeviceInput) => {
      const hashKey = generatedHashKey.trim()
      await createAdminDevice({
        displayName: displayName.trim(),
        apiTokenId: ResolveOptionalTokenId(apiTokenId),
        generatedHashKey: hashKey || undefined,
      })
    },
    onSuccess: async (_, variables) => {
      onCreated()
      toast.success(
        ResolveOptionalTokenId(variables.apiTokenId)
          ? t('devices.deviceCreatedWithToken')
          : t('devices.deviceCreatedPending'),
      )
      await queryClient.invalidateQueries({ queryKey: ['admin', 'devices'] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('common.networkError'))
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      nextStatus,
    }: {
      id: number
      nextStatus: AdminDeviceItem['status']
    }) => {
      await patchAdminDevice({ id, status: nextStatus })
      return { id, nextStatus }
    },
    onSuccess: async ({ id, nextStatus }) => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'devices'] })
      onStatusUpdated(id)
      toast.success(t('devices.statusUpdated', { status: deviceStatusLabel(nextStatus) }))
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('common.networkError'))
    },
  })

  const updateSteamMutation = useMutation({
    mutationFn: async ({
      id,
      showSteamNowPlaying,
    }: {
      id: number
      showSteamNowPlaying: boolean
    }) => {
      await patchAdminDevice({ id, showSteamNowPlaying })
      return { showSteamNowPlaying }
    },
    onSuccess: async ({ showSteamNowPlaying }) => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'devices'] })
      toastSwitchLabel(t('devices.showSteamTitle'), showSteamNowPlaying)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('common.networkError'))
    },
  })

  const updateBindingMutation = useMutation({
    mutationFn: async ({ id, apiTokenId }: { id: number; apiTokenId: number | null }) => {
      await patchAdminDevice({ id, apiTokenId })
      return { id, apiTokenId }
    },
    onSuccess: async ({ apiTokenId }) => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'devices'] })
      if (apiTokenId == null) {
        toast.success(t('devices.bindingRemovedPending'))
      } else {
        toast.success(t('devices.bindingUpdated'))
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('common.networkError'))
    },
  })

  const updatePinMutation = useMutation({
    mutationFn: async ({
      id,
      pinToTop,
    }: {
      id: number
      pinToTop: boolean
    }) => {
      await patchAdminDevice({ id, pinToTop })
      return { pinToTop }
    },
    onSuccess: async ({ pinToTop }) => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'devices'] })
      toastSwitchLabel(t('devices.pinToTopTitle'), pinToTop)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('common.networkError'))
    },
  })

  const removeDeviceMutation = useMutation({
    mutationFn: async (id: number) => {
      await deleteAdminDevice(id)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'devices'] })
      toast.success(t('devices.deviceDeleted'))
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('common.networkError'))
    },
  })

  return {
    createDeviceMutation,
    updateStatusMutation,
    updateSteamMutation,
    updateBindingMutation,
    updatePinMutation,
    removeDeviceMutation,
    createDevice: (input: CreateDeviceInput) => createDeviceMutation.mutateAsync(input),
    updateStatus: (id: number, nextStatus: AdminDeviceItem['status']) =>
      updateStatusMutation.mutateAsync({ id, nextStatus }),
    updateShowSteamNowPlaying: (id: number, showSteamNowPlaying: boolean) =>
      updateSteamMutation.mutateAsync({ id, showSteamNowPlaying }),
    updatePinToTop: (id: number, pinToTop: boolean) =>
      updatePinMutation.mutateAsync({ id, pinToTop }),
    updateBinding: (id: number, apiTokenId: number | null) =>
      updateBindingMutation.mutateAsync({ id, apiTokenId }),
    removeDevice: (id: number) => removeDeviceMutation.mutateAsync(id),
  }
}
