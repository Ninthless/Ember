import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { sendDecision } from "@shared/decide"
import { flameLabel } from "@shared/flame"
import type { SparkRow } from "@shared/inbox"
import { formatChatTime } from "@shared/preview"
type Props = {
  rows: SparkRow[]
  limited: boolean
  picked: string[]
  busy: boolean
  onLimited: (value: boolean) => void
  onToggle: (uid: string, checked: boolean) => void
}

export function SparksPage({ rows, limited, picked, busy, onLimited, onToggle }: Props) {
  const now = new Date()
  const due = rows.filter((row) => sendDecision(row)[0] === "due").length
  const lit = rows.filter((row) => row.flame.kind === "lit").length
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
      <div className="grid shrink-0 grid-cols-3 gap-3">
        <Stat label="今天待发" value={String(due)} />
        <Stat label="已点亮" value={String(lit)} />
        <Stat label="已勾选" value={String(picked.length)} />
      </div>
      <div className="flex shrink-0 items-center justify-between gap-4 rounded-lg border bg-card px-4 py-3">
        <div className="min-w-0">
          <div className="text-sm font-medium">限定名单</div>
          <p className="text-xs text-muted-foreground">{limited ? "只续勾选的人。一个都不勾，就不会发。" : "关闭时，今天待发的单聊都会按顺序续。"}</p>
        </div>
        <Switch checked={limited} onCheckedChange={onLimited} />
      </div>
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border bg-card">
        {rows.length === 0 ? (
          <p className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">{busy ? "正在读取会话。" : "会话会自动读取。还没登录就先到登录页，登完不用再点。"}</p>
        ) : (
          <Table className="min-w-[920px]">
              <TableHeader className="sticky top-0 z-10 bg-card [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-card">
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>好友</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>火花</TableHead>
                  <TableHead>天数</TableHead>
                  <TableHead>最近</TableHead>
                  <TableHead>时间</TableHead>
                  <TableHead>你</TableHead>
                  <TableHead>对方</TableHead>
                  <TableHead>今天</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const [kind, label] = sendDecision(row)
                  const titled = row.name && !/^\d+$/.test(row.name)
                  const title = titled ? row.name : "未命名"
                  return (
                    <TableRow key={row.conversationId}>
                      <TableCell>
                        <input
                          type="checkbox"
                          className="size-4"
                          disabled={!row.sendTarget}
                          checked={picked.includes(row.peerUid)}
                          onChange={(event) => onToggle(row.peerUid, event.target.checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex min-w-44 items-center gap-2">
                          {row.avatarUrl ? (
                            <img src={row.avatarUrl} alt="" className="size-8 shrink-0 rounded-full object-cover" />
                          ) : (
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs">{title.slice(0, 1)}</span>
                          )}
                          <div className="min-w-0">
                            <div className="truncate">{title}</div>
                            {row.uniqueId ? <div className="truncate text-xs text-muted-foreground">{row.uniqueId}</div> : null}
                            {!titled && row.peerUid ? <div className="truncate text-xs text-muted-foreground">{row.peerUid}</div> : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{row.isGroup ? "群聊" : "单聊"}</TableCell>
                      <TableCell>
                        <Badge variant={row.flame.kind === "lit" ? "default" : "secondary"}>{flameLabel(row.flame)}</Badge>
                      </TableCell>
                      <TableCell>{row.flame.days ?? "—"}</TableCell>
                      <TableCell className="max-w-56 truncate">{row.lastText || "—"}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatChatTime(row.lastAt, now) || "—"}</TableCell>
                      <TableCell>{row.iSentToday ? "发过" : "没发"}</TableCell>
                      <TableCell>{row.otherSentToday ? (row.isGroup ? "其他人发过" : "发过") : "没发"}</TableCell>
                      <TableCell>
                        <Badge variant={kind === "due" ? "outline" : "secondary"}>{label}</Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  )
}
