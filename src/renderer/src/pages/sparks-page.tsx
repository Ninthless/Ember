import { FlameIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { sendDecision } from "@shared/decide"
import { selectId } from "@shared/select"
import { flameLabel } from "@shared/flame"
import type { SparkRow } from "@shared/inbox"
import { formatChatTime } from "@shared/preview"
type Props = {
  rows: SparkRow[]
  excluded: string[]
  picked: string[]
  busy: boolean
  onExclude: (uid: string, checked: boolean) => void
  onTest: (uid: string, checked: boolean) => void
}

export function SparksPage({ rows, excluded, picked, busy, onExclude, onTest }: Props) {
  const now = new Date()
  const due = rows.filter((row) => sendDecision(row)[0] === "due" && !excluded.includes(selectId(row))).length
  const lit = rows.filter((row) => row.flame.kind === "lit").length
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
      <div className="grid shrink-0 grid-cols-3 gap-3">
        <Stat label="今天待发" value={String(due)} />
        <Stat label="已点亮" value={String(lit)} />
        <Stat label="已排除" value={String(excluded.length)} />
      </div>
      <p className="shrink-0 text-xs text-muted-foreground">勾上排除的会话，一键续火和到点续火都不会发。测试那一列只给测试发送用，排除了的也不会测。</p>
      {rows.length === 0 ? (
        <Empty className="min-h-0 flex-1">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FlameIcon />
            </EmptyMedia>
            <EmptyTitle>{busy ? "正在读取会话" : "还没有会话"}</EmptyTitle>
            <EmptyDescription>{busy ? "等聊天页把列表带回来。" : "会话会自动读取。还没登录就先到登录页，登完不用再点。"}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Card className="min-h-0 flex-1 gap-0 py-0">
          <Table className="min-w-[980px]">
              <TableHeader className="sticky top-0 z-10 bg-card [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-card">
                <TableRow>
                  <TableHead className="w-14">排除</TableHead>
                  <TableHead className="w-14">测试</TableHead>
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
                  const id = selectId(row)
                  const [kind, label] = sendDecision(row)
                  const held = excluded.includes(id)
                  const shownLabel = held && (kind === "due" || kind === "sent") ? "已排除" : label
                  const titled = row.name && !/^\d+$/.test(row.name)
                  const title = titled ? row.name : "未命名"
                  return (
                    <TableRow key={row.conversationId} data-state={held ? "selected" : undefined}>
                      <TableCell>
                        <Checkbox
                          disabled={!id || (!row.sendTarget && !held)}
                          checked={held}
                          onCheckedChange={(checked) => onExclude(id, checked === true)}
                          aria-label={row.isGroup ? `排除群聊 ${title}` : `排除 ${title}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          disabled={!id || (!row.sendTarget && !picked.includes(id))}
                          checked={picked.includes(id)}
                          onCheckedChange={(checked) => onTest(id, checked === true)}
                          aria-label={row.isGroup ? `测试群聊 ${title}` : `测试 ${title}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex min-w-44 items-center gap-2">
                          <Avatar>
                            {row.avatarUrl ? <AvatarImage src={row.avatarUrl} alt="" /> : null}
                            <AvatarFallback>{title.slice(0, 1)}</AvatarFallback>
                          </Avatar>
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
                        <Badge variant={!held && kind === "due" ? "outline" : "secondary"}>{shownLabel}</Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
        </Card>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
      </CardHeader>
    </Card>
  )
}
