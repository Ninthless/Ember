import type { WebviewTag } from "electron"
import { useEffect, useRef, useState } from "react"
import { Clock3Icon, FlameIcon, LogInIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarSeparator } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { frontierCursorScript } from "@shared/frontier-watch"
import { applySentToday, type SparkRow } from "@shared/inbox"
import { dueBlocked } from "@shared/select"
import { DEFAULT_SETTINGS, normalizeSettings, type Settings } from "@shared/settings"
import { ChatFrame } from "./chat-frame"
import { CHAT_URL } from "./guest"
import { LoginPage } from "./pages/login-page"
import { SchedulePage } from "./pages/schedule-page"
import { SparksPage } from "./pages/sparks-page"
import { enrichInbox, readInbox, readProfile, renewDue, sendChecked, type ProfileView, type RenewResult } from "./renew"

type PageId = "sparks" | "schedule" | "login"
type Guest = WebviewTag

const pages: Array<{ id: PageId; label: string; detail: string; icon: typeof FlameIcon }> = [
  { id: "sparks", label: "火花", detail: "单聊按顺序续。群聊不发。", icon: FlameIcon },
  { id: "schedule", label: "定时", detail: "窗口开着才会到点续。默认不自动发。", icon: Clock3Icon },
  { id: "login", label: "登录", detail: "在下面的聊天页登录。登完会自己读取。", icon: LogInIcon }
]

export default function App() {
  const guestRef = useRef<Guest | null>(null)
  const settingsRef = useRef<Settings>(DEFAULT_SETTINGS)
  const running = useRef(false)
  const sending = useRef(false)
  const listing = useRef(false)
  const loaded = useRef(false)
  const settleTimer = useRef(0)
  const [page, setPage] = useState<PageId>("sparks")
  const [ready, setReady] = useState(false)
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [rows, setRows] = useState<SparkRow[]>([])
  const [profile, setProfile] = useState<ProfileView | null>(null)
  const [busy, setBusy] = useState(false)
  const [kicked, setKicked] = useState(false)
  const [notice, setNotice] = useState<RenewResult | null>(null)

  useEffect(() => {
    void window.spark.getSettings().then((loaded) => {
      const next = normalizeSettings(loaded)
      settingsRef.current = next
      setSettings(next)
    })
  }, [])

  useEffect(() => {
    if (!ready) {
      return
    }
    const tick = () => {
      if (!loaded.current) {
        void ensureLoaded()
      }
    }
    tick()
    const timer = window.setInterval(tick, 3000)
    return () => window.clearInterval(timer)
  }, [ready])

  useEffect(() => {
    if (!ready) {
      return
    }
    let cursor = -1
    let refreshedAt = 0
    const timer = window.setInterval(() => {
      void followLive()
    }, 4000)
    return () => window.clearInterval(timer)

    async function followLive() {
      const guest = guestRef.current
      if (!guest || !loaded.current || running.current || sending.current || listing.current) {
        return
      }
      let seq = cursor
      try {
        seq = Number(await guest.executeJavaScript(frontierCursorScript(), true)) || 0
      } catch {
        seq = cursor
      }
      const moved = cursor >= 0 && seq !== cursor
      cursor = seq
      if (!moved && Date.now() - refreshedAt < 8000) {
        return
      }
      if (running.current || sending.current || listing.current || !loaded.current) {
        return
      }
      running.current = true
      try {
        await refreshQuiet(guest)
        refreshedAt = Date.now()
      } finally {
        running.current = false
      }
    }
  }, [ready])

  useEffect(() => {
    if (!settings.autoSend || !ready) {
      return
    }
    const timer = window.setInterval(() => {
      void runSlot()
    }, 20000)
    return () => window.clearInterval(timer)
  }, [settings.autoSend, ready])

  async function save(next: Settings) {
    const stored = normalizeSettings(await window.spark.saveSettings(next))
    settingsRef.current = stored
    setSettings(stored)
  }

  async function ensureLoaded() {
    if (running.current || loaded.current) {
      return
    }
    running.current = true
    try {
      const guest = requireGuest()
      const nextProfile = await readProfile(guest)
      setProfile(nextProfile)
      if (!nextProfile.signedIn) {
        return
      }
      setBusy(true)
      setKicked(false)
      const parsed = await readInbox(guest, nextProfile)
      setRows(parsed)
      try {
        setRows(await enrichInbox(guest, parsed))
      } catch {
        setRows(parsed)
      }
      loaded.current = true
    } catch {
      loaded.current = false
    } finally {
      running.current = false
      setBusy(false)
    }
  }

  async function prepare() {
    const guest = requireGuest()
    const nextProfile = await readProfile(guest)
    setProfile(nextProfile)
    const parsed = await readInbox(guest, nextProfile)
    setRows(parsed)
    let source = parsed
    try {
      source = await enrichInbox(guest, parsed)
      setRows(source)
    } catch {
      source = parsed
    }
    return { guest, profile: nextProfile, rows: source }
  }

  async function reloadRows(guest: Guest, profile: ProfileView, sentUids: string[]) {
    try {
      const parsed = await readInbox(guest, profile)
      let source = parsed
      try {
        source = await enrichInbox(guest, parsed)
      } catch {
        source = parsed
      }
      setRows(applySentToday(source, sentUids))
    } catch {
      setRows((currentRows) => applySentToday(currentRows, sentUids))
    }
  }

  async function refreshQuiet(guest: Guest) {
    try {
      const nextProfile = await readProfile(guest)
      setProfile(nextProfile)
      if (!nextProfile.signedIn) {
        loaded.current = false
        return
      }
      const parsed = await readInbox(guest, nextProfile)
      let source = parsed
      try {
        source = await enrichInbox(guest, parsed)
      } catch {
        source = parsed
      }
      setRows(source)
    } catch (error) {
      const detail = error instanceof Error ? error.message : ""
      if (detail.includes("decision=KICK") || detail.includes("登录弹掉") || detail.includes("没有可用登录态")) {
        loaded.current = false
        setKicked(detail.includes("KICK") || detail.includes("弹掉"))
      }
    }
  }

  async function runSend(send: (prepared: Awaited<ReturnType<typeof prepare>>, picked: string[], limited: boolean) => Promise<RenewResult>): Promise<RenewResult> {
    if (sending.current) {
      return { stopped: "none", lines: [] }
    }
    sending.current = true
    setBusy(true)
    try {
      while (running.current) {
        await wait(100)
      }
      running.current = true
      try {
        const prepared = await prepare()
        const current = settingsRef.current
        const result = await send(prepared, current.picked, current.limited)
        setNotice(result)
        setKicked(result.stopped === "kick")
        const sentUids = result.lines.filter((line) => line.status === "sent").map((line) => line.uid)
        if (result.stopped === "kick") {
          loaded.current = false
          setRows((currentRows) => applySentToday(currentRows, sentUids))
        } else {
          await reloadRows(prepared.guest, prepared.profile, sentUids)
        }
        return result
      } finally {
        running.current = false
      }
    } catch (error) {
      const result: RenewResult = {
        stopped: "login",
        lines: [{ uid: "", name: "", status: "failed", detail: error instanceof Error ? error.message : "读取失败" }]
      }
      setNotice(result)
      return result
    } finally {
      sending.current = false
      setBusy(false)
    }
  }

  function renew(): Promise<RenewResult> {
    return runSend((prepared, picked, limited) => renewDue(prepared.guest, prepared.profile, prepared.rows, limited, picked))
  }

  function reloadChat() {
    const guest = guestRef.current
    if (!guest || sending.current) {
      return
    }
    loaded.current = false
    try {
      guest.reload()
    } catch {
      void guest.loadURL(CHAT_URL)
    }
  }

  function testSend(): Promise<RenewResult> {
    return runSend((prepared, picked) => sendChecked(prepared.guest, prepared.profile, prepared.rows, picked))
  }

  async function refreshList() {
    if (sending.current || listing.current) {
      return
    }
    listing.current = true
    setBusy(true)
    try {
      while (running.current) {
        await wait(100)
      }
      running.current = true
      try {
        const guest = requireGuest()
        const nextProfile = await readProfile(guest)
        setProfile(nextProfile)
        if (!nextProfile.signedIn) {
          loaded.current = false
          setNotice({
            stopped: "login",
            lines: [{ uid: "", name: "", status: "failed", detail: nextProfile.detail }]
          })
          return
        }
        setKicked(false)
        const parsed = await readInbox(guest, nextProfile)
        let source = parsed
        try {
          source = await enrichInbox(guest, parsed)
        } catch {
          source = parsed
        }
        setRows(source)
        loaded.current = true
      } finally {
        running.current = false
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : "读取失败"
      const kickedNow = detail.includes("decision=KICK") || detail.includes("登录弹掉")
      if (kickedNow || detail.includes("没有可用登录态")) {
        loaded.current = false
        setKicked(kickedNow)
      }
      setNotice({
        stopped: kickedNow ? "kick" : "login",
        lines: [{ uid: "", name: "", status: "failed", detail }]
      })
    } finally {
      listing.current = false
      setBusy(false)
    }
  }

  async function runSlot() {
    const current = settingsRef.current
    const now = new Date()
    const clock = `${pad(now.getHours())}:${pad(now.getMinutes())}`
    if (!current.autoSend || !current.runAt.includes(clock) || running.current || sending.current) {
      return
    }
    const slot = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}|${clock}`
    if (current.lastSlot === slot) {
      return
    }
    const result = await renew()
    if (result.stopped === "none") {
      await save({ ...settingsRef.current, lastSlot: slot })
    }
  }

  function scheduleLoad() {
    window.clearTimeout(settleTimer.current)
    settleTimer.current = window.setTimeout(() => void ensureLoaded(), 900)
  }

  function requireGuest(): Guest {
    const guest = guestRef.current
    if (!guest || !ready) {
      throw new Error("聊天页还没打开")
    }
    return guest
  }

  const current = pages.find((item) => item.id === page) ?? pages[0]
  const status = accountStatus(profile, kicked, busy)
  const renewBlocked = dueBlocked(settings.limited, settings.picked)

  return (
    <TooltipProvider>
      <SidebarProvider className="h-svh gap-2 overflow-hidden bg-sidebar p-2">
        <Sidebar collapsible="none" className="h-auto min-h-0 rounded-xl border border-sidebar-border">
          <SidebarHeader className="px-3 py-4">
            <div className="flex items-center gap-2">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <FlameIcon className="size-4" />
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">Ember</div>
                <div className="truncate text-xs text-sidebar-foreground/70">单聊续火</div>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {pages.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton isActive={page === item.id} onClick={() => setPage(item.id)}>
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarSeparator />
          <SidebarFooter>
            <div className="rounded-lg border border-sidebar-border px-3 py-2">
              <div className="text-xs text-sidebar-foreground/70">当前账号</div>
              <div className="truncate text-sm font-medium">{status.title}</div>
              <div className="truncate text-xs text-sidebar-foreground/70">{status.detail}</div>
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="min-h-0 min-w-0 overflow-hidden rounded-xl border bg-background shadow-sm">
          <header className="flex h-14 shrink-0 items-center gap-4 border-b px-4">
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{current.label}</div>
              <div className="truncate text-xs text-muted-foreground">{current.detail}</div>
            </div>
            {page === "sparks" ? (
              <div className="flex shrink-0 items-center gap-2">
                <Button variant="outline" disabled={busy} onClick={() => void refreshList()}>
                  刷新列表
                </Button>
                <Button variant="outline" disabled={busy} onClick={() => void testSend()}>
                  测试发送
                </Button>
                <Button disabled={busy || renewBlocked} title={renewBlocked ? "限定名单开着，但一个都没勾" : "按顺序续今天待发的单聊"} onClick={() => void renew()}>
                  一键续火
                </Button>
              </div>
            ) : null}
            {page === "login" ? (
              <div className="flex shrink-0 items-center gap-2">
                <Button variant="outline" disabled={busy} onClick={reloadChat}>
                  刷新页面
                </Button>
                <Badge variant={status.signedIn ? "default" : "secondary"}>{status.title}</Badge>
              </div>
            ) : null}
          </header>
          {notice ? (
            <div className="shrink-0 px-4 pt-4">
              <Alert variant={notice.stopped === "kick" ? "destructive" : "default"}>
                <AlertTitle>{notice.stopped === "kick" ? "登录被弹掉了" : "结果"}</AlertTitle>
                <AlertDescription>{notice.lines.map((line) => `${line.name || line.uid || "会话"} ${line.detail}`).join("；")}</AlertDescription>
              </Alert>
            </div>
          ) : null}
          {page === "sparks" ? (
            <SparksPage
              rows={rows}
              limited={settings.limited}
              picked={settings.picked}
              busy={busy}
              onLimited={(limited) => void save({ ...settings, limited })}
              onToggle={(uid, checked) => {
                const picked = checked ? [...settings.picked, uid] : settings.picked.filter((item) => item !== uid)
                void save({ ...settings, picked })
              }}
            />
          ) : null}
          {page === "schedule" ? (
            <SchedulePage
              autoSend={settings.autoSend}
              runAt={settings.runAt}
              onAutoSend={(autoSend) => void save({ ...settings, autoSend })}
              onTime={(index, value) => {
                const runAt: [string, string] = [...settings.runAt]
                runAt[index] = value
                void save({ ...settings, runAt })
              }}
            />
          ) : null}
          {page === "login" ? <LoginPage /> : null}
          <ChatFrame visible={page === "login"} guestRef={guestRef} onReady={() => setReady(true)} onSettled={scheduleLoad} />
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}

function accountStatus(profile: ProfileView | null, kicked: boolean, busy: boolean): { title: string; detail: string; signedIn: boolean } {
  if (kicked) {
    return { title: "登录被弹掉", detail: "重新登录后再用", signedIn: false }
  }
  if (profile?.signedIn) {
    const nickname = profile.nickname.trim()
    const named = nickname !== "" && nickname.toLowerCase() !== "none"
    return { title: named ? nickname : "已登录", detail: "会话会自动读取", signedIn: true }
  }
  if (busy) {
    return { title: "正在读取", detail: "等聊天页返回", signedIn: false }
  }
  return { title: "未登录", detail: "先到登录页", signedIn: false }
}

function pad(value: number): string {
  return String(value).padStart(2, "0")
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}
