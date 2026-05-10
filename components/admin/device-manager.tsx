'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useT } from 'next-i18next/client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import {
  getAdminPanelTransition,
  getAdminSectionVariants,
} from '@/components/admin/admin-motion'
import { DeviceCreateForm } from '@/components/admin/device-create-form'
import { DeviceCustomStatusDialog } from '@/components/admin/device-custom-status-dialog'
import { DeviceListFilters } from '@/components/admin/device-list-filters'
import { DeviceListItem } from '@/components/admin/device-list-item'
import { DeviceListPagination } from '@/components/admin/device-list-pagination'
import { DeviceReviewDialog } from '@/components/admin/device-review-dialog'
import { useDeviceCustomStatusEditor } from '@/components/admin/use-device-custom-status-editor'
import { useDeviceListQueryState } from '@/components/admin/use-device-list-query-state'
import { useDeviceManagerMutations } from '@/components/admin/use-device-manager-mutations'
import { DEVICE_LIST_MAX_HEIGHT } from '@/constants/device'
import type { AdminDeviceItem } from '@/types'

export function DeviceManager({
  initialHashKey,
  highlightHashKey,
}: {
  initialHashKey?: string
  highlightHashKey?: string
} = {}) {
  const { t } = useT('admin')
  const prefersReducedMotion = Boolean(useReducedMotion())
  const [newName, setNewName] = useState('')
  const [newTokenId, setNewTokenId] = useState('')
  const [newHashKey, setNewHashKey] = useState('')
  const [reviewDeviceId, setReviewDeviceId] = useState<number | null>(null)
  const [reviewTokenId, setReviewTokenId] = useState('')
  const highlightHandledRef = useRef(false)
  const customStatusEditor = useDeviceCustomStatusEditor(t)
  const deviceStatusLabel = (status: AdminDeviceItem['status']) => t(`devices.status.${status}`)
  const {
    q,
    status,
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
  } = useDeviceListQueryState({ initialHashKey, t })
  const deviceMutations = useDeviceManagerMutations({
    t,
    deviceStatusLabel,
    onCreated: () => {
      setNewName('')
      setNewTokenId('')
      setNewHashKey('')
      setPage(0)
    },
    onStatusUpdated: (id) => {
      setReviewDeviceId((deviceId) => (deviceId === id ? null : deviceId))
    },
  })
  const reviewDevice = useMemo(
    () => (reviewDeviceId == null ? null : items.find((item) => item.id === reviewDeviceId) ?? null),
    [items, reviewDeviceId],
  )

  const sectionTransition = getAdminPanelTransition(prefersReducedMotion)
  const sectionVariants = getAdminSectionVariants(prefersReducedMotion, {
    enterY: 10,
    exitY: 8,
    scale: 0.996,
  })

  useEffect(() => {
    if (!highlightHashKey?.trim() || items.length === 0) return
    const match = items.find((i) => i.generatedHashKey === highlightHashKey.trim())
    if (!match) return
    const el = document.getElementById(`device-row-${match.id}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [highlightHashKey, items])

  const createDevice = async () => {
    if (!newName.trim()) return
    await deviceMutations.createDevice({
      displayName: newName,
      apiTokenId: newTokenId ? Number(newTokenId) : null,
      generatedHashKey: newHashKey,
    })
  }

  const openReview = (item: AdminDeviceItem) => {
    setReviewDeviceId(item.id)
    setReviewTokenId(item.apiToken?.id ? String(item.apiToken.id) : '')
  }

  const handleToggleActive = async (item: AdminDeviceItem) => {
    if (item.status === 'active') {
      await deviceMutations.updateStatus(item.id, 'revoked')
      return
    }
    if (!item.apiToken) {
      toast.warning(t('devices.deviceNeedsToken'))
      openReview(item)
      return
    }
    await deviceMutations.updateStatus(item.id, 'active')
  }

  const copyHash = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash)
      toast.success(t('devices.identityCopied'))
    } catch {
      toast.error(t('common.copyFailedBrowserPermission'))
    }
  }

  useEffect(() => {
    const h = highlightHashKey?.trim()
    if (!h || loading) return
    if (highlightHandledRef.current) return

    const match = items.find((i) => i.generatedHashKey === h)
    if (match) {
      highlightHandledRef.current = true
      if (match.status === 'pending') {
        window.setTimeout(() => {
          setReviewDeviceId(match.id)
          setReviewTokenId(match.apiToken?.id ? String(match.apiToken.id) : '')
        }, 0)
      } else {
        toast.info(t('devices.deviceAlreadyReviewed'))
      }
      return
    }

    if (q.trim() !== h) return

    highlightHandledRef.current = true
    toast.warning(t('devices.deviceNotFound'))
  }, [highlightHashKey, loading, items, q, t])

  return (
    <div className="space-y-6">
      <DeviceCreateForm
        newName={newName}
        newTokenId={newTokenId}
        newHashKey={newHashKey}
        tokens={tokens}
        creating={deviceMutations.createDeviceMutation.isPending}
        refreshing={refreshing}
        t={t}
        onNewNameChange={setNewName}
        onNewTokenIdChange={setNewTokenId}
        onNewHashKeyChange={setNewHashKey}
        onCreate={() => void createDevice()}
        onRefresh={() => void refreshDevices()}
      />

      <div className="rounded-xl border bg-card p-4 sm:p-6 space-y-4">
        <DeviceListFilters
          query={q}
          status={status}
          t={t}
          deviceStatusLabel={deviceStatusLabel}
          onQueryChange={setQuery}
          onStatusChange={setStatusFilter}
        />

        <AnimatePresence mode="wait" initial={false}>
          {loading ? (
            <motion.p
              key="devices-loading"
              className="text-sm text-muted-foreground"
              variants={sectionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={sectionTransition}
            >
              {t('common.loading')}
            </motion.p>
          ) : items.length === 0 && total > 0 ? (
            <motion.p
              key="devices-syncing"
              className="text-sm text-muted-foreground"
              variants={sectionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={sectionTransition}
            >
              {t('devices.syncingPage')}
            </motion.p>
          ) : items.length === 0 ? (
            <motion.p
              key="devices-empty"
              className="text-sm text-muted-foreground"
              variants={sectionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={sectionTransition}
            >
              {t('devices.noDevices')}
            </motion.p>
          ) : (
            <motion.div
              key="devices-list"
              className="space-y-3 overflow-y-auto overscroll-contain pr-1"
              style={{ maxHeight: DEVICE_LIST_MAX_HEIGHT }}
              layout
            >
              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <DeviceListItem
                    key={item.id}
                    item={item}
                    highlightHashKey={highlightHashKey}
                    removePending={deviceMutations.removeDeviceMutation.isPending}
                    pinPending={deviceMutations.updatePinMutation.isPending}
                    steamPending={deviceMutations.updateSteamMutation.isPending}
                    sectionVariants={sectionVariants}
                    sectionTransition={sectionTransition}
                    t={t}
                    deviceStatusLabel={deviceStatusLabel}
                    onCopyHash={(hash) => void copyHash(hash)}
                    onToggleActive={(device) => void handleToggleActive(device)}
                    onReview={openReview}
                    onRemoveDevice={(id) => void deviceMutations.removeDevice(id)}
                    onUpdatePinToTop={(id, value) => void deviceMutations.updatePinToTop(id, value)}
                    onUpdateShowSteamNowPlaying={(id, value) =>
                      void deviceMutations.updateShowSteamNowPlaying(id, value)
                    }
                    onOpenCustomStatusEditor={(device) =>
                      void customStatusEditor.openCustomStatusEditor(device)
                    }
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <DeviceListPagination
          total={total}
          itemCount={items.length}
          safePage={safePage}
          totalPages={totalPages}
          t={t}
          onPageChange={setPage}
        />
      </div>

      <DeviceReviewDialog
        reviewDevice={reviewDevice}
        reviewTokenId={reviewTokenId}
        tokens={tokens}
        bindingPending={deviceMutations.updateBindingMutation.isPending}
        t={t}
        deviceStatusLabel={deviceStatusLabel}
        onClose={() => {
          setReviewDeviceId(null)
          setReviewTokenId('')
        }}
        onReviewTokenIdChange={setReviewTokenId}
        onUpdateBinding={(id, apiTokenId) => void deviceMutations.updateBinding(id, apiTokenId)}
        onUpdateStatus={(id, nextStatus) => void deviceMutations.updateStatus(id, nextStatus)}
      />

      <DeviceCustomStatusDialog
        open={customStatusEditor.editCustomStatusDeviceId !== null}
        saving={customStatusEditor.updateCustomStatusMutation.isPending}
        customOfflineStatus={customStatusEditor.customOfflineStatus}
        customOfflineStatusEnabled={customStatusEditor.customOfflineStatusEnabled}
        customOfflineStatusBypassOnlineDeviceKeys={
          customStatusEditor.customOfflineStatusBypassOnlineDeviceKeys
        }
        customLockStatus={customStatusEditor.customLockStatus}
        customLockStatusEnabled={customStatusEditor.customLockStatusEnabled}
        customLockStatusBypassOnlineDeviceKeys={
          customStatusEditor.customLockStatusBypassOnlineDeviceKeys
        }
        customStatusBypassSearch={customStatusEditor.customStatusBypassSearch}
        bypassDevices={customStatusEditor.availableBypassDevices}
        t={t}
        onOpenChange={(open) => {
          if (!open) customStatusEditor.resetCustomStatusEditor()
        }}
        onCustomOfflineStatusChange={customStatusEditor.setCustomOfflineStatus}
        onCustomOfflineStatusEnabledChange={customStatusEditor.setCustomOfflineStatusEnabled}
        onCustomOfflineStatusBypassOnlineDeviceKeysChange={
          customStatusEditor.setCustomOfflineStatusBypassOnlineDeviceKeys
        }
        onCustomLockStatusChange={customStatusEditor.setCustomLockStatus}
        onCustomLockStatusEnabledChange={customStatusEditor.setCustomLockStatusEnabled}
        onCustomLockStatusBypassOnlineDeviceKeysChange={
          customStatusEditor.setCustomLockStatusBypassOnlineDeviceKeys
        }
        onCustomStatusBypassSearchChange={customStatusEditor.setCustomStatusBypassSearch}
        onSave={() => void customStatusEditor.saveCustomStatus()}
      />
    </div>
  )
}
