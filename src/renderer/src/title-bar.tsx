import { useTheme } from "next-themes"
import { useEffect, type CSSProperties } from "react"
import { windowChrome } from "@shared/window-chrome"
import { ModeToggle } from "./components/mode-toggle"
import { TikMark } from "./icons"

function cssColorToHex(value: string): string | null {
  const match = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/.exec(value)
  if (!match) {
    return /^#[0-9a-fA-F]{6}$/.test(value) ? value : null
  }
  const channel = (part: string) => Math.max(0, Math.min(255, Math.round(Number(part)))).toString(16).padStart(2, "0")
  return `#${channel(match[1])}${channel(match[2])}${channel(match[3])}`
}

export function TitleBar() {
  const { resolvedTheme } = useTheme()
  const chrome = window.spark?.chrome ?? windowChrome("darwin")
  useEffect(() => {
    const probe = document.createElement("span")
    probe.style.backgroundColor = "var(--sidebar)"
    document.body.append(probe)
    const color = cssColorToHex(getComputedStyle(probe).backgroundColor)
    probe.remove()
    if (color) {
      void window.spark?.window?.setBackground(color)
    }
  }, [resolvedTheme])
  return (
    <header
      className="flex h-12 shrink-0 items-center gap-2.5 bg-sidebar select-none"
      style={{ WebkitAppRegion: "drag", paddingLeft: chrome.leading, paddingRight: chrome.trailing } as CSSProperties}
    >
      <TikMark />
      <span className="min-w-0 truncate text-sm font-bold tracking-tight">Ember</span>
      <div
        className="ml-auto flex h-full items-center"
        style={{ WebkitAppRegion: "no-drag" } as CSSProperties}
      >
        <ModeToggle />
      </div>
    </header>
  )
}
