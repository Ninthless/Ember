type Settings = {
  autoSend: boolean
  runAt: [string, string]
  picked: string[]
  excluded: string[]
  lastSlot: string
}

interface SparkApi {
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
}

declare global {
  interface Window {
    spark: SparkApi
  }
}

export {}
