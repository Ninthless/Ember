import type { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { TikIcon } from "./icons"

export type PageId = "sparks" | "schedule" | "login" | "about"

type Page = {
  id: PageId
  label: string
  detail: string
  icon: "home" | "clock" | "inbox" | "info"
}

export const pages: Page[] = [
  { id: "sparks", label: "火花", detail: "今天待发的单聊和群聊会按顺序续。排除了的、没短号或没票据的不发。", icon: "home" },
  { id: "schedule", label: "定时", detail: "窗口开着才会到点续。默认不自动发。", icon: "clock" },
  { id: "login", label: "登录", detail: "在这里的聊天页登录。登完会自己读取。", icon: "inbox" },
  { id: "about", label: "关于", detail: "版本、自动更新、免责声明和开源许可。", icon: "info" }
]

type NavProps = {
  page: PageId
  onPage: (page: PageId) => void
}

export function AppNav({ page, onPage }: NavProps) {
  return (
    <nav className="flex w-[220px] shrink-0 flex-col gap-1 bg-sidebar px-2 pt-3">
      {pages.map((item) => {
        const active = page === item.id
        return (
          <button
            key={item.id}
            type="button"
            aria-current={active ? "page" : undefined}
            onClick={() => onPage(item.id)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[17px] font-bold transition-colors",
              active ? "bg-sidebar-accent text-sidebar-foreground" : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}
          >
            <TikIcon name={item.icon} filled={active} className="size-5" />
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}

type HeaderProps = {
  page: PageId
  status: { title: string; signedIn: boolean }
  busy: boolean
  onReload: () => void
}

export function PageHeader({ page, status, busy, onReload }: HeaderProps) {
  const current = pages.find((item) => item.id === page) ?? pages[0]
  return (
    <header className="flex min-h-16 shrink-0 items-center gap-3 border-b px-6 py-3">
      <div className="min-w-0 flex-1">
        <div className="truncate text-[22px] leading-none font-bold tracking-tight">{current.label}</div>
        <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{current.detail}</div>
      </div>
      {page === "login" ? (
        <>
          <Badge variant={status.signedIn ? "default" : "secondary"} className="h-7 rounded-full px-3">
            {status.title}
          </Badge>
          <Button variant="outline" disabled={busy} onClick={onReload} title="重载聊天页并重新读取登录态，不发送" className="h-9 rounded-md px-4 font-bold">
            <TikIcon name="refresh" className="size-4" />
            刷新页面
          </Button>
        </>
      ) : null}
    </header>
  )
}

export function Shell({ nav, header, children }: { nav: ReactNode; header: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      {nav}
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-l bg-background">
        {header}
        {children}
      </main>
    </div>
  )
}
