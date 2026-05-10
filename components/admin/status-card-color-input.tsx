import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ToStatusCardHexColor } from '@/lib/status-card-preview'

export function StatusCardColorInput({
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
          onChange={(event) => onChange(ToStatusCardHexColor(event.target.value, value))}
          className="font-mono text-xs"
        />
      </div>
    </div>
  )
}
