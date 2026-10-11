import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

type Props = {
  autoSend: boolean
  runAt: [string, string]
  onAutoSend: (value: boolean) => void
  onTime: (index: 0 | 1, value: string) => void
}

export function SchedulePage({ autoSend, runAt, onAutoSend, onTime }: Props) {
  return (
    <div className="min-h-0 flex-1 overflow-auto p-4">
      <Card className="max-w-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>到点自动续火</CardTitle>
            <CardDescription>窗口要开着才会跑。关掉就不会自己发。</CardDescription>
          </div>
          <Switch checked={autoSend} onCheckedChange={onAutoSend} />
        </CardHeader>
        <CardContent className="grid max-w-sm gap-4">
          <Label className="grid gap-2">
            早上
            <Input type="time" value={runAt[0]} onChange={(event) => onTime(0, event.target.value)} />
          </Label>
          <Label className="grid gap-2">
            晚上
            <Input type="time" value={runAt[1]} onChange={(event) => onTime(1, event.target.value)} />
          </Label>
        </CardContent>
      </Card>
    </div>
  )
}
