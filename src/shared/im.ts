import { concat, encodeBytes, encodeInt, encodeKv, encodeString, fieldInt, fieldText, utf8Strings } from "./pb"

export const SEND_URL = "https://imapi.douyin.com/v1/message/send"
export const INIT_URL = "https://imapi.douyin.com/v1/message/get_message_by_init"
export const INIT_CMD = 2043
export const SEND_CMD = 100
export const MESSAGE_EMOJI = 5
export const DEFAULT_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36"
export const DEFAULT_SDK = "0.1.8"
export const DEFAULT_BUILD = "0d50935:feat/pc-im-group"
const OK_STATUS = new Set([0, 8101, 7174])

const SEND_FAILURES: Array<[string, string]> = [
  ["crc32 check not pass", "票据校验没过"],
  ["empty token", "请求 token 是空的"],
  ["session length", "发送失败: 聊天页当前没有可用登录态。登录后点重新读取"],
  ["unexepcted session", "聊天页当前没有可用登录态"],
  ["unexpected session", "聊天页当前没有可用登录态"],
  ["conversation not found", "会话找不到"]
]

export class ImError extends Error {}

export function buildInitInner(page: number | null, version: bigint | null): Uint8Array {
  const parts: Uint8Array[] = []
  if (version !== null) {
    parts.push(encodeInt(1, version))
  }
  if (page !== null) {
    parts.push(encodeInt(2, page))
  }
  return concat(...parts)
}

export function buildCookieEnvelope(userAgent: string, cmd: number, inner: Uint8Array, sequenceId: number): Uint8Array {
  return concat(
    encodeInt(1, cmd),
    encodeInt(2, sequenceId),
    encodeString(3, DEFAULT_SDK),
    encodeString(4, ""),
    encodeInt(5, 3),
    encodeInt(6, 1),
    encodeString(7, DEFAULT_BUILD),
    encodeBytes(8, encodeBytes(cmd, inner)),
    encodeString(9, "0"),
    encodeString(11, "douyin_pc"),
    encodeString(14, "360000"),
    headers(userAgent, "https://www.douyin.com/chat"),
    encodeInt(18, 1),
    encodeString(21, "douyin_web"),
    encodeString(22, "web_sdk")
  )
}

export function buildSessionSend(
  userAgent: string,
  conversationId: string,
  conversationShortId: bigint,
  content: string,
  ticket: string,
  sequenceId: number,
  clientMessageId: string,
  conversationType = 1
): Uint8Array {
  if (conversationShortId <= 0n) {
    throw new ImError("没有会话短号")
  }
  if (!ticket) {
    throw new ImError("会话页没有 ticket")
  }
  if (conversationType !== 1) {
    throw new ImError("只给好友单聊发")
  }
  return buildCookieEnvelope(
    userAgent,
    SEND_CMD,
    messageInner(conversationId, conversationShortId, content, clientMessageId, ticket, conversationType),
    sequenceId
  )
}

function messageInner(
  conversationId: string,
  conversationShortId: bigint,
  payload: string,
  clientMessageId: string,
  ticket: string,
  conversationType: number
): Uint8Array {
  return concat(
    encodeString(1, conversationId),
    encodeInt(2, conversationType),
    encodeInt(3, conversationShortId),
    encodeString(4, payload),
    encodeInt(6, MESSAGE_EMOJI),
    encodeString(7, ticket),
    encodeString(8, clientMessageId)
  )
}

export function edgeDecision(payload: Uint8Array): string {
  const text = new TextDecoder().decode(payload).trim()
  if (!text.startsWith("{") || !text.endsWith("}")) {
    return ""
  }
  try {
    const parsed = JSON.parse(text) as unknown
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return ""
    }
    const decision = (parsed as { decision?: unknown }).decision
    return typeof decision === "string" ? decision : ""
  } catch {
    return ""
  }
}

export function explainSendResponse(payload: Uint8Array): string {
  const decision = edgeDecision(payload)
  if (decision === "KICK") {
    throw new ImError("发送被聊天页风控打断: decision=KICK。消息没发出去，登录会被弹掉。先完全退出再打开，重新登录后不要连着再发")
  }
  if (decision) {
    throw new ImError(`发送被拒绝: decision=${decision}`)
  }
  const strings = utf8Strings(payload)
  for (const item of strings) {
    if (!item.startsWith("{")) {
      continue
    }
    try {
      const parsed = JSON.parse(item) as { status_code?: unknown }
      if (typeof parsed.status_code === "number" && !OK_STATUS.has(parsed.status_code)) {
        throw new ImError(`发送被拒绝 status_code=${parsed.status_code}`)
      }
    } catch (error) {
      if (error instanceof ImError) {
        throw error
      }
    }
  }
  if (strings.includes("OK")) {
    return "OK"
  }
  let status = ""
  try {
    status = fieldText(payload, 4)
  } catch (error) {
    throw new ImError(`发送响应解析失败: ${errorText(error, payload)}`)
  }
  if (status && /^[\x20-\x7e]+$/.test(status)) {
    throw new ImError(sendFailure(status))
  }
  const blob = new TextDecoder("utf-8", { fatal: false }).decode(payload)
  for (const [needle, label] of SEND_FAILURES) {
    if (blob.includes(needle)) {
      throw new ImError(label)
    }
  }
  if (payload.length) {
    let code: bigint | null = null
    try {
      code = fieldInt(payload, 3)
    } catch (error) {
      throw new ImError(`发送响应解析失败: ${errorText(error, payload)}`)
    }
    const detail = code === null ? "" : `，status=${code}`
    const hex = payload.length <= 80 ? `，${hexOf(payload)}` : ""
    throw new ImError(`响应里没有 OK，长度 ${payload.length}${detail}${hex}`)
  }
  throw new ImError("空响应")
}

export function explainInitResponse(payload: Uint8Array): void {
  if (edgeDecision(payload) === "KICK") {
    throw new ImError("会话页失败: 聊天页把登录弹掉了。重新登录后再点重新读取，不要连续发送")
  }
  const status = safeFieldText(payload, 4)
  if (status && status !== "OK") {
    if (status.includes("session length")) {
      throw new ImError("会话页失败: 聊天页当前没有可用登录态。登录后点重新读取。如果刚才发送回了 decision=KICK，登录已经被弹掉，重新登录后再点一次")
    }
    throw new ImError(`会话页失败: ${status}`)
  }
  if (status !== "OK" && !payloadIncludes(payload, "OK")) {
    throw new ImError("会话页响应里没有 OK")
  }
}

function headers(userAgent: string, referer: string): Uint8Array {
  const ua = userAgent || DEFAULT_UA
  const rows: Array<[string, string]> = [
    ["session_aid", "6383"],
    ["session_did", "0"],
    ["app_name", "douyin_pc"],
    ["priority_region", "cn"],
    ["user_agent", ua],
    ["cookie_enabled", "true"],
    ["browser_language", "zh-CN"],
    ["browser_platform", "Win32"],
    ["browser_name", "Mozilla"],
    ["browser_version", ua.startsWith("Mozilla/") ? ua.slice(8) : ua],
    ["browser_online", "true"],
    ["screen_width", "1920"],
    ["screen_height", "1080"],
    ["referer", referer],
    ["timezone_name", "Etc/GMT-8"],
    ["deviceId", "0"],
    ["is-retry", "0"]
  ]
  return concat(...rows.map(([key, value]) => encodeKv(15, key, value)))
}

function sendFailure(status: string): string {
  for (const [needle, label] of SEND_FAILURES) {
    if (status.includes(needle)) {
      return label
    }
  }
  return `发送失败: ${status}`
}

function safeFieldText(payload: Uint8Array, field: number): string {
  try {
    return fieldText(payload, field)
  } catch {
    return ""
  }
}

function payloadIncludes(payload: Uint8Array, needle: string): boolean {
  return new TextDecoder("utf-8", { fatal: false }).decode(payload).includes(needle)
}

function errorText(error: unknown, payload: Uint8Array): string {
  const detail = error instanceof Error ? error.message : "解析失败"
  return payload.length <= 80 ? `${detail}，${hexOf(payload)}` : detail
}

function hexOf(payload: Uint8Array): string {
  return Array.from(payload, (piece) => piece.toString(16).padStart(2, "0")).join("")
}
