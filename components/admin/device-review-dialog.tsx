import { FormattedTime } from '@/components/formatted-time'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { AdminDeviceItem, AdminTokenOption } from '@/types'

type DeviceReviewDialogT = (
  key: string,
  values?: Record<string, string | number>,
) => string

function ParseReviewTokenId(value: string): number | null {
  const parsed = value ? Number(value) : NaN
  return Number.isFinite(parsed) ? parsed : null
}

export function DeviceReviewDialog({
  reviewDevice,
  reviewTokenId,
  tokens,
  bindingPending,
  t,
  deviceStatusLabel,
  onClose,
  onReviewTokenIdChange,
  onUpdateBinding,
  onUpdateStatus,
}: {
  reviewDevice: AdminDeviceItem | null
  reviewTokenId: string
  tokens: AdminTokenOption[]
  bindingPending: boolean
  t: DeviceReviewDialogT
  deviceStatusLabel: (status: AdminDeviceItem['status']) => string
  onClose: () => void
  onReviewTokenIdChange: (value: string) => void
  onUpdateBinding: (id: number, apiTokenId: number | null) => void
  onUpdateStatus: (
    id: number,
    nextStatus: AdminDeviceItem['status'],
  ) => void
}) {
  return (
    <Dialog
      open={reviewDevice !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="sm:max-w-md" showCloseButton>
        {reviewDevice ? (
          <>
            <DialogHeader>
              <DialogTitle>{t('devices.reviewTitle')}</DialogTitle>
              <DialogDescription>{t('devices.reviewDescription')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">
                  {t('devices.fieldDisplayName')}
                </span>
                {reviewDevice.displayName}
              </p>
              <p className="text-xs">
                <span className="text-muted-foreground">
                  {t('devices.fieldIdentity')}
                </span>
                <span className="font-mono break-all">
                  {reviewDevice.generatedHashKey}
                </span>
              </p>
              <p>
                <span className="text-muted-foreground">
                  {t('devices.fieldStatus')}
                </span>
                {deviceStatusLabel(reviewDevice.status)}
              </p>
              <p>
                <span className="text-muted-foreground">
                  {t('devices.fieldLastOnline')}
                </span>
                <FormattedTime
                  date={reviewDevice.lastSeenAt}
                  pattern="yyyy-MM-dd HH:mm:ss"
                  fallback="—"
                />
              </p>
              <p>
                <span className="text-muted-foreground">
                  {t('devices.fieldToken')}
                </span>
                {reviewDevice.apiToken
                  ? reviewDevice.apiToken.name
                  : t('devices.tokenUnbound')}
              </p>
              {reviewDevice.apiToken ? (
                <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 text-xs text-amber-800 dark:text-amber-200">
                  {t('devices.bindingChangeDetected', {
                    name: reviewDevice.apiToken.name,
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="review-device-token">
                    {t('devices.reviewBindToken')}
                  </Label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Select
                      value={reviewTokenId || 'none'}
                      onValueChange={(value) =>
                        onReviewTokenIdChange(value === 'none' ? '' : value)
                      }
                    >
                      <SelectTrigger id="review-device-token" className="flex-1">
                        <SelectValue placeholder={t('devices.selectToken')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t('devices.unbind')}</SelectItem>
                        {tokens.map((tokenOption) => (
                          <SelectItem
                            key={tokenOption.id}
                            value={String(tokenOption.id)}
                          >
                            {tokenOption.name}
                            {!tokenOption.isActive
                              ? t('devices.disabledTokenSuffix')
                              : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full sm:w-auto"
                      disabled={bindingPending}
                      onClick={() =>
                        onUpdateBinding(
                          reviewDevice.id,
                          ParseReviewTokenId(reviewTokenId),
                        )
                      }
                    >
                      {t('devices.saveBinding')}
                    </Button>
                  </div>
                  <p className="text-[11px] text-amber-600 dark:text-amber-300">
                    {t('devices.bindTokenBeforeApprove')}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onUpdateStatus(reviewDevice.id, 'revoked')}
              >
                {t('devices.reject')}
              </Button>
              <Button
                type="button"
                disabled={!reviewDevice.apiToken}
                onClick={() => onUpdateStatus(reviewDevice.id, 'active')}
              >
                {t('devices.approve')}
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
