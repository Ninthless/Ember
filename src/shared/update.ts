export type UpdatePhase = "idle" | "checking" | "available" | "downloading" | "ready" | "current" | "unavailable" | "error"

export type UpdateSnapshot = {
  phase: UpdatePhase
  version: string
  current: string
  percent: number
  detail: string
}

export const RELEASES_URL = "https://github.com/Ninthless/Ember/releases/latest"
export const SOURCE_URL = "https://github.com/Ninthless/Ember"
export const ISSUES_URL = "https://github.com/Ninthless/Ember/issues"

export function idleUpdate(current: string): UpdateSnapshot {
  return { phase: "idle", version: "", current, percent: 0, detail: "" }
}
