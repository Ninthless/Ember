export type Settings = {
  autoSend: boolean
  runAt: [string, string]
  limited: boolean
  picked: string[]
  lastSlot: string
}

export const DEFAULT_SETTINGS: Settings = {
  autoSend: false,
  runAt: ["10:05", "21:05"],
  limited: false,
  picked: [],
  lastSlot: ""
}

export function normalizeSettings(input: unknown): Settings {
  const raw = input && typeof input === "object" ? (input as Record<string, unknown>) : {}
  return {
    autoSend: raw.autoSend === true,
    runAt: normalizeTimes(raw.runAt),
    limited: raw.limited === true,
    picked: uniqueDigits(raw.picked),
    lastSlot: typeof raw.lastSlot === "string" ? raw.lastSlot.slice(0, 32) : ""
  }
}

function normalizeTimes(value: unknown): [string, string] {
  const fallback = DEFAULT_SETTINGS.runAt
  if (!Array.isArray(value) || value.length < 2) {
    return [...fallback]
  }
  const first = clock(value[0], fallback[0])
  const second = clock(value[1], fallback[1])
  return [first, second]
}

function clock(value: unknown, fallback: string): string {
  if (typeof value !== "string" || !/^\d{2}:\d{2}$/.test(value)) {
    return fallback
  }
  const [hour, minute] = value.split(":").map(Number)
  if (hour > 23 || minute > 59) {
    return fallback
  }
  return value
}

function uniqueDigits(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }
  const seen = new Set<string>()
  for (const item of value) {
    if (typeof item === "string" && /^\d+$/.test(item)) {
      seen.add(item)
    }
  }
  return [...seen]
}
