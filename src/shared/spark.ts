export type FlameState = {
  kind: string
  text: string
  days: number | null
  style: string
  relation: string
  state: number | null
  recoverDays: number | null
  recoverNeedDays: number | null
  renewed: boolean
}

export type SparkRow = {
  conversationId: string
  conversationShortId: bigint
  conversationType: number
  name: string
  peerUid: string
  isGroup: boolean
  sendTarget: boolean
  flame: FlameState
  iSentToday: boolean
  otherSentToday: boolean
  ticket: string
  secUid: string
  avatarUrl: string
  uniqueId: string
  lastText: string
  lastAt: number
}

const FLAME_LABELS: Record<string, string> = {
  lit: "已点亮",
  blue: "蓝色水滴",
  gray: "今天未点亮",
  recover: "重燃中",
  pending: "待重燃",
  unknown: "未知",
  none: "无火花"
}

export function flameLabel(state: FlameState): string {
  if (state.kind === "recover" && state.text) {
    return state.text
  }
  const label = FLAME_LABELS[state.kind] ?? state.kind
  if (state.text && state.text !== label) {
    return `${label} ${state.text}`
  }
  return label
}

export function selectId(row: Pick<SparkRow, "peerUid" | "isGroup" | "conversationId">): string {
  if (row.isGroup && row.conversationId) {
    return row.conversationId
  }
  return row.peerUid
}

export function sendDecision(row: Pick<SparkRow, "sendTarget" | "conversationShortId" | "ticket" | "iSentToday">): [string, string] {
  if (!row.sendTarget) {
    return ["blocked", "这个会话不能发"]
  }
  if (row.conversationShortId <= 0n) {
    return ["short", "没有会话短号"]
  }
  if (row.ticket.trim() === "") {
    return ["ticket", "没有票据"]
  }
  if (row.iSentToday) {
    return ["sent", "今天已发，定时跳过"]
  }
  return ["due", "今天待发"]
}

export function applySentToday<T extends { peerUid: string; conversationId?: string; iSentToday: boolean }>(
  rows: T[],
  sentIds: readonly string[]
): T[] {
  const sent = new Set(sentIds.filter((id) => id !== ""))
  if (sent.size === 0) {
    return rows
  }
  return rows.map((row) => (sent.has(row.peerUid) || (row.conversationId !== undefined && sent.has(row.conversationId)) ? { ...row, iSentToday: true } : row))
}

export function formatChatTime(epochSeconds: number, now: Date): string {
  if (!Number.isFinite(epochSeconds) || epochSeconds <= 0) {
    return ""
  }
  const value = new Date(epochSeconds * 1000)
  if (Number.isNaN(value.getTime())) {
    return ""
  }
  const pad = (part: number) => String(part).padStart(2, "0")
  const sameDay = value.getFullYear() === now.getFullYear() && value.getMonth() === now.getMonth() && value.getDate() === now.getDate()
  if (sameDay) {
    return `${pad(value.getHours())}:${pad(value.getMinutes())}`
  }
  if (value.getFullYear() === now.getFullYear()) {
    return `${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
  }
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
}
