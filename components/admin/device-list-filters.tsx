import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { AdminDeviceItem } from '@/types'

type DeviceListFiltersT = (
  key: string,
  values?: Record<string, string | number>,
) => string

export function DeviceListFilters({
  query,
  status,
  t,
  deviceStatusLabel,
  onQueryChange,
  onStatusChange,
}: {
  query: string
  status: string
  t: DeviceListFiltersT
  deviceStatusLabel: (status: AdminDeviceItem['status']) => string
  onQueryChange: (value: string) => void
  onStatusChange: (value: string) => void
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="min-w-0 flex-1 space-y-2">
        <Label htmlFor="device-q">{t('devices.search')}</Label>
        <Input
          id="device-q"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={t('devices.searchPlaceholder')}
        />
      </div>
      <div className="w-full space-y-2 sm:w-auto">
        <Label htmlFor="device-status">{t('devices.statusLabel')}</Label>
        <Select
          value={status || 'all'}
          onValueChange={(value) => onStatusChange(value === 'all' ? '' : value)}
        >
          <SelectTrigger
            id="device-status"
            className="w-full min-w-0 sm:w-[11rem] sm:min-w-[11rem]"
          >
            <SelectValue placeholder={t('devices.all')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('devices.all')}</SelectItem>
            <SelectItem value="active">{deviceStatusLabel('active')}</SelectItem>
            <SelectItem value="pending">{deviceStatusLabel('pending')}</SelectItem>
            <SelectItem value="revoked">{deviceStatusLabel('revoked')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
