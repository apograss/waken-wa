'use client'

import { useAtom } from 'jotai'
import { useT } from 'next-i18next/client'

import {
  WebSettingsInset,
  WebSettingsSection,
} from '@/components/admin/web-settings-layout'
import {
  webSettingsFormAtom,
  webSettingsMigrationAtom,
} from '@/components/admin/web-settings-store'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { FooterBeianFields } from '@/lib/footer-beian'

export function FooterBeianPanel() {
  const { t } = useT('admin')
  const [form, setForm] = useAtom(webSettingsFormAtom)
  const [migration] = useAtom(webSettingsMigrationAtom)
  const coreLocked = migration?.heavyEditingLocked === true
  const beian = form.footerBeian

  const patchBeian = <K extends keyof FooterBeianFields>(
    key: K,
    value: FooterBeianFields[K],
  ) => {
    setForm((prev) => ({
      ...prev,
      footerBeian: { ...prev.footerBeian, [key]: value },
    }))
  }

  return (
    <WebSettingsSection
      title={t('webSettingsBeian.title')}
      description={t('webSettingsBeian.description')}
    >
      <WebSettingsInset className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="beian-icp">{t('webSettingsBeian.icpLabel')}</Label>
          <Input
            id="beian-icp"
            value={beian.icpText}
            disabled={coreLocked}
            maxLength={80}
            onChange={(event) => patchBeian('icpText', event.target.value)}
            placeholder="粤ICP备XXXXXXXX号-1"
          />
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t('webSettingsBeian.icpDescription')}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="beian-gongan">{t('webSettingsBeian.publicSecurityLabel')}</Label>
          <Input
            id="beian-gongan"
            value={beian.publicSecurityText}
            disabled={coreLocked}
            maxLength={80}
            onChange={(event) => patchBeian('publicSecurityText', event.target.value)}
            placeholder="粤公网安备XXXXXXXXXXXXXX号"
          />
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t('webSettingsBeian.publicSecurityDescription')}
          </p>
        </div>
      </WebSettingsInset>
    </WebSettingsSection>
  )
}
