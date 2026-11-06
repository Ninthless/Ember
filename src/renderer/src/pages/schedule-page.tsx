import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { TikIcon } from "../icons"

type Props = {
  autoSend: boolean
  runAt: [string, string]
  onAutoSend: (value: boolean) => void
  onTime: (index: 0 | 1, value: string) => void
}

const slots = [
  { index: 0 as const, label: "早上", hint: "第一次到点续火" },
  { index: 1 as const, label: "晚上", hint: "第二次到点续火" }
]

export function SchedulePage({ autoSend, runAt, onAutoSend, onTime }: Props) {
  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <section className="flex items-center gap-4 border-b px-6 py-5">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <TikIcon name="clock" filled className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-lg font-bold">到点自动续火</div>
          <div className="text-sm text-muted-foreground">窗口要开着才会跑。关掉就不会自己发。</div>
        </div>
        <Switch checked={autoSend} onCheckedChange={onAutoSend} aria-label="到点自动续火" className="h-7 w-12 data-[size=default]:h-7 data-[size=default]:w-12" />
      </section>
      {slots.map((slot) => (
        <section key={slot.label} className="flex items-center gap-4 border-b px-6 py-5">
          <span className="flex size-12 items-center justify-center rounded-full bg-secondary">
            <TikIcon name="clock" className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-bold">{slot.label}</div>
            <div className="text-sm text-muted-foreground">{slot.hint}</div>
          </div>
          <Input
            type="time"
            aria-label={slot.label}
            value={runAt[slot.index]}
            onChange={(event) => onTime(slot.index, event.target.value)}
            className="h-10 w-36 rounded-md bg-secondary text-center font-bold"
          />
        </section>
      ))}
    </div>
  )
}
