type Settings = {
  autoSend: boolean
  runAt: [string, string]
  limited: boolean
  picked: string[]
  lastSlot: string
}

interface SparkApi {
  getSettings: () => Promise<Settings>
  saveSettings: (settings: Settings) => Promise<Settings>
}

declare global {
  interface Window {
    spark: SparkApi
  }
}

export {}
