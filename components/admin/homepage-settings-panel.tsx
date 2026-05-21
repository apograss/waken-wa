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
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  HOMEPAGE_DEFAULT_COVER_IMAGE,
  HOMEPAGE_GREETING_CUSTOM_TEXT_MAX_LENGTH,
  HOMEPAGE_SEARCH_ENGINES,
} from '@/constants/homepage-settings'
import {
  NormalizeHomepageDefaultEngine,
  NormalizeHomepageVisibleEngines,
} from '@/lib/homepage-settings'
import type {
  HomepageGreetingSource,
  HomepageSearchEngineId,
} from '@/types/homepage-settings'

function ReadFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

function BuildBackgroundImageStyle(value: string) {
  const normalized = value.trim() || HOMEPAGE_DEFAULT_COVER_IMAGE
  return { backgroundImage: `url("${normalized.replace(/"/g, '\\"')}")` }
}

export function HomepageSettingsPanel() {
  const { t } = useT('admin')
  const [form, setForm] = useAtom(webSettingsFormAtom)
  const [migration] = useAtom(webSettingsMigrationAtom)
  const [uploadingCover, setUploadingCover] = useState(false)
  const coreLocked = migration?.heavyEditingLocked === true
  const visibleEngines = NormalizeHomepageVisibleEngines(form.homepageVisibleEngines)
  const visibleEngineSet = new Set<HomepageSearchEngineId>(visibleEngines)
  const defaultEngine = NormalizeHomepageDefaultEngine(
    form.homepageDefaultEngine,
    visibleEngines,
  )
  const coverPreview = form.homepageCoverImage.trim() || HOMEPAGE_DEFAULT_COVER_IMAGE

  const patch = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const setVisibleEngine = (engineId: HomepageSearchEngineId, checked: boolean) => {
    setForm((prev) => {
      const current = NormalizeHomepageVisibleEngines(prev.homepageVisibleEngines)
      const next = checked
        ? Array.from(new Set([...current, engineId]))
        : current.filter((item) => item !== engineId)

      if (next.length === 0) return prev

      return {
        ...prev,
        homepageVisibleEngines: next,
        homepageDefaultEngine: NormalizeHomepageDefaultEngine(
          prev.homepageDefaultEngine,
          next,
        ),
      }
    })
  }

  const onCoverSelected = async (file?: File) => {
    if (!file) return
    setUploadingCover(true)
    try {
      const dataUrl = await ReadFileAsDataUrl(file)
      const url = await uploadImageSource(dataUrl, 'homepage.cover')
      patch('homepageCoverImage', url)
      toast.success(t('webSettingsHomepage.coverUploadSuccess'))
    } catch (error) {
      console.error(error)
      toast.error(t('mutation.uploadBodyImageFailed'))
    } finally {
      setUploadingCover(false)
    }
  }

  return (
    <WebSettingsSection
      title={t('webSettingsHomepage.title')}
      description={t('webSettingsHomepage.description')}
    >
      <WebSettingsInset className="space-y-4">
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-foreground">
            {t('webSettingsHomepage.searchTitle')}
          </h4>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t('webSettingsHomepage.searchDescription')}
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {HOMEPAGE_SEARCH_ENGINES.map((engine) => {
            const checked = visibleEngineSet.has(engine.id)
            return (
              <label
                key={engine.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-sm font-normal"
              >
                <Checkbox
                  checked={checked}
                  disabled={coreLocked || (checked && visibleEngines.length === 1)}
                  onCheckedChange={(value) => setVisibleEngine(engine.id, value === true)}
                />
                <span>{t(`webSettingsHomepage.searchEngines.${engine.id}`)}</span>
              </label>
            )
          })}
        </div>

        <div className="space-y-2">
          <Label htmlFor="homepage-default-engine">
            {t('webSettingsHomepage.defaultEngineLabel')}
          </Label>
          <Select
            value={defaultEngine}
            onValueChange={(value) =>
              patch(
                'homepageDefaultEngine',
                NormalizeHomepageDefaultEngine(value, visibleEngines),
              )
            }
            disabled={coreLocked}
          >
            <SelectTrigger id="homepage-default-engine" className="w-full sm:max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HOMEPAGE_SEARCH_ENGINES.filter((engine) => visibleEngineSet.has(engine.id)).map(
                (engine) => (
                  <SelectItem key={engine.id} value={engine.id}>
                    {t(`webSettingsHomepage.searchEngines.${engine.id}`)}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>
      </WebSettingsInset>

      <WebSettingsInset className="space-y-4">
        <div className="space-y-2">
          <Label>{t('webSettingsHomepage.greetingSourceLabel')}</Label>
          <RadioGroup
            value={form.homepageGreetingSource}
            onValueChange={(value) =>
              patch(
                'homepageGreetingSource',
                value === 'custom' ? 'custom' : 'hitokoto',
              )
            }
            disabled={coreLocked}
            className="grid gap-2 sm:grid-cols-2"
          >
            {(['hitokoto', 'custom'] as HomepageGreetingSource[]).map((source) => (
              <label
                key={source}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-sm font-normal"
              >
                <RadioGroupItem value={source} />
                <span>{t(`webSettingsHomepage.greetingSources.${source}`)}</span>
              </label>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="homepage-custom-greeting">
            {t('webSettingsHomepage.customGreetingLabel')}
          </Label>
          <Input
            id="homepage-custom-greeting"
            value={form.homepageGreetingCustomText}
            maxLength={HOMEPAGE_GREETING_CUSTOM_TEXT_MAX_LENGTH}
            disabled={coreLocked || form.homepageGreetingSource !== 'custom'}
            onChange={(event) =>
              patch(
                'homepageGreetingCustomText',
                event.target.value.slice(0, HOMEPAGE_GREETING_CUSTOM_TEXT_MAX_LENGTH),
              )
            }
            placeholder={t('webSettingsHomepage.customGreetingPlaceholder')}
          />
        </div>
      </WebSettingsInset>

      <WebSettingsRows>
        <WebSettingsRow
          htmlFor="homepage-weather-enabled"
          title={t('webSettingsHomepage.weatherTitle')}
          description={t('webSettingsHomepage.weatherDescription')}
          action={
            <Switch
              id="homepage-weather-enabled"
              checked={form.homepageWeatherEnabled}
              disabled={coreLocked}
              onCheckedChange={(value) => patch('homepageWeatherEnabled', value)}
            />
          }
        />
        <WebSettingsRow
          htmlFor="homepage-demo-enabled"
          title={t('webSettingsHomepage.demoTitle')}
          description={t('webSettingsHomepage.demoDescription')}
          action={
            <Switch
              id="homepage-demo-enabled"
              checked={form.homepageDemoEnabled}
              disabled={coreLocked}
              onCheckedChange={(value) => patch('homepageDemoEnabled', value)}
            />
          }
        />
      </WebSettingsRows>

      <WebSettingsInset className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="homepage-cover-image">
            {t('webSettingsHomepage.coverImageLabel')}
          </Label>
          <Input
            id="homepage-cover-image"
            value={form.homepageCoverImage}
            disabled={coreLocked}
            onChange={(event) => patch('homepageCoverImage', event.target.value)}
            placeholder={HOMEPAGE_DEFAULT_COVER_IMAGE}
          />
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t('webSettingsHomepage.coverImageDescription')}
          </p>
        </div>

        <FileSelectTrigger
          accept="image/*"
          buttonLabel={
            uploadingCover
              ? t('webSettingsHomepage.coverUploading')
              : t('webSettingsHomepage.coverUploadButton')
          }
          emptyLabel={t('common.noFileSelected')}
          disabled={coreLocked || uploadingCover}
          onSelect={(file) => void onCoverSelected(file)}
        />

        <div className="space-y-2">
          <div
            className="h-36 rounded-lg border border-border/60 bg-muted bg-cover bg-center"
            style={BuildBackgroundImageStyle(coverPreview)}
            role="img"
            aria-label={t('webSettingsHomepage.coverPreviewAlt')}
          />
        </div>
      </WebSettingsInset>
    </WebSettingsSection>
  )
}
