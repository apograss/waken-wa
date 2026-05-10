'use client'

import { useAtom } from 'jotai'
import { Copy, ExternalLink, RotateCcw, Upload } from 'lucide-react'
import Image from 'next/image'
import { useT } from 'next-i18next/client'
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { toast } from 'sonner'

import { uploadImageSource } from '@/components/admin/admin-query-mutations'
import { ImageCropDialog } from '@/components/admin/image-crop-dialog'
import {
  formatNumberRange,
  NumberSettingInput,
  parseIntegerInRange,
} from '@/components/admin/number-setting-input'
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
import { normalizeStatusCardTag } from '@/lib/status-card-options'

type DeviceMode = 'auto' | 'deviceId' | 'deviceKey'
type StatusCardVariant = 'classic' | 'aurora' | 'cover' | 'signature'

type StatusCardDraft = {
  deviceMode: DeviceMode
  deviceValue: string
}

const DEFAULT_DRAFT: StatusCardDraft = {
  deviceMode: 'auto',
  deviceValue: '',
}

type StatusCardPreviewSource = {
  statusCardVariant: StatusCardVariant
  statusCardTag: string
  statusCardBackgroundKey: string
  statusCardBackgroundRev: string
  statusCardCoverKey: string
  statusCardCoverRev: string
  statusCardShowHeader: boolean
  statusCardShowAvatar: boolean
  statusCardShowName: boolean
  statusCardShowBio: boolean
  statusCardShowNote: boolean
  statusCardPreferGame: boolean
  statusCardShowInClassStatus: boolean
  statusCardWidth: number | string
  statusCardHeight: number | string
  statusCardRadius: number | string
  statusCardBg: string
  statusCardSignatureBg: string
  statusCardFg: string
  statusCardMuted: string
  statusCardAccent: string
  statusCardBorder: string
}

function toHexColor(value: string, fallback: string): string {
  const normalized = value.trim()
  if (/^#[0-9a-f]{6}$/i.test(normalized)) return normalized.toUpperCase()
  return fallback
}

const COVER_CROP_ASPECT_RATIO = 520 / 100
const COVER_CROP_OUTPUT_EDGE = 1400
const BACKGROUND_CROP_ASPECT_RATIO = 700 / 220
const SIGNATURE_CARD_WIDTH = 700
const SIGNATURE_CARD_HEIGHT = 220

function normalizeCoverKey(value: string): string {
  const normalized = value.trim()
  return /^[0-9a-f-]{16,64}$/i.test(normalized) ? normalized : ''
}

function extractCoverKeyFromImageSourceUrl(value: string): string {
  const normalized = value.trim()
  const match = /\/api\/image-src\/([0-9a-f-]{16,64})/i.exec(normalized)
  return match?.[1] ?? normalizeCoverKey(normalized)
}

async function hashText(value: string): Promise<string> {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function buildStatusCardPath(draft: StatusCardDraft, form: StatusCardPreviewSource): string {
  const params = new URLSearchParams()
  params.set('variant', form.statusCardVariant)
  const tag = normalizeStatusCardTag(form.statusCardTag)
  if (tag) params.set('tag', tag)
  const backgroundKey = normalizeCoverKey(form.statusCardBackgroundKey)
  if (form.statusCardVariant === 'signature' && backgroundKey) {
    params.set('bgImage', backgroundKey)
    if (form.statusCardBackgroundRev.trim()) {
      params.set('bgRev', form.statusCardBackgroundRev.trim())
    }
  }
  const coverKey = normalizeCoverKey(form.statusCardCoverKey)
  if (form.statusCardVariant === 'cover' && coverKey) {
    params.set('cover', coverKey)
    if (form.statusCardCoverRev.trim()) {
      params.set('coverRev', form.statusCardCoverRev.trim())
    }
  }
  params.set('showHeader', form.statusCardShowHeader ? '1' : '0')
  if (form.statusCardShowHeader) {
    params.set('showAvatar', form.statusCardShowAvatar ? '1' : '0')
    params.set('showName', form.statusCardShowName ? '1' : '0')
    params.set('showBio', form.statusCardShowBio ? '1' : '0')
    params.set('showNote', form.statusCardShowNote ? '1' : '0')
  }
  if (draft.deviceMode !== 'auto' && draft.deviceValue) {
    params.set(draft.deviceMode, draft.deviceValue)
  }
  params.set('preferGame', form.statusCardPreferGame ? '1' : '0')
  params.set('showInClassStatus', form.statusCardShowInClassStatus ? '1' : '0')
  const statusCardWidth = parseIntegerInRange(form.statusCardWidth, 280, 1200) ?? 520
  const statusCardHeight = parseIntegerInRange(form.statusCardHeight, 1, 720) ?? 310
  const statusCardRadius = parseIntegerInRange(form.statusCardRadius, 0, 80) ?? 20
  params.set('width', String(statusCardWidth))
  params.set('height', String(statusCardHeight))
  params.set('radius', String(statusCardRadius))
  params.set('bg', form.statusCardBg)
  if (form.statusCardVariant === 'signature') {
    params.set('signatureBg', form.statusCardSignatureBg)
  }
  params.set('fg', form.statusCardFg)
  params.set('muted', form.statusCardMuted)
  params.set('accent', form.statusCardAccent)
  params.set('border', form.statusCardBorder)
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
  }))
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const [isUploadingBackground, setIsUploadingBackground] = useState(false)
  const [coverCropSourceUrl, setCoverCropSourceUrl] = useState<string | null>(null)
  const [coverCropDialogOpen, setCoverCropDialogOpen] = useState(false)
  const [backgroundCropSourceUrl, setBackgroundCropSourceUrl] = useState<string | null>(null)
  const [backgroundCropDialogOpen, setBackgroundCropDialogOpen] = useState(false)

  const selectedDevice = devices.find((device) => {
    if (draft.deviceMode === 'deviceId') return String(device.id) === draft.deviceValue
    if (draft.deviceMode === 'deviceKey') return device.generatedHashKey === draft.deviceValue
    return false
  })
  const pathDraft = buildStatusCardPath(draft, {
    statusCardVariant: form.statusCardVariant,
    statusCardTag: form.statusCardTag,
    statusCardBackgroundKey: form.statusCardBackgroundKey,
    statusCardBackgroundRev: form.statusCardBackgroundRev,
    statusCardCoverKey: form.statusCardCoverKey,
    statusCardCoverRev: form.statusCardCoverRev,
    statusCardShowHeader: form.statusCardShowHeader,
    statusCardShowAvatar: form.statusCardShowAvatar,
    statusCardShowName: form.statusCardShowName,
    statusCardShowBio: form.statusCardShowBio,
    statusCardShowNote: form.statusCardShowNote,
    statusCardPreferGame: form.statusCardPreferGame,
    statusCardShowInClassStatus: form.statusCardShowInClassStatus,
    statusCardWidth: form.statusCardWidth,
    statusCardHeight: form.statusCardHeight,
    statusCardRadius: form.statusCardRadius,
    statusCardBg: form.statusCardBg,
    statusCardSignatureBg: form.statusCardSignatureBg,
    statusCardFg: form.statusCardFg,
    statusCardMuted: form.statusCardMuted,
    statusCardAccent: form.statusCardAccent,
    statusCardBorder: form.statusCardBorder,
  })
  const [path, setPath] = useState(pathDraft)
  useEffect(() => {
    const timer = window.setTimeout(() => setPath(pathDraft), 700)
    return () => window.clearTimeout(timer)
  }, [pathDraft])
  const absoluteUrl = `${origin}${path}`
  const embedAlt = form.currentlyText.trim() || t('webSettingsBasic.currentlyTextDefault')
  const embedHtml = `<img src="${escapeHtmlAttribute(absoluteUrl || path)}" alt="${escapeHtmlAttribute(embedAlt)}" />`

  const patchForm = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const setVariant = (value: StatusCardVariant) => {
    setForm((prev) => ({
      ...prev,
      statusCardVariant: value,
      ...(value === 'signature'
        ? {
            statusCardWidth: SIGNATURE_CARD_WIDTH,
            statusCardHeight: SIGNATURE_CARD_HEIGHT,
          }
        : {}),
    }))
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

  const openCoverCropForFile = (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error(t('webSettingsActivity.statusCard.coverUploadInvalid'))
      return
    }
    if (coverCropSourceUrl) URL.revokeObjectURL(coverCropSourceUrl)
    setCoverCropSourceUrl(URL.createObjectURL(file))
    setCoverCropDialogOpen(true)
  }

  const openBackgroundCropForFile = (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error(t('webSettingsActivity.statusCard.backgroundUploadInvalid'))
      return
    }
    if (backgroundCropSourceUrl) URL.revokeObjectURL(backgroundCropSourceUrl)
    setBackgroundCropSourceUrl(URL.createObjectURL(file))
    setBackgroundCropDialogOpen(true)
  }

  const uploadCoverDataUrl = async (dataUrl: string) => {
    setIsUploadingCover(true)
    try {
      const [url, contentHash] = await Promise.all([
        uploadImageSource(dataUrl, 'status-card.cover'),
        hashText(dataUrl),
      ])
      const coverKey = extractCoverKeyFromImageSourceUrl(url)
      if (!coverKey) throw new Error('Missing image key')
      setForm((prev) => ({
        ...prev,
        statusCardCoverKey: coverKey,
        statusCardCoverRev: contentHash.slice(0, 16),
      }))
      toast.success(t('webSettingsActivity.statusCard.coverUploadSuccess'))
    } catch {
      toast.error(t('webSettingsActivity.statusCard.coverUploadFailed'))
    } finally {
      setIsUploadingCover(false)
    }
  }

  const uploadBackgroundDataUrl = async (dataUrl: string) => {
    setIsUploadingBackground(true)
    try {
      const [url, contentHash] = await Promise.all([
        uploadImageSource(dataUrl, 'status-card.background'),
        hashText(dataUrl),
      ])
      const backgroundKey = extractCoverKeyFromImageSourceUrl(url)
      if (!backgroundKey) throw new Error('Missing image key')
      setForm((prev) => ({
        ...prev,
        statusCardBackgroundKey: backgroundKey,
        statusCardBackgroundRev: contentHash.slice(0, 16),
      }))
      toast.success(t('webSettingsActivity.statusCard.backgroundUploadSuccess'))
    } catch {
      toast.error(t('webSettingsActivity.statusCard.backgroundUploadFailed'))
    } finally {
      setIsUploadingBackground(false)
    }
  }

  const reset = () => {
    setDraft({ ...DEFAULT_DRAFT })
    setForm((prev) => ({
      ...prev,
      statusCardVariant: 'aurora',
      statusCardTag: '',
      statusCardBackgroundKey: '',
      statusCardBackgroundRev: '',
      statusCardCoverKey: '',
      statusCardCoverRev: '',
      statusCardShowHeader: true,
      statusCardShowAvatar: true,
      statusCardShowName: true,
      statusCardShowBio: true,
      statusCardShowNote: false,
      statusCardPreferGame: false,
      statusCardShowInClassStatus: false,
      statusCardWidth: 520,
      statusCardHeight: 310,
      statusCardRadius: 20,
      statusCardBg: '#FFFFFF',
      statusCardSignatureBg: '#F4F0FF',
      statusCardFg: '#111827',
      statusCardMuted: '#6B7280',
      statusCardAccent: toHexColor(prev.profileOnlineAccentColor || '#22C55E', '#22C55E'),
      statusCardBorder: '#E5E7EB',
    }))
  }

  const previewWidth = parseIntegerInRange(form.statusCardWidth, 280, 1200) ?? 520
  const previewHeight = parseIntegerInRange(form.statusCardHeight, 1, 720) ?? 310

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
                  checked={form.statusCardShowHeader}
                  onCheckedChange={(value) => patchForm('statusCardShowHeader', value)}
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
                  checked={form.statusCardShowNote}
                  onCheckedChange={(value) => patchForm('statusCardShowNote', value)}
                  disabled={!form.statusCardShowHeader}
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
                  checked={form.statusCardPreferGame}
                  onCheckedChange={(value) => patchForm('statusCardPreferGame', value)}
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
                  checked={form.statusCardShowInClassStatus}
                  onCheckedChange={(value) => patchForm('statusCardShowInClassStatus', value)}
                />
              }
            />
          </WebSettingsRows>

          {form.statusCardShowHeader ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ['statusCardShowAvatar', t('webSettingsActivity.statusCard.showAvatar')],
                ['statusCardShowName', t('webSettingsActivity.statusCard.showName')],
                ['statusCardShowBio', t('webSettingsActivity.statusCard.showBio')],
              ].map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm"
                >
                  <span>{label}</span>
                  <Switch
                    checked={Boolean(form[key as 'statusCardShowAvatar' | 'statusCardShowName' | 'statusCardShowBio'])}
                    onCheckedChange={(value) => patchForm(key as 'statusCardShowAvatar' | 'statusCardShowName' | 'statusCardShowBio', value)}
                  />
                </label>
              ))}
            </div>
          ) : null}

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="status-card-variant">
                {t('webSettingsActivity.statusCard.variantLabel')}
              </Label>
              <Select
                value={form.statusCardVariant}
                onValueChange={(value) => setVariant(value as StatusCardVariant)}
              >
                <SelectTrigger id="status-card-variant" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aurora">
                    {t('webSettingsActivity.statusCard.variants.aurora')}
                  </SelectItem>
                  <SelectItem value="cover">
                    {t('webSettingsActivity.statusCard.variants.cover')}
                  </SelectItem>
                  <SelectItem value="signature">
                    {t('webSettingsActivity.statusCard.variants.signature')}
                  </SelectItem>
                  <SelectItem value="classic">
                    {t('webSettingsActivity.statusCard.variants.classic')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status-card-tag">
                {t('webSettingsActivity.statusCard.tagLabel')}
              </Label>
              <Input
                id="status-card-tag"
                value={form.statusCardTag}
                onChange={(event) => patchForm('statusCardTag', normalizeStatusCardTag(event.target.value))}
                placeholder={t('webSettingsActivity.statusCard.tagPlaceholder')}
              />
            </div>
            {form.statusCardVariant === 'signature' ? (
              <div className="space-y-2">
                <Label htmlFor="status-card-background-key">
                  {t('webSettingsActivity.statusCard.backgroundKeyLabel')}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="status-card-background-key"
                    value={form.statusCardBackgroundKey}
                    onChange={(event) => patchForm('statusCardBackgroundKey', event.target.value)}
                    placeholder={t('webSettingsActivity.statusCard.backgroundKeyPlaceholder')}
                    className="font-mono text-xs"
                  />
                  <Button type="button" variant="outline" size="sm" disabled={isUploadingBackground} asChild>
                    <label className="cursor-pointer">
                      <Upload className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                      {isUploadingBackground
                        ? t('webSettingsActivity.statusCard.backgroundUploading')
                        : t('webSettingsActivity.statusCard.backgroundUpload')}
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(event) => {
                          openBackgroundCropForFile(event.target.files?.[0])
                          event.target.value = ''
                        }}
                      />
                    </label>
                  </Button>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {t('webSettingsActivity.statusCard.backgroundKeyHint')}
                </p>
              </div>
            ) : null}
            {form.statusCardVariant === 'cover' ? (
              <div className="space-y-2">
                <Label htmlFor="status-card-cover-key">
                  {t('webSettingsActivity.statusCard.coverKeyLabel')}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="status-card-cover-key"
                    value={form.statusCardCoverKey}
                    onChange={(event) => patchForm('statusCardCoverKey', event.target.value)}
                    placeholder={t('webSettingsActivity.statusCard.coverKeyPlaceholder')}
                    className="font-mono text-xs"
                  />
                  <Button type="button" variant="outline" size="sm" disabled={isUploadingCover} asChild>
                    <label className="cursor-pointer">
                      <Upload className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                      {isUploadingCover
                        ? t('webSettingsActivity.statusCard.coverUploading')
                        : t('webSettingsActivity.statusCard.coverUpload')}
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(event) => {
                          openCoverCropForFile(event.target.files?.[0])
                          event.target.value = ''
                        }}
                      />
                    </label>
                  </Button>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {t('webSettingsActivity.statusCard.coverKeyHint')}
                </p>
              </div>
            ) : null}
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
              <NumberSettingInput
                id="status-card-width"
                min={280}
                max={1200}
                value={form.statusCardWidth}
                rangeMessage={formatNumberRange(280, 1200)}
                onValueChange={(value) => patchForm('statusCardWidth', value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status-card-height" className="text-xs text-muted-foreground">
                {t('webSettingsActivity.statusCard.heightLabel')}
              </Label>
              <NumberSettingInput
                id="status-card-height"
                min={1}
                max={720}
                value={form.statusCardHeight}
                rangeMessage={formatNumberRange(1, 720)}
                onValueChange={(value) => patchForm('statusCardHeight', value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status-card-radius" className="text-xs text-muted-foreground">
                {t('webSettingsActivity.statusCard.radiusLabel')}
              </Label>
              <NumberSettingInput
                id="status-card-radius"
                min={0}
                max={80}
                value={form.statusCardRadius}
                rangeMessage={formatNumberRange(0, 80)}
                onValueChange={(value) => patchForm('statusCardRadius', value)}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <StatusCardColorInput id="status-card-bg" label={t('webSettingsActivity.statusCard.bgLabel')} value={form.statusCardBg} onChange={(value) => patchForm('statusCardBg', value)} />
            {form.statusCardVariant === 'signature' ? (
              <StatusCardColorInput id="status-card-signature-bg" label={t('webSettingsActivity.statusCard.signatureBgLabel')} value={form.statusCardSignatureBg} onChange={(value) => patchForm('statusCardSignatureBg', value)} />
            ) : null}
            <StatusCardColorInput id="status-card-fg" label={t('webSettingsActivity.statusCard.fgLabel')} value={form.statusCardFg} onChange={(value) => patchForm('statusCardFg', value)} />
            <StatusCardColorInput id="status-card-muted" label={t('webSettingsActivity.statusCard.mutedLabel')} value={form.statusCardMuted} onChange={(value) => patchForm('statusCardMuted', value)} />
            <StatusCardColorInput id="status-card-accent" label={t('webSettingsActivity.statusCard.accentLabel')} value={form.statusCardAccent} onChange={(value) => patchForm('statusCardAccent', value)} />
            <StatusCardColorInput id="status-card-border" label={t('webSettingsActivity.statusCard.borderLabel')} value={form.statusCardBorder} onChange={(value) => patchForm('statusCardBorder', value)} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="overflow-hidden rounded-lg border border-border/60 bg-muted/10 p-3">
            <div className="flex min-h-40 items-center justify-center overflow-auto">
              <Image
                src={path}
                alt={t('webSettingsActivity.statusCard.previewAlt')}
                width={previewWidth}
                height={previewHeight}
                unoptimized
                className="max-w-full rounded-md"
                style={{ width: Math.min(previewWidth, 360), height: 'auto' }}
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
      <ImageCropDialog
        open={coverCropDialogOpen}
        onOpenChange={(open) => {
          setCoverCropDialogOpen(open)
          if (!open) {
            setCoverCropSourceUrl((prev) => {
              if (prev) URL.revokeObjectURL(prev)
              return null
            })
          }
        }}
        sourceUrl={coverCropSourceUrl}
        aspectMode="free"
        aspectRatio={COVER_CROP_ASPECT_RATIO}
        outputSize={COVER_CROP_OUTPUT_EDGE}
        outputFormat="webp"
        outputQuality={0.9}
        title={t('webSettingsActivity.statusCard.coverCropTitle')}
        description={t('webSettingsActivity.statusCard.coverCropDescription')}
        onComplete={(dataUrl) => {
          void uploadCoverDataUrl(dataUrl)
        }}
      />
      <ImageCropDialog
        open={backgroundCropDialogOpen}
        onOpenChange={(open) => {
          setBackgroundCropDialogOpen(open)
          if (!open) {
            setBackgroundCropSourceUrl((prev) => {
              if (prev) URL.revokeObjectURL(prev)
              return null
            })
          }
        }}
        sourceUrl={backgroundCropSourceUrl}
        aspectMode="free"
        aspectRatio={BACKGROUND_CROP_ASPECT_RATIO}
        outputSize={COVER_CROP_OUTPUT_EDGE}
        outputFormat="webp"
        outputQuality={0.88}
        title={t('webSettingsActivity.statusCard.backgroundCropTitle')}
        description={t('webSettingsActivity.statusCard.backgroundCropDescription')}
        onComplete={(dataUrl) => {
          void uploadBackgroundDataUrl(dataUrl)
        }}
      />
    </WebSettingsInset>
  )
}

