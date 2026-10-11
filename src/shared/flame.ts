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

const EMPTY: FlameState = {
  kind: "none",
  text: "",
  days: null,
  style: "",
  relation: "",
  state: null,
  recoverDays: null,
  recoverNeedDays: null,
  renewed: false
}

const LABELS: Record<string, string> = {
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
  const label = LABELS[state.kind] ?? state.kind
  if (state.text && state.text !== label) {
    return `${label} ${state.text}`
  }
  return label
}

export function classifyFlame(payload: Record<string, unknown> | null, nowTs: number): FlameState {
  const segment = activeSegment(payload, nowTs)
  if (!segment || !payload) {
    return EMPTY
  }
  const level = String(segment.level ?? "")
  const split = level.indexOf("|")
  const style = split === -1 ? level : level.slice(0, split)
  const relation = split === -1 ? "" : level.slice(split + 1)
  const text = String(segment.text ?? "")
  const simple = String(segment.simplify_text ?? "")
  const kind = kindOf(style, text, simple)
  return {
    kind,
    text,
    days: daysOf(segment, payload, text),
    style,
    relation,
    state: optInt(segment.state),
    recoverDays: optInt(segment.recover_days),
    recoverNeedDays: optInt(segment.recover_need_days),
    renewed: kind === "lit"
  }
}

function activeSegment(payload: Record<string, unknown> | null, nowTs: number): Record<string, unknown> | null {
  if (!payload) {
    return null
  }
  const infos = payload.flame_infos
  if (!Array.isArray(infos)) {
    return null
  }
  let chosen: Record<string, unknown> | null = null
  let chosenStart = -1
  for (const item of infos) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      continue
    }
    const segment = item as Record<string, unknown>
    const start = optInt(segment.start)
    const end = optInt(segment.end)
    if (start === null || end === null || start > nowTs || nowTs >= end) {
      continue
    }
    if (start >= chosenStart) {
      chosen = segment
      chosenStart = start
    }
  }
  return chosen
}

function kindOf(style: string, text: string, simple: string): string {
  if (text.includes("重燃") || simple === "重燃中" || style.startsWith("recover")) {
    return "recover"
  }
  if (style.startsWith("gray")) {
    return "gray"
  }
  if (style.startsWith("blue")) {
    return "blue"
  }
  if (style.startsWith("to_recover") || simple === "待重燃") {
    return "pending"
  }
  if (style.startsWith("normal")) {
    return "lit"
  }
  return "unknown"
}

function daysOf(segment: Record<string, unknown>, payload: Record<string, unknown>, text: string): number | null {
  for (const value of [segment.days, segment.real_days]) {
    const parsed = optInt(value)
    if (parsed !== null) {
      return parsed
    }
  }
  const countInfo = payload.consecutive_count_info
  if (countInfo && typeof countInfo === "object" && !Array.isArray(countInfo)) {
    const parsed = optInt((countInfo as Record<string, unknown>).consecutive_count)
    if (parsed !== null) {
      return parsed
    }
  }
  return optInt(text)
}

function optInt(value: unknown): number | null {
  if (typeof value === "boolean" || value === null || value === undefined) {
    return null
  }
  if (typeof value === "number" && Number.isInteger(value)) {
    return value
  }
  if (typeof value === "string" && /^-?\d+$/.test(value)) {
    return Number(value)
  }
  return null
}
