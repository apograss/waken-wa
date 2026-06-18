'use client'

import { useAtom } from 'jotai'
import { useT } from 'next-i18next/client'
import { useState } from 'react'
import { toast } from 'sonner'

import { uploadImageSource } from '@/components/admin/admin-query-mutations'
import { FileSelectTrigger } from '@/components/admin/file-select-trigger'
import {
  WebSettingsInset,
  WebSettingsRow,
  WebSettingsRows,
  WebSettingsSection,
} from '@/components/admin/web-settings-layout'
import {
  webSettingsFormAtom,
  webSettingsMigrationAtom,
} from '@/components/admin/web-settings-store'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { AboutProfileFields } from '@/lib/about-profile'

const DEFAULT_FIGURE_IMAGE = '/assets/homepage/section-about-companion.png'

function ReadFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

function BuildBackgroundImageStyle(value: string) {
  const normalized = value.trim() || DEFAULT_FIGURE_IMAGE
  return { backgroundImage: `url("${normalized.replace(/"/g, '\\"')}")` }
}

export function AboutSettingsPanel() {
  const { t } = useT('admin')
  const [form, setForm] = useAtom(webSettingsFormAtom)
  const [migration] = useAtom(webSettingsMigrationAtom)
  const [uploadingFigure, setUploadingFigure] = useState(false)
  const coreLocked = migration?.heavyEditingLocked === true
  const about = form.aboutProfile

  const patchAbout = <K extends keyof AboutProfileFields>(
    key: K,
    value: AboutProfileFields[K],
  ) => {
    setForm((prev) => ({
      ...prev,
      aboutProfile: { ...prev.aboutProfile, [key]: value },
    }))
  }

  const onFigureSelected = async (file?: File) => {
    if (!file) return
    setUploadingFigure(true)
    try {
      const dataUrl = await ReadFileAsDataUrl(file)
      const url = await uploadImageSource(dataUrl, 'homepage.about-figure')
      patchAbout('figureImage', url)
      toast.success(t('webSettingsAbout.figureUploadSuccess'))
    } catch (error) {
      console.error(error)
      toast.error(t('mutation.uploadBodyImageFailed'))
    } finally {
      setUploadingFigure(false)
    }
  }

  const figurePreview = about.figureImage.trim() || DEFAULT_FIGURE_IMAGE

  return (
    <WebSettingsSection
      title={t('webSettingsAbout.title')}
      description={t('webSettingsAbout.description')}
    >
      {/* Domain */}
      <WebSettingsInset className="space-y-3">
        <WebSettingsRow
          htmlFor="about-domain-enabled"
          title={t('webSettingsAbout.domainTitle')}
          description={t('webSettingsAbout.domainDescription')}
          action={
            <Switch
              id="about-domain-enabled"
              checked={about.domainEnabled}
              disabled={coreLocked}
              onCheckedChange={(value) => patchAbout('domainEnabled', value)}
            />
          }
        />
        <Input
          value={about.domain}
          disabled={coreLocked || !about.domainEnabled}
          maxLength={60}
          onChange={(event) => patchAbout('domain', event.target.value)}
          placeholder="apograss.cn"
        />
      </WebSettingsInset>

      {/* Status pill (reuses today-status content) */}
      <WebSettingsRows>
        <WebSettingsRow
          htmlFor="about-status-enabled"
          title={t('webSettingsAbout.statusTitle')}
          description={t('webSettingsAbout.statusDescription')}
          action={
            <Switch
              id="about-status-enabled"
              checked={about.statusEnabled}
              disabled={coreLocked}
              onCheckedChange={(value) => patchAbout('statusEnabled', value)}
            />
          }
        />
      </WebSettingsRows>

      {/* City */}
      <WebSettingsInset className="space-y-3">
        <WebSettingsRow
          htmlFor="about-city-enabled"
          title={t('webSettingsAbout.cityTitle')}
          description={t('webSettingsAbout.cityDescription')}
          action={
            <Switch
              id="about-city-enabled"
              checked={about.cityEnabled}
              disabled={coreLocked}
              onCheckedChange={(value) => patchAbout('cityEnabled', value)}
            />
          }
        />
        <Input
          value={about.city}
          disabled={coreLocked || !about.cityEnabled}
          maxLength={60}
          onChange={(event) => patchAbout('city', event.target.value)}
          placeholder="深圳 · 福田"
        />
      </WebSettingsInset>

      {/* Email */}
      <WebSettingsInset className="space-y-3">
        <WebSettingsRow
          htmlFor="about-email-enabled"
          title={t('webSettingsAbout.emailTitle')}
          description={t('webSettingsAbout.emailDescription')}
          action={
            <Switch
              id="about-email-enabled"
              checked={about.emailEnabled}
              disabled={coreLocked}
              onCheckedChange={(value) => patchAbout('emailEnabled', value)}
            />
          }
        />
        <Input
          type="email"
          value={about.email}
          disabled={coreLocked || !about.emailEnabled}
          maxLength={120}
          onChange={(event) => patchAbout('email', event.target.value)}
          placeholder="you@example.com"
        />
      </WebSettingsInset>

      {/* GitHub */}
      <WebSettingsInset className="space-y-3">
        <WebSettingsRow
          htmlFor="about-github-enabled"
          title={t('webSettingsAbout.githubTitle')}
          description={t('webSettingsAbout.githubDescription')}
          action={
            <Switch
              id="about-github-enabled"
              checked={about.githubEnabled}
              disabled={coreLocked}
              onCheckedChange={(value) => patchAbout('githubEnabled', value)}
            />
          }
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="about-github-url">{t('webSettingsAbout.githubUrlLabel')}</Label>
            <Input
              id="about-github-url"
              value={about.githubUrl}
              disabled={coreLocked || !about.githubEnabled}
              maxLength={300}
              onChange={(event) => patchAbout('githubUrl', event.target.value)}
              placeholder="https://github.com/apograss"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="about-github-label">{t('webSettingsAbout.githubLabelLabel')}</Label>
            <Input
              id="about-github-label"
              value={about.githubLabel}
              disabled={coreLocked || !about.githubEnabled}
              maxLength={80}
              onChange={(event) => patchAbout('githubLabel', event.target.value)}
              placeholder="github.com/apograss"
            />
          </div>
        </div>
      </WebSettingsInset>

      {/* Quote */}
      <WebSettingsInset className="space-y-3">
        <WebSettingsRow
          htmlFor="about-quote-enabled"
          title={t('webSettingsAbout.quoteTitle')}
          description={t('webSettingsAbout.quoteDescription')}
          action={
            <Switch
              id="about-quote-enabled"
              checked={about.quoteEnabled}
              disabled={coreLocked}
              onCheckedChange={(value) => patchAbout('quoteEnabled', value)}
            />
          }
        />
        <div className="space-y-1.5">
          <Label htmlFor="about-quote-text">{t('webSettingsAbout.quoteTextLabel')}</Label>
          <textarea
            id="about-quote-text"
            rows={3}
            value={about.quoteText}
            disabled={coreLocked || !about.quoteEnabled}
            maxLength={300}
            onChange={(event) => patchAbout('quoteText', event.target.value)}
            className="w-full rounded-md border bg-background px-2.5 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60 sm:px-3"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="about-quote-source">{t('webSettingsAbout.quoteSourceLabel')}</Label>
          <Input
            id="about-quote-source"
            value={about.quoteSource}
            disabled={coreLocked || !about.quoteEnabled}
            maxLength={60}
            onChange={(event) => patchAbout('quoteSource', event.target.value)}
            placeholder="— hitokoto · 子集"
          />
        </div>
      </WebSettingsInset>

      {/* Figure */}
      <WebSettingsInset className="space-y-4">
        <WebSettingsRow
          htmlFor="about-figure-enabled"
          title={t('webSettingsAbout.figureTitle')}
          description={t('webSettingsAbout.figureDescription')}
          action={
            <Switch
              id="about-figure-enabled"
              checked={about.figureEnabled}
              disabled={coreLocked}
              onCheckedChange={(value) => patchAbout('figureEnabled', value)}
            />
          }
        />
        <div className="space-y-1.5">
          <Label htmlFor="about-figure-image">{t('webSettingsAbout.figureImageLabel')}</Label>
          <Input
            id="about-figure-image"
            value={about.figureImage}
            disabled={coreLocked || !about.figureEnabled}
            onChange={(event) => patchAbout('figureImage', event.target.value)}
            placeholder={DEFAULT_FIGURE_IMAGE}
          />
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t('webSettingsAbout.figureImageDescription')}
          </p>
        </div>
        <FileSelectTrigger
          accept="image/*"
          buttonLabel={
            uploadingFigure
              ? t('webSettingsAbout.figureUploading')
              : t('webSettingsAbout.figureUploadButton')
          }
          emptyLabel={t('common.noFileSelected')}
          disabled={coreLocked || !about.figureEnabled || uploadingFigure}
          onSelect={(file) => void onFigureSelected(file)}
        />
        <div
          className="h-40 rounded-lg border border-border/60 bg-muted bg-cover bg-center"
          style={BuildBackgroundImageStyle(figurePreview)}
          role="img"
          aria-label={t('webSettingsAbout.figurePreviewAlt')}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="about-figure-label">{t('webSettingsAbout.figureLabelLabel')}</Label>
            <Input
              id="about-figure-label"
              value={about.figureLabel}
              disabled={coreLocked || !about.figureEnabled}
              maxLength={60}
              onChange={(event) => patchAbout('figureLabel', event.target.value)}
              placeholder="profile · 2026 spring"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="about-figure-caption">
              {t('webSettingsAbout.figureCaptionLabel')}
            </Label>
            <Input
              id="about-figure-caption"
              value={about.figureCaption}
              disabled={coreLocked || !about.figureEnabled}
              maxLength={40}
              onChange={(event) => patchAbout('figureCaption', event.target.value)}
              placeholder="2026 · 春"
            />
          </div>
        </div>
      </WebSettingsInset>
    </WebSettingsSection>
  )
}
