import { Copy } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { AdminDeviceItem } from '@/types'

export function DeviceListItemActions({
  item,
  variant,
  t,
  onCopyHash,
  onToggleActive,
  onReview,
}: {
  item: AdminDeviceItem
  variant: 'mobile' | 'desktop'
  t: (key: string, values?: Record<string, string | number>) => string
  onCopyHash: () => void
  onToggleActive: () => void
  onReview: () => void
}) {
  if (variant === 'mobile') {
    return (
      <div className="flex w-full flex-col gap-2">
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-9 h-auto gap-1.5 py-2"
            onClick={onCopyHash}
          >
            <Copy className="h-4 w-4 shrink-0" />
            <span className="truncate text-left">{t('devices.copyIdentity')}</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-9"
            onClick={onToggleActive}
          >
            {item.status === 'active' ? t('devices.disable') : t('devices.enable')}
          </Button>
        </div>
        {item.status === 'pending' ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-9 w-full"
            onClick={onReview}
          >
            {t('devices.review')}
          </Button>
        ) : null}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 gap-1.5"
        onClick={onCopyHash}
      >
        <Copy className="h-4 w-4 shrink-0" />
        {t('devices.copyIdentity')}
      </Button>
      <Button type="button" variant="outline" size="sm" className="h-8" onClick={onToggleActive}>
        {item.status === 'active' ? t('devices.disable') : t('devices.enable')}
      </Button>
      {item.status === 'pending' ? (
        <Button type="button" variant="outline" size="sm" className="h-8" onClick={onReview}>
          {t('devices.review')}
        </Button>
      ) : null}
    </div>
  )
}
