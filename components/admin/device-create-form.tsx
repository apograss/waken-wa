import { Plus, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { AdminTokenOption } from '@/types'

type DeviceCreateFormT = (
  key: string,
  values?: Record<string, string | number>,
) => string

export function DeviceCreateForm({
  newName,
  newTokenId,
  newHashKey,
  tokens,
  creating,
  refreshing,
  t,
  onNewNameChange,
  onNewTokenIdChange,
  onNewHashKeyChange,
  onCreate,
  onRefresh,
}: {
  newName: string
  newTokenId: string
  newHashKey: string
  tokens: AdminTokenOption[]
  creating: boolean
  refreshing: boolean
  t: DeviceCreateFormT
  onNewNameChange: (value: string) => void
  onNewTokenIdChange: (value: string) => void
  onNewHashKeyChange: (value: string) => void
  onCreate: () => void
  onRefresh: () => void
}) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-4 sm:p-6">
      <div className="grid min-w-0 gap-4 sm:grid-cols-3">
        <div className="min-w-0 space-y-2 sm:col-span-2">
          <Label htmlFor="new-device-name">{t('devices.displayName')}</Label>
          <Input
            id="new-device-name"
            value={newName}
            onChange={(event) => onNewNameChange(event.target.value)}
            placeholder={t('devices.displayNamePlaceholder')}
          />
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="new-device-token">
            {t('devices.bindTokenRecommended')}
          </Label>
          <Select
            value={newTokenId || 'none'}
            onValueChange={(value) =>
              onNewTokenIdChange(value === 'none' ? '' : value)
            }
          >
            <SelectTrigger id="new-device-token" className="w-full">
              <SelectValue placeholder={t('devices.selectTokenFirst')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                {t('devices.bindLaterPending')}
              </SelectItem>
              {tokens.map((tokenOption) => (
                <SelectItem key={tokenOption.id} value={String(tokenOption.id)}>
                  {tokenOption.name}
                  {!tokenOption.isActive ? t('devices.disabledTokenSuffix') : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="min-w-0 space-y-2">
        <Label htmlFor="new-device-hash">
          {t('devices.customIdentityOptional')}
        </Label>
        <Input
          id="new-device-hash"
          value={newHashKey}
          onChange={(event) => onNewHashKeyChange(event.target.value)}
          placeholder={t('devices.customIdentityPlaceholder')}
          className="font-mono text-xs"
        />
        <p className="break-words text-xs text-muted-foreground">
          {t('devices.customIdentityHint')}
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <Button
          type="button"
          className="w-full sm:w-auto"
          onClick={onCreate}
          disabled={creating || !newName.trim()}
        >
          <Plus className="h-4 w-4 mr-1" />
          {creating ? t('devices.creating') : t('devices.addDevice')}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={onRefresh}
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          {refreshing ? t('common.refreshing') : t('common.refresh')}
        </Button>
      </div>
    </div>
  )
}
