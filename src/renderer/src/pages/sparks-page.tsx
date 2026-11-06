import { useMemo, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { flameLabel, formatChatTime, selectId, sendDecision, type SparkRow } from "@shared/spark"
import { cn } from "@/lib/utils"
import { TikIcon } from "../icons"
import { SparkList } from "./spark-list"

type Lane = "all" | "due" | "lit" | "held"

type Props = {
  rows: SparkRow[]
  excluded: string[]
  picked: string[]
  busy: boolean
  onExclude: (uid: string, checked: boolean) => void
  onTest: (uid: string, checked: boolean) => void
  onRefresh: () => void
  onTestSend: () => void
  onRenew: () => void
}

function actionLabel(kind: string): string {
  if (kind === "due") {
    return "待发"
  }
  if (kind === "sent") {
    return "已发"
  }
  if (kind === "short") {
    return "无短号"
  }
  if (kind === "ticket") {
    return "无票据"
  }
  return "不能发"
}

export function SparksPage({ rows, excluded, picked, busy, onExclude, onTest, onRefresh, onTestSend, onRenew }: Props) {
  const [lane, setLane] = useState<Lane>("all")
  const [query, setQuery] = useState("")
  const now = new Date()
  const due = rows.filter((row) => sendDecision(row)[0] === "due" && !excluded.includes(selectId(row))).length
  const lit = rows.filter((row) => row.flame.kind === "lit").length
  const lanes: Array<{ id: Lane; label: string; count: number }> = [
    { id: "all", label: "全部", count: rows.length },
    { id: "due", label: "待发", count: due },
    { id: "lit", label: "已点亮", count: lit },
    { id: "held", label: "已排除", count: excluded.length }
  ]
  const visible = useMemo(() => {
    const text = query.trim().toLowerCase()
    return rows.filter((row) => {
      const id = selectId(row)
      const held = excluded.includes(id)
      const kind = sendDecision(row)[0]
      const inLane =
        lane === "all" ||
        (lane === "due" && kind === "due" && !held) ||
        (lane === "lit" && row.flame.kind === "lit") ||
        (lane === "held" && held)
      if (!inLane) {
        return false
      }
      if (!text) {
        return true
      }
      return [row.name, row.uniqueId, row.peerUid, row.lastText].some((part) => part.toLowerCase().includes(text))
    })
  }, [rows, excluded, lane, query])
  const pickedCount = rows.filter((row) => picked.includes(selectId(row)) && !excluded.includes(selectId(row))).length
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-3 px-6 pt-3">
        <div className="relative min-w-0 flex-1">
          <TikIcon name="search" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索会话"
            aria-label="搜索会话"
            className="h-10 rounded-full border-transparent bg-secondary pr-4 pl-9"
          />
        </div>
        <Button variant="outline" disabled={busy} onClick={onRefresh} title="重新读取会话列表，不发消息" className="h-10 rounded-md px-4 font-bold">
          <TikIcon name="refresh" className={cn("size-4", busy && "animate-spin")} />
          刷新
        </Button>
        <Button variant="outline" disabled={busy} onClick={onTestSend} title="只发测试列勾上的会话。排除了的不发。今天发过也会再发" className="h-10 rounded-md px-4 font-bold">
          测试{pickedCount ? ` ${pickedCount}` : ""}
        </Button>
        <Button disabled={busy} onClick={onRenew} title="按顺序续今天待发的单聊和群聊。排除了的不发" className="h-10 rounded-md px-5 font-bold">
          <TikIcon name="send" filled className="size-4" />
          一键续火{due ? ` ${due}` : ""}
        </Button>
      </div>
      <div className="flex shrink-0 gap-6 border-b px-6">
        {lanes.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setLane(item.id)}
            className={cn(
              "-mb-px border-b-2 py-3 text-sm font-bold",
              lane === item.id ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
            <span className="ml-1.5 text-xs font-semibold text-muted-foreground">{item.count}</span>
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 text-center">
          <TikIcon name="home" className="size-10 text-muted-foreground" />
          <div className="text-base font-bold">{busy && rows.length === 0 ? "正在读取会话" : query ? "没有匹配的会话" : "这里还没有会话"}</div>
          <div className="max-w-sm text-sm text-muted-foreground">
            {busy && rows.length === 0 ? "等聊天页把列表带回来。" : "会话会自动读取。还没登录就先到登录页，登完不用再点。"}
          </div>
        </div>
      ) : (
        <SparkList>
          {visible.map((row) => {
            const id = selectId(row)
            const [kind, label] = sendDecision(row)
            const held = excluded.includes(id)
            const tested = picked.includes(id)
            const titled = row.name && !/^\d+$/.test(row.name)
            const title = titled ? row.name : "未命名"
            const handle = row.uniqueId || (!titled ? row.peerUid : "")
            return (
              <li key={row.conversationId} className={cn("flex items-center gap-3 px-6 py-3 hover:bg-accent/40", held && "opacity-55")}>
                <Avatar size="lg">
                  {row.avatarUrl ? <AvatarImage src={row.avatarUrl} alt="" /> : null}
                  <AvatarFallback>{title.slice(0, 1)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-[15px] font-bold">{title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{row.isGroup ? "群聊" : "单聊"}</span>
                  </div>
                  <div className="truncate text-sm text-muted-foreground">
                    {handle ? `@${handle} · ` : ""}
                    {row.lastText || "还没有消息"}
                    {row.lastAt ? ` · ${formatChatTime(row.lastAt, now)}` : ""}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={cn("font-bold", row.flame.kind === "lit" && "text-primary")}>{row.flame.days ?? "—"} 天</span>
                    <span>{flameLabel(row.flame)}</span>
                    <span>{held ? "已排除" : label}</span>
                    <span>{row.iSentToday ? "你发过" : "你没发"}</span>
                    <span>{row.otherSentToday ? (row.isGroup ? "其他人发过" : "对方发过") : "对方没发"}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    variant={tested ? "default" : "outline"}
                    disabled={!id || (!row.sendTarget && !tested)}
                    onClick={() => onTest(id, !tested)}
                    aria-pressed={tested}
                    title="勾上后，测试发送会发这个会话。今天发过也会再发"
                    className="h-9 w-[5.5rem] rounded-md font-bold"
                  >
                    {tested ? "已测试" : "测试"}
                  </Button>
                  <Button
                    variant={held ? "secondary" : kind === "due" ? "default" : "outline"}
                    disabled={!id || (!row.sendTarget && !held)}
                    onClick={() => onExclude(id, !held)}
                    aria-pressed={held}
                    title={held ? "已排除。再点可恢复，一键续火和定时可以再发" : `${label}。点一下会排除，一键续火、定时和测试都不发`}
                    className="h-9 w-[5.5rem] rounded-md font-bold"
                  >
                    {held ? "已排除" : actionLabel(kind)}
                  </Button>
                </div>
              </li>
            )
          })}
        </SparkList>
      )}
    </div>
  )
}
