import { classifyFlame, type FlameState } from "./flame"
import { fieldBytes, fieldInt, fieldText, iterFields, repeatedKv } from "./pb"
import { previewMessage } from "./preview"

export class InboxError extends Error {}

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

export type InboxPage = {
  hasMore: boolean
  conversationCount: number
  rows: SparkRow[]
  nextInitVersion: bigint | null
}

export function applySentToday<T extends { peerUid: string; iSentToday: boolean }>(rows: T[], sentUids: readonly string[]): T[] {
  const sent = new Set(sentUids.filter((uid) => uid !== ""))
  if (sent.size === 0) {
    return rows
  }
  return rows.map((row) => (sent.has(row.peerUid) ? { ...row, iSentToday: true } : row))
}

export function parseInit(payload: Uint8Array, myUid: string, now: Date): InboxPage {
  if (!/^\d+$/.test(myUid)) {
    throw new InboxError("数字 uid 还没有")
  }
  let items
  try {
    items = iterFields(messageByInit(payload))
  } catch (error) {
    const detail = error instanceof InboxError ? error.message : error instanceof Error ? error.message : "解析失败"
    if (error instanceof InboxError) {
      throw error
    }
    throw new InboxError(`会话页不是完整 protobuf: ${detail}`)
  }
  let hasMore = false
  let nextInitVersion: bigint | null = null
  const rows: SparkRow[] = []
  let count = 0
  const nowTs = Math.floor(now.getTime() / 1000)
  for (const [number, wire, value] of items) {
    if (number === 2 && wire === 0 && typeof value === "bigint") {
      hasMore = value !== 0n
    } else if (number === 3 && wire === 0 && typeof value === "bigint") {
      nextInitVersion = value
    }
    if (number !== 1 || wire !== 2 || !(value instanceof Uint8Array)) {
      continue
    }
    count += 1
    const row = conversation(value, myUid, now, nowTs)
    if (row) {
      rows.push(row)
    }
  }
  return { hasMore, conversationCount: count, rows, nextInitVersion }
}

function messageByInit(payload: Uint8Array): Uint8Array {
  const fields = iterFields(payload)
  const direct = bytesField(fields, 2043)
  if (direct) {
    return direct
  }
  const body = bytesField(fields, 6)
  if (body) {
    const nested = bytesField(iterFields(body), 2043)
    if (nested) {
      return nested
    }
  }
  if (fields.some(([number, wire]) => number === 1 && wire === 2)) {
    return payload
  }
  throw new InboxError("包里没有 message_by_init")
}

function conversation(blob: Uint8Array, myUid: string, now: Date, nowTs: number): SparkRow | null {
  const info = fieldBytes(blob, 1)
  if (!info) {
    return null
  }
  const conversationId = fieldText(info, 1)
  if (!conversationId) {
    return null
  }
  const conversationType = Number(fieldInt(info, 3) ?? 0n)
  const core = fieldBytes(info, 50)
  const setting = fieldBytes(info, 51)
  const payload = flamePayload(core, setting)
  if (!payload) {
    return null
  }
  const isGroup = conversationType === 2
  const peerUid = isGroup ? "" : peerFromId(conversationId, myUid)
  const [mine, other] = todaySides(blob, myUid, now)
  const ext = extension(core, setting)
  const latest = lastMessage(blob)
  return {
    conversationId,
    conversationShortId: fieldInt(info, 2) ?? 0n,
    conversationType,
    name: displayName(info, core, peerUid),
    peerUid,
    isGroup,
    sendTarget: conversationType === 1 && Boolean(peerUid),
    flame: classifyFlame(payload, nowTs),
    iSentToday: mine,
    otherSentToday: other,
    ticket: fieldText(info, 4).trim(),
    secUid: isGroup ? "" : peerSec(info, peerUid),
    avatarUrl: isGroup ? httpUrl(ext.get("a:ab_avatar") ?? "") : "",
    uniqueId: "",
    lastText: latest.text,
    lastAt: latest.at
  }
}

function extension(core: Uint8Array | null, setting: Uint8Array | null): Map<string, string> {
  const ext = new Map<string, string>()
  if (core) {
    for (const [key, value] of repeatedKv(core, 11)) {
      ext.set(key, value)
    }
  }
  if (setting) {
    for (const [key, value] of repeatedKv(setting, 9)) {
      ext.set(key, value)
    }
  }
  return ext
}

function flamePayload(core: Uint8Array | null, setting: Uint8Array | null): Record<string, unknown> | null {
  const ext = extension(core, setting)
  const raw = ext.get("a:consecutive_chat_data") ?? ""
  if (!raw) {
    return null
  }
  try {
    const loaded = JSON.parse(raw) as unknown
    if (!loaded || typeof loaded !== "object" || Array.isArray(loaded)) {
      return null
    }
    return loaded as Record<string, unknown>
  } catch {
    return null
  }
}

function displayName(info: Uint8Array, core: Uint8Array | null, peerUid: string): string {
  if (core) {
    const name = fieldText(core, 5).trim()
    if (name) {
      return name
    }
  }
  if (peerUid) {
    for (const person of participants(info)) {
      if (intText(fieldInt(person, 1)) === peerUid) {
        const name = fieldText(person, 4).trim()
        if (name) {
          return name
        }
      }
    }
  }
  const user = fieldBytes(info, 20)
  if (!user || (peerUid && intText(fieldInt(user, 1)) !== peerUid)) {
    return ""
  }
  return fieldText(user, 4).trim()
}

function peerSec(info: Uint8Array, peerUid: string): string {
  if (!peerUid) {
    return ""
  }
  for (const person of participants(info)) {
    const sec = fieldText(person, 5).trim()
    if (intText(fieldInt(person, 1)) === peerUid && sec) {
      return sec
    }
  }
  return ""
}

function participants(info: Uint8Array): Uint8Array[] {
  const people: Uint8Array[] = []
  const user = fieldBytes(info, 20)
  if (user) {
    people.push(user)
  }
  const page = fieldBytes(info, 6)
  if (!page) {
    return people
  }
  for (const [number, wire, value] of iterFields(page)) {
    if (number === 1 && wire === 2 && value instanceof Uint8Array) {
      people.push(value)
    }
  }
  return people
}

function lastMessage(blob: Uint8Array): { text: string; at: number } {
  let bestAt = -1
  let bestText = ""
  for (const [number, wire, value] of iterFields(blob)) {
    if (number !== 2 || wire !== 2 || !(value instanceof Uint8Array)) {
      continue
    }
    const created = epochSeconds(fieldInt(value, 10)) ?? 0
    if (created < bestAt) {
      continue
    }
    bestAt = created
    bestText = previewMessage(Number(fieldInt(value, 6) ?? 0n), fieldText(value, 8))
  }
  return { text: bestText, at: bestAt > 0 ? bestAt : 0 }
}

function intText(value: bigint | null): string {
  return value === null ? "" : value.toString()
}

function httpUrl(value: string): string {
  const text = value.trim()
  if (text.startsWith("https://") || text.startsWith("http://")) {
    return text
  }
  return ""
}

function peerFromId(conversationId: string, myUid: string): string {
  const parts = conversationId.split(":").filter((part) => /^\d+$/.test(part) && part.length > 5)
  const others = parts.filter((part) => part !== myUid)
  return others.length ? others[others.length - 1] : ""
}

function todaySides(blob: Uint8Array, myUid: string, now: Date): [boolean, boolean] {
  let mine = false
  let other = false
  const today = localDate(now)
  for (const [number, wire, value] of iterFields(blob)) {
    if (number !== 2 || wire !== 2 || !(value instanceof Uint8Array)) {
      continue
    }
    const sender = fieldInt(value, 7)
    const created = epochSeconds(fieldInt(value, 10))
    if (sender === null || created === null || sender < 1_000_000n) {
      continue
    }
    if (localDate(new Date(created * 1000)) !== today) {
      continue
    }
    if (sender.toString() === myUid) {
      mine = true
    } else {
      other = true
    }
  }
  return [mine, other]
}

function epochSeconds(stamp: bigint | null): number | null {
  if (stamp === null || stamp <= 0n) {
    return null
  }
  let value = stamp
  while (value > 10n ** 12n) {
    value /= 1000n
  }
  if (value < 10n ** 9n) {
    return null
  }
  return Number(value)
}

function localDate(value: Date): string {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function bytesField(fields: ReturnType<typeof iterFields>, number: number): Uint8Array | null {
  for (const [found, wire, value] of fields) {
    if (found === number && wire === 2 && value instanceof Uint8Array) {
      return value
    }
  }
  return null
}
