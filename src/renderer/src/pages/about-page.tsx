import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ISSUES_URL, RELEASES_URL, SOURCE_URL, idleUpdate, type UpdateSnapshot } from "@shared/update"
import { TikIcon } from "../icons"

const notices = [
  {
    title: "免责声明",
    body: "Ember 只在你自己已经登录的会话里，帮你发出你这一侧的消息。它不绕过平台限制，也不替别人发送。账号、发送内容和因此产生的后果由你自己负责。登录态只留在这台电脑的本应用里。"
  },
  {
    title: "无关声明",
    body: "Ember 与抖音、字节跳动没有隶属、认可或赞助关系。界面里的抖音页面属于该平台，本应用不代表该平台。"
  },
  {
    title: "许可与担保",
    body: "这个公开界面以 MIT 发布，Copyright (C) 2026 Ninthless。保留版权声明即可使用、修改和再分发。本程序不提供任何担保。聊天与发送协议不在这个公开仓库里。"
  },
  {
    title: "安装包与更新",
    body: "安装包没有代码签名。Windows 安装版和 Linux 安装版可以自动下载并在重启后安装。未签名的 Mac 包不能自动安装，请到发布页下载新版本。定时只在窗口开着时运行。"
  }
]

const links = [
  { label: "发布页", url: RELEASES_URL },
  { label: "源码", url: SOURCE_URL },
  { label: "问题反馈", url: ISSUES_URL }
]

export function AboutPage() {
  const [update, setUpdate] = useState<UpdateSnapshot>(() => idleUpdate(""))

  useEffect(() => {
    const updateApi = window.spark?.update
    if (!updateApi) {
      setUpdate({
        phase: "unavailable",
        version: "",
        current: "",
        percent: 0,
        detail: "当前窗口还是旧进程。重新启动开发服务后才能检查更新。"
      })
      return
    }
    let alive = true
    void updateApi.status().then((snapshot) => {
      if (alive) {
        setUpdate(snapshot)
      }
    }).catch(() => {
      if (alive) {
        setUpdate({
          phase: "error",
          version: "",
          current: "",
          percent: 0,
          detail: "读取更新状态失败"
        })
      }
    })
    const stop = updateApi.onStatus((snapshot) => setUpdate(snapshot))
    return () => {
      alive = false
      stop()
    }
  }, [])

  const version = update.current === "" ? "—" : update.current
  const busy = update.phase === "checking" || update.phase === "available" || update.phase === "downloading"
  const status = update.detail === "" ? "安装版启动约 8 秒后会自动检查。" : update.detail

  function open(url: string) {
    void window.spark?.openExternal(url)
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <section className="flex items-center gap-4 border-b px-6 py-5">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <TikIcon name="info" filled className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-lg font-bold">Ember</div>
          <div className="text-sm text-muted-foreground">当前版本 {version} · Ninthless · MIT</div>
        </div>
        <Button variant="outline" className="h-9 rounded-md px-4 font-bold" onClick={() => open(SOURCE_URL)}>
          主页
        </Button>
      </section>
      <section className="flex items-center gap-4 border-b px-6 py-5">
        <span className="flex size-12 items-center justify-center rounded-full bg-secondary">
          <TikIcon name={busy ? "loader" : update.phase === "ready" ? "check" : "refresh"} className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-bold">{update.version === "" ? "检查更新" : `新版本 ${update.version}`}</div>
          <div className="text-sm text-muted-foreground">{status}</div>
        </div>
        {update.phase === "ready" ? (
          <Button className="h-9 rounded-md px-4 font-bold" onClick={() => void window.spark?.update.install()}>
            重启并安装
          </Button>
        ) : (
          <Button variant="outline" disabled={busy} className="h-9 rounded-md px-4 font-bold" onClick={() => void window.spark?.update.check()}>
            {update.phase === "downloading" ? `${update.percent}%` : "检查更新"}
          </Button>
        )}
      </section>
      {notices.map((item) => (
        <section key={item.title} className="border-b px-6 py-5">
          <div className="font-bold">{item.title}</div>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{item.body}</p>
        </section>
      ))}
      <section className="flex flex-wrap gap-2 px-6 py-5">
        {links.map((item) => (
          <Button key={item.label} variant="secondary" className="h-9 rounded-md px-4 font-bold" onClick={() => open(item.url)}>
            {item.label}
          </Button>
        ))}
      </section>
    </div>
  )
}
