type Settings = {
  autoSend: boolean
  runAt: [string, string]
  picked: string[]
  excluded: string[]
  lastSlot: string
}

type UpdatePhase = "idle" | "checking" | "available" | "downloading" | "ready" | "current" | "unavailable" | "error"

type UpdateSnapshot = {
  phase: UpdatePhase
  version: string
  current: string
  percent: number
  detail: string
}

type WindowChrome = {
  platform: "darwin" | "win32" | "linux"
  height: number
  leading: number
  trailing: number
}

interface SparkApi {
  chrome?: WindowChrome
  getSettings: () => Promise<Settings>
  saveSettings: (settings: Settings) => Promise<Settings>
  window?: {
    minimize: () => Promise<void>
    toggleMaximize: () => Promise<boolean>
    close: () => Promise<void>
    isMaximized: () => Promise<boolean>
    setBackground: (color: string) => Promise<void>
    onMaximized: (listener: (value: boolean) => void) => () => void
  }
  openExternal: (url: string) => Promise<void>
  update: {
    status: () => Promise<UpdateSnapshot>
    check: () => Promise<UpdateSnapshot>
    install: () => Promise<boolean>
    onStatus: (listener: (snapshot: UpdateSnapshot) => void) => () => void
  }
}

declare global {
  interface Window {
    spark: SparkApi
  }
}

export {}
