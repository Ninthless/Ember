import type { SparkRow } from "./inbox"

export const USER_INFO_URL = "https://www.douyin.com/aweme/v1/web/im/user/info/"
export const USER_INFO_BATCH = 40

const QUERY = {
  device_platform: "webapp",
  aid: "6383",
  channel: "channel_pc_web",
  pc_client_type: "1",
  pc_libra_divert: "Windows",
  update_version_code: "170400",
  support_h265: "1",
  support_dash: "1",
  version_code: "170400",
  version_name: "17.4.0"
}

export type PeerCard = {
  uid: string
  nickname: string
  remarkName: string
  uniqueId: string
  avatarUrl: string
}

export type PeerSec = {
  uid: string
  secUid: string
}

export type ChatDirectory = {
  cards: PeerCard[]
  secs: PeerSec[]
}

export function userInfoQuery(): string {
  return new URLSearchParams(QUERY).toString()
}

export function userInfoForm(secUids: string[]): string {
  return new URLSearchParams({ sec_user_ids: JSON.stringify(cleanSecs(secUids)) }).toString()
}

export function parseUserInfo(body: unknown): PeerCard[] {
  if (!body || typeof body !== "object") {
    throw new Error("用户资料接口没有返回昵称")
  }
  const record = body as { status_code?: unknown; data?: unknown }
  if (record.status_code !== 0 || !Array.isArray(record.data)) {
    throw new Error("用户资料接口没有返回昵称")
  }
  return record.data.flatMap((item) => {
    const card = cardFrom(item)
    return card ? [card] : []
  })
}

export function shownName(name: string): string {
  const text = name.trim()
  if (!text || /^\d+$/.test(text)) {
    return ""
  }
  return text
}

export function applyPeerCards(rows: SparkRow[], cards: PeerCard[]): SparkRow[] {
  const byUid = new Map<string, PeerCard>()
  for (const card of cards) {
    if (/^\d+$/.test(card.uid)) {
      byUid.set(card.uid, card)
    }
  }
  return rows.map((row) => {
    if (row.isGroup || !row.peerUid) {
      return row
    }
    const card = byUid.get(row.peerUid)
    if (!card) {
      return row
    }
    const found = card.remarkName.trim() || card.nickname.trim()
    return {
      ...row,
      name: found || shownName(row.name),
      avatarUrl: httpUrl(card.avatarUrl) || row.avatarUrl,
      uniqueId: cleanUniqueId(card.uniqueId) || row.uniqueId
    }
  })
}

export function applyPeerSecs(rows: SparkRow[], secs: PeerSec[]): SparkRow[] {
  const byUid = new Map<string, string>()
  for (const item of secs) {
    const sec = item.secUid.trim()
    if (/^\d+$/.test(item.uid) && sec) {
      byUid.set(item.uid, sec)
    }
  }
  return rows.map((row) => {
    if (row.secUid || row.isGroup || !row.peerUid) {
      return row
    }
    const secUid = byUid.get(row.peerUid) ?? ""
    return secUid ? { ...row, secUid } : row
  })
}

export function readUserInfoScript(secUids: string[]): string {
  const ids = cleanSecs(secUids)
  if (!ids.length) {
    throw new Error("没有 sec_uid")
  }
  return `(() => {
    const client = window.axiosInstance
    if (!client || typeof client.post !== "function") {
      return Promise.reject(new Error("聊天页还没挂上用户资料接口"))
    }
    const form = new URLSearchParams({ sec_user_ids: ${JSON.stringify(JSON.stringify(ids))} })
    return client.post("/aweme/v1/web/im/user/info/", form, {
      params: ${JSON.stringify(QUERY)},
      withCredentials: true,
      headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" }
    }).then((response) => {
      const data = response && response.data && typeof response.data.status_code !== "undefined" ? response.data : response
      const list = data && Array.isArray(data.data) ? data.data : []
      return {
        http: response && response.status || 200,
        statusCode: data && data.status_code,
        cards: list.map((item) => {
          if (!item || typeof item !== "object") return null
          const thumb = item.avatar_thumb && item.avatar_thumb.url_list
          const small = item.avatar_small && item.avatar_small.url_list
          const avatar = Array.isArray(thumb) && thumb[0] ? thumb[0] : Array.isArray(small) && small[0] ? small[0] : ""
          return {
            uid: String(item.uid || item.user_id || ""),
            nickname: String(item.nickname || ""),
            remarkName: String(item.remark_name || ""),
            uniqueId: String(item.unique_id || item.short_id || ""),
            avatarUrl: typeof avatar === "string" ? avatar : ""
          }
        }).filter(Boolean)
      }
    })
  })()`
}

export function readChatDirectoryScript(): string {
  return `(() => {
    const cards = []
    const secs = []
    const users = window.userInfoStore && window.userInfoStore.usersInfoMap
    const conv = window.conversationStore && window.conversationStore.conversationMap
    if (users && typeof users.forEach === "function") {
      users.forEach((item) => {
        if (!item || typeof item !== "object") return
        const thumb = item.avatar_thumb && item.avatar_thumb.url_list
        const small = item.avatar_small && item.avatar_small.url_list
        const avatar = Array.isArray(thumb) && thumb[0] ? thumb[0] : Array.isArray(small) && small[0] ? small[0] : ""
        cards.push({
          uid: String(item.uid || ""),
          nickname: String(item.nickname || ""),
          remarkName: String(item.remark_name || ""),
          uniqueId: String(item.unique_id || ""),
          avatarUrl: typeof avatar === "string" ? avatar : ""
        })
      })
    }
    if (conv && typeof conv.forEach === "function") {
      conv.forEach((item) => {
        if (!item || item.type !== 1) return
        const uid = String(item.toParticipantUserId || "")
        const secUid = String(item.toParticipantSecUserId || "")
        if (/^\\d+$/.test(uid) && secUid) secs.push({ uid, secUid })
      })
    }
    return { cards, secs }
  })()`
}

export function directoryFromGuest(raw: unknown): ChatDirectory {
  if (!raw || typeof raw !== "object") {
    return { cards: [], secs: [] }
  }
  const record = raw as { cards?: unknown; secs?: unknown }
  const cards = Array.isArray(record.cards) ? record.cards.flatMap((item) => {
    const card = cardFrom(item)
    return card ? [card] : []
  }) : []
  const secs = Array.isArray(record.secs) ? record.secs.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return []
    }
    const pair = item as { uid?: unknown; secUid?: unknown }
    const uid = String(pair.uid ?? "")
    const secUid = typeof pair.secUid === "string" ? pair.secUid.trim() : ""
    return /^\d+$/.test(uid) && secUid ? [{ uid, secUid }] : []
  }) : []
  return { cards, secs }
}

export function cardsFromGuest(raw: unknown): PeerCard[] {
  if (!raw || typeof raw !== "object") {
    throw new Error("用户资料接口没有返回昵称")
  }
  const record = raw as { http?: unknown; statusCode?: unknown; cards?: unknown }
  if (typeof record.http === "number" && record.http >= 400) {
    throw new Error("用户资料接口没有响应")
  }
  if (record.statusCode !== 0 || !Array.isArray(record.cards)) {
    throw new Error("用户资料接口没有返回昵称")
  }
  return record.cards.flatMap((item) => {
    const card = cardFrom(item)
    return card ? [card] : []
  })
}

function cardFrom(item: unknown): PeerCard | null {
  if (!item || typeof item !== "object") {
    return null
  }
  const record = item as {
    uid?: unknown
    user_id?: unknown
    nickname?: unknown
    remark_name?: unknown
    remarkName?: unknown
    unique_id?: unknown
    uniqueId?: unknown
    short_id?: unknown
    avatarUrl?: unknown
    avatar_thumb?: { url_list?: unknown }
    avatar_small?: { url_list?: unknown }
  }
  const uid = String(record.uid ?? record.user_id ?? "")
  if (!/^\d+$/.test(uid)) {
    return null
  }
  const thumb = record.avatar_thumb?.url_list
  const small = record.avatar_small?.url_list
  const avatar = firstUrl(thumb) || firstUrl(small) || text(record.avatarUrl)
  return {
    uid,
    nickname: text(record.nickname),
    remarkName: text(record.remark_name ?? record.remarkName),
    uniqueId: cleanUniqueId(text(record.unique_id ?? record.uniqueId ?? record.short_id)),
    avatarUrl: httpUrl(avatar)
  }
}

function firstUrl(value: unknown): string {
  if (typeof value === "string") {
    return value
  }
  if (Array.isArray(value)) {
    const found = value.find((item) => typeof item === "string" && item)
    return typeof found === "string" ? found : ""
  }
  return ""
}

function cleanSecs(secUids: string[]): string[] {
  const found: string[] = []
  for (const item of secUids) {
    const sec = item.trim()
    if (!sec || sec.length > 200 || /[\s"'\\<>]/.test(sec) || found.includes(sec)) {
      continue
    }
    found.push(sec)
    if (found.length >= USER_INFO_BATCH) {
      break
    }
  }
  return found
}

function cleanUniqueId(value: string): string {
  const textValue = value.trim()
  if (!textValue || textValue === "0") {
    return ""
  }
  return textValue
}

function httpUrl(value: string): string {
  if (value.startsWith("https://") || value.startsWith("http://")) {
    return value
  }
  return ""
}

function text(value: unknown): string {
  return typeof value === "string" ? value : typeof value === "number" ? String(value) : ""
}
