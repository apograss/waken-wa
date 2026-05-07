'use client'

import { useAtom } from 'jotai'
import { Copy, ExternalLink, RotateCcw } from 'lucide-react'
import Image from 'next/image'
import { useT } from 'next-i18next/client'
import { useMemo, useState, useSyncExternalStore } from 'react'
import { toast } from 'sonner'

import {
  WebSettingsInset,
  WebSettingsRow,
  WebSettingsRows,
} from '@/components/admin/web-settings-layout'
import {
  webSettingsFormAtom,
  webSettingsInspirationDevicesAtom,
} from '@/components/admin/web-settings-store'
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
import { Switch } from '@/components/ui/switch'

type DeviceMode = 'auto' | 'deviceId' | 'deviceKey'

type StatusCardDraft = {
  deviceMode: DeviceMode
  deviceValue: string
  showHeader: boolean
  showAvatar: boolean
  showName: boolean
  showBio: boolean
  showNote: boolean
  preferGame: boolean
  showInClassStatus: boolean
  width: number
  height: number
  radius: number
  bg: string
  fg: string
  muted: string
  accent: string
  border: string
}

const DEFAULT_DRAFT: StatusCardDraft = {
  deviceMode: 'auto',
  deviceValue: '',
  showHeader: true,
  showAvatar: true,
  showName: true,
  showBio: true,
  showNote: false,
  preferGame: false,
  showInClassStatus: false,
  width: 520,
  height: 310,
  radius: 20,
  bg: '#FFFFFF',
  fg: '#111827',
  muted: '#6B7280',
  accent: '#22C55E',
  border: '#E5E7EB',
}

function toHexColor(value: string, fallback: string): string {
  const normalized = value.trim()
  if (/^#[0-9a-f]{6}$/i.test(normalized)) return normalized.toUpperCase()
  return fallback
}

function clampNumber(value: number, fallback: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, Math.round(value)))
}

function buildStatusCardPath(draft: StatusCardDraft): string {
  const params = new URLSearchParams()
  params.set('showHeader', draft.showHeader ? '1' : '0')
  if (draft.showHeader) {
    params.set('showAvatar', draft.showAvatar ? '1' : '0')
    params.set('showName', draft.showName ? '1' : '0')
    params.set('showBio', draft.showBio ? '1' : '0')
    params.set('showNote', draft.showNote ? '1' : '0')
  }
  if (draft.deviceMode !== 'auto' && draft.deviceValue) {
    params.set(draft.deviceMode, draft.deviceValue)
  }
  params.set('preferGame', draft.preferGame ? '1' : '0')
  params.set('showInClassStatus', draft.showInClassStatus ? '1' : '0')
  params.set('width', String(draft.width))
  params.set('height', String(draft.height))
  params.set('radius', String(draft.radius))
  params.set('bg', draft.bg)
  params.set('fg', draft.fg)
  params.set('muted', draft.muted)
  params.set('accent', draft.accent)
  params.set('border', draft.border)
  return `/api/status-card?${params.toString()}`
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function StatusCardColorInput({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          className="h-9 w-12 shrink-0 cursor-pointer rounded-md border border-input bg-background p-1 shadow-xs"
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
        />
        <Input
          value={value}
          onChange={(event) => onChange(toHexColor(event.target.value, value))}
          className="font-mono text-xs"
        />
      </div>
    </div>
  )
}

export function StatusCardPreviewPanel() {
  const { t } = useT('admin')
  const [form, setForm] = useAtom(webSettingsFormAtom)
  const [devices] = useAtom(webSettingsInspirationDevicesAtom)
  const origin = useSyncExternalStore(
    () => () => undefined,
    () => window.location.origin,
    () => '',
  )
  const [draft, setDraft] = useState<StatusCardDraft>(() => ({
    ...DEFAULT_DRAFT,
    accent: toHexColor(form.profileOnlineAccentColor || DEFAULT_DRAFT.accent, DEFAULT_DRAFT.accent),
  }))

  const selectedDevice = devices.find((device) => {
    if (draft.deviceMode === 'deviceId') return String(device.id) === draft.deviceValue
    if (draft.deviceMode === 'deviceKey') return device.generatedHashKey === draft.deviceValue
    return false
  })
  const path = useMemo(() => buildStatusCardPath(draft), [draft])
  const absoluteUrl = `${origin}${path}`
  const embedAlt = form.currentlyText.trim() || t('webSettingsBasic.currentlyTextDefault')
  const embedHtml = `<img src="${escapeHtmlAttribute(absoluteUrl || path)}" alt="${escapeHtmlAttribute(embedAlt)}" />`

  const patchForm = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const patchDraft = <K extends keyof StatusCardDraft>(key: K, value: StatusCardDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(t('common.copiedToClipboard'))
    } catch {
      toast.error(t('common.copyFailedBrowserPermission'))
    }
  }

  const reset = () => {
    setDraft({
      ...DEFAULT_DRAFT,
      accent: toHexColor(form.profileOnlineAccentColor || DEFAULT_DRAFT.accent, DEFAULT_DRAFT.accent),
    })
  }

  const setDimension = (
    key: 'width' | 'height' | 'radius',
    value: string,
    fallback: number,
    min: number,
    max: number,
  ) => {
    patchDraft(key, clampNumber(Number(value), fallback, min, max))
  }

  return (
    <WebSettingsInset className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-foreground">
            {t('webSettingsActivity.statusCard.title')}
          </h4>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t('webSettingsActivity.statusCard.descriptionPrefix')}{' '}
            <code className="rounded bg-muted px-1">img</code>
            {t('webSettingsActivity.statusCard.descriptionSuffix')}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={reset}>
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          {t('webSettingsActivity.statusCard.reset')}
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,420px)]">
        <div className="space-y-4">
          <WebSettingsRows>
            <WebSettingsRow
              htmlFor="status-card-enabled"
              title={t('webSettingsActivity.statusCard.enabledTitle')}
              description={t('webSettingsActivity.statusCard.enabledDescription')}
              action={
                <Switch
                  id="status-card-enabled"
                  checked={form.statusCardEnabled}
                  onCheckedChange={(value) => patchForm('statusCardEnabled', value)}
                />
              }
            />
            <WebSettingsRow
              htmlFor="status-card-show-header"
              title={t('webSettingsActivity.statusCard.showHeaderTitle')}
              description={t('webSettingsActivity.statusCard.showHeaderDescription')}
              action={
                <Switch
                  id="status-card-show-header"
                  checked={draft.showHeader}
                  onCheckedChange={(value) => patchDraft('showHeader', value)}
                />
              }
            />
            <WebSettingsRow
              htmlFor="status-card-show-note"
              title={t('webSettingsActivity.statusCard.showNoteTitle')}
              description={t('webSettingsActivity.statusCard.showNoteDescription')}
              action={
                <Switch
                  id="status-card-show-note"
                  checked={draft.showNote}
                  onCheckedChange={(value) => patchDraft('showNote', value)}
                  disabled={!draft.showHeader}
                />
              }
            />
            <WebSettingsRow
              htmlFor="status-card-prefer-game"
              title={t('webSettingsActivity.statusCard.preferGameTitle')}
              description={t('webSettingsActivity.statusCard.preferGameDescription')}
              action={
                <Switch
                  id="status-card-prefer-game"
                  checked={draft.preferGame}
                  onCheckedChange={(value) => patchDraft('preferGame', value)}
                />
              }
            />
            <WebSettingsRow
              htmlFor="status-card-show-in-class"
              title={t('webSettingsActivity.statusCard.showInClassTitle')}
              description={t('webSettingsActivity.statusCard.showInClassDescription')}
              action={
                <Switch
                  id="status-card-show-in-class"
                  checked={draft.showInClassStatus}
                  onCheckedChange={(value) => patchDraft('showInClassStatus', value)}
                />
              }
            />
          </WebSettingsRows>

          {draft.showHeader ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ['showAvatar', t('webSettingsActivity.statusCard.showAvatar')],
                ['showName', t('webSettingsActivity.statusCard.showName')],
                ['showBio', t('webSettingsActivity.statusCard.showBio')],
              ].map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm"
                >
                  <span>{label}</span>
                  <Switch
                    checked={Boolean(draft[key as keyof StatusCardDraft])}
                    onCheckedChange={(value) => patchDraft(key as 'showAvatar' | 'showName' | 'showBio', value)}
                  />
                </label>
              ))}
            </div>
          ) : null}

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="status-card-device-mode">
                {t('webSettingsActivity.statusCard.deviceModeLabel')}
              </Label>
              <Select
                value={draft.deviceMode}
                onValueChange={(value) => {
                  patchDraft('deviceMode', value as DeviceMode)
                  patchDraft('deviceValue', '')
                }}
              >
                <SelectTrigger id="status-card-device-mode" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">
                    {t('webSettingsActivity.statusCard.deviceModes.auto')}
                  </SelectItem>
                  <SelectItem value="deviceId">
                    {t('webSettingsActivity.statusCard.deviceModes.deviceId')}
                  </SelectItem>
                  <SelectItem value="deviceKey">
                    {t('webSettingsActivity.statusCard.deviceModes.deviceKey')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {draft.deviceMode === 'auto' ? null : (
              <div className="space-y-2">
                <Label htmlFor="status-card-device-value">
                  {t('webSettingsActivity.statusCard.deviceValueLabel')}
                </Label>
                <Select value={draft.deviceValue} onValueChange={(value) => patchDraft('deviceValue', value)}>
                  <SelectTrigger id="status-card-device-value" className="w-full">
                    <SelectValue placeholder={t('webSettingsActivity.statusCard.deviceValuePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {devices.map((device) => (
                      <SelectItem
                        key={`${draft.deviceMode}-${device.id}`}
                        value={draft.deviceMode === 'deviceId' ? String(device.id) : device.generatedHashKey}
                      >
                        {device.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {draft.deviceMode === 'deviceKey' ? (
            <p className="rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-700 dark:text-amber-400">
              {t('webSettingsActivity.statusCard.deviceKeyWarning')}
            </p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="status-card-width" className="text-xs text-muted-foreground">
                {t('webSettingsActivity.statusCard.widthLabel')}
              </Label>
              <Input
                id="status-card-width"
                type="number"
                min={280}
                max={1200}
                value={draft.width}
                onChange={(event) => setDimension('width', event.target.value, DEFAULT_DRAFT.width, 280, 1200)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status-card-height" className="text-xs text-muted-foreground">
                {t('webSettingsActivity.statusCard.heightLabel')}
              </Label>
              <Input
                id="status-card-height"
                type="number"
                min={1}
                max={720}
                value={draft.height}
                onChange={(event) => setDimension('height', event.target.value, DEFAULT_DRAFT.height, 1, 720)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status-card-radius" className="text-xs text-muted-foreground">
                {t('webSettingsActivity.statusCard.radiusLabel')}
              </Label>
              <Input
                id="status-card-radius"
                type="number"
                min={0}
                max={80}
                value={draft.radius}
                onChange={(event) => setDimension('radius', event.target.value, DEFAULT_DRAFT.radius, 0, 80)}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <StatusCardColorInput id="status-card-bg" label={t('webSettingsActivity.statusCard.bgLabel')} value={draft.bg} onChange={(value) => patchDraft('bg', value)} />
            <StatusCardColorInput id="status-card-fg" label={t('webSettingsActivity.statusCard.fgLabel')} value={draft.fg} onChange={(value) => patchDraft('fg', value)} />
            <StatusCardColorInput id="status-card-muted" label={t('webSettingsActivity.statusCard.mutedLabel')} value={draft.muted} onChange={(value) => patchDraft('muted', value)} />
            <StatusCardColorInput id="status-card-accent" label={t('webSettingsActivity.statusCard.accentLabel')} value={draft.accent} onChange={(value) => patchDraft('accent', value)} />
            <StatusCardColorInput id="status-card-border" label={t('webSettingsActivity.statusCard.borderLabel')} value={draft.border} onChange={(value) => patchDraft('border', value)} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="overflow-hidden rounded-lg border border-border/60 bg-muted/10 p-3">
            <div className="flex min-h-40 items-center justify-center overflow-auto">
              <Image
                src={path}
                alt={t('webSettingsActivity.statusCard.previewAlt')}
                width={draft.width}
                height={draft.height}
                unoptimized
                className="max-w-full rounded-md"
                style={{ width: Math.min(draft.width, 360), height: 'auto' }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('webSettingsActivity.statusCard.urlLabel')}</Label>
            <div className="flex gap-2">
              <Input readOnly value={absoluteUrl || path} className="font-mono text-xs" />
              <Button type="button" variant="outline" size="icon" onClick={() => void copyText(absoluteUrl || path)}>
                <Copy className="h-4 w-4" aria-hidden />
                <span className="sr-only">{t('webSettingsActivity.statusCard.copyUrl')}</span>
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('webSettingsActivity.statusCard.htmlLabel')}</Label>
            <div className="flex gap-2">
              <Input readOnly value={embedHtml} className="font-mono text-xs" />
              <Button type="button" variant="outline" size="icon" onClick={() => void copyText(embedHtml)}>
                <Copy className="h-4 w-4" aria-hidden />
                <span className="sr-only">{t('webSettingsActivity.statusCard.copyHtml')}</span>
              </Button>
            </div>
          </div>

          {absoluteUrl ? (
            <Button type="button" variant="outline" size="sm" asChild>
              <a href={absoluteUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                {t('webSettingsActivity.statusCard.openPreview')}
              </a>
            </Button>
          ) : null}

          {selectedDevice ? (
            <p className="text-xs text-muted-foreground">
              {t('webSettingsActivity.statusCard.currentDevice', {
                value: selectedDevice.displayName,
              })}
            </p>
          ) : null}
        </div>
      </div>
    </WebSettingsInset>
  )
}

