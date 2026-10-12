import { CopyIcon, FlameIcon, MinusIcon, SquareIcon, XIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState, type CSSProperties } from "react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "./components/mode-toggle"

function cssColorToHex(value: string): string | null {
  const match = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/.exec(value)
  if (!match) {
    return /^#[0-9a-fA-F]{6}$/.test(value) ? value : null
  }
  const channel = (part: string) => Math.max(0, Math.min(255, Math.round(Number(part)))).toString(16).padStart(2, "0")
  return `#${channel(match[1])}${channel(match[2])}${channel(match[3])}`
}

export function TitleBar() {
  const [maximized, setMaximized] = useState(false)
  const { resolvedTheme } = useTheme()
  useEffect(() => {
    const controls = window.spark.window
    if (!controls) {
      return
    }
    void controls.isMaximized().then(setMaximized)
    return controls.onMaximized(setMaximized)
  }, [])
  useEffect(() => {
    const probe = document.createElement("span")
    probe.style.backgroundColor = "var(--sidebar)"
    document.body.append(probe)
    const color = cssColorToHex(getComputedStyle(probe).backgroundColor)
    probe.remove()
    if (color) {
      void window.spark.window?.setBackground(color)
    }
  }, [resolvedTheme])
  const controls = window.spark.window
  return (
    <header
      className="flex h-10 shrink-0 items-center border-b border-sidebar-border bg-sidebar pl-3 select-none"
      style={{ WebkitAppRegion: "drag" } as CSSProperties}
      onDoubleClick={() => void controls?.toggleMaximize()}
    >
      <span className="flex size-5 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
        <FlameIcon className="size-3" />
      </span>
      <span className="ml-2 text-sm font-medium">Ember</span>
      <div
        className="ml-auto flex h-full items-center gap-0.5 pr-1"
        style={{ WebkitAppRegion: "no-drag" } as CSSProperties}
        onDoubleClick={(event) => event.stopPropagation()}
      >
        <ModeToggle />
        <Button variant="ghost" size="icon" onClick={() => void controls?.minimize()} aria-label="最小化">
          <MinusIcon />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => void controls?.toggleMaximize()} aria-label={maximized ? "还原" : "最大化"}>
          {maximized ? <CopyIcon /> : <SquareIcon />}
        </Button>
        <Button variant="ghost" size="icon" className="hover:bg-destructive/10 hover:text-destructive" onClick={() => void controls?.close()} aria-label="关闭">
          <XIcon />
        </Button>
      </div>
    </header>
  )
}
