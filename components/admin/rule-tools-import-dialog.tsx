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
import { Textarea } from '@/components/ui/textarea'

type RuleToolsImportDialogT = (
  key: string,
  values?: Record<string, unknown>,
) => string

export function RuleToolsImportDialog({
  open,
  busy,
  importRulesInput,
  t,
  onOpenChange,
  onImportRulesInputChange,
  onConfirmImportRules,
}: {
  open: boolean
  busy: boolean
  importRulesInput: string
  t: RuleToolsImportDialogT
  onOpenChange: (open: boolean) => void
  onImportRulesInputChange: (value: string) => void
  onConfirmImportRules: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(92vh,52rem)] flex-col overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('webSettingsRuleTools.importDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('webSettingsRuleTools.importDialog.description')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 overflow-y-auto pr-1">
          <Label htmlFor="import-rules-input">
            {t('webSettingsRuleTools.importDialog.label')}
          </Label>
          <Textarea
            id="import-rules-input"
            rows={14}
            value={importRulesInput}
            onChange={(event) => onImportRulesInputChange(event.target.value)}
            placeholder={t('webSettingsRuleTools.importDialog.placeholder')}
            className="font-mono text-xs"
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('common.cancel')}
          </Button>
          <Button type="button" disabled={busy} onClick={onConfirmImportRules}>
            {t('webSettingsRuleTools.importDialog.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
