import { interactiveContent, selectSparkEmoji } from "@shared/emoji"
import { explainInitResponse, explainSendResponse, ImError, buildCookieEnvelope, buildInitInner, buildSessionSend, INIT_CMD, INIT_URL, SEND_URL } from "@shared/im"
import { parseInit, type SparkRow } from "@shared/inbox"
import { fromBase64, toBase64 } from "@shared/pb"
import { sendDecision, testBlock } from "@shared/decide"
import { dueBlocked, filterPicked, planChecked } from "@shared/select"
import { applyPeerCards, applyPeerSecs, cardsFromGuest, directoryFromGuest, readChatDirectoryScript, readUserInfoScript, shownName, USER_INFO_BATCH } from "@shared/user-info"
import { postProtobufScript, readEmojiScript, readProfileScript } from "./guest"

const PAGE_CAP = 30

export type ProfileView = {
  signedIn: boolean
  uid: string
  nickname: string
  userAgent: string
  detail: string
}

export type RenewLine = {
  uid: string
  name: string
  status: "sent" | "failed" | "skipped"
  detail: string
}

export type RenewResult = {
  stopped: "kick" | "login" | "none"
  lines: RenewLine[]
}

type Guest = {
  executeJavaScript: (code: string, userGesture?: boolean) => Promise<unknown>
}

type ProtoResult = {
  status: number
  body: string
  userAgent: string
}

export async function readProfile(guest: Guest): Promise<ProfileView> {
  const raw = await guest.executeJavaScript(readProfileScript(), true)
  const data = raw as { http?: number; statusCode?: number; uid?: string; nickname?: string; userAgent?: string }
  const uid = String(data.uid ?? "")
  const signedIn = data.http === 200 && data.statusCode === 0 && /^\d+$/.test(uid)
  return {
    signedIn,
    uid: signedIn ? uid : "",
    nickname: signedIn ? String(data.nickname ?? "") : "",
    userAgent: String(data.userAgent ?? ""),
    detail: signedIn ? "聊天页登录有效" : "聊天页当前没有可用登录态。登录后点重新读取"
  }
}

export async function readInbox(guest: Guest, profile: ProfileView): Promise<SparkRow[]> {
  if (!profile.signedIn) {
    throw new ImError(profile.detail)
  }
  let pageNo: number | null = null
  let version: bigint | null = null
  const seenVersions = new Set<string>()
  const seenIds = new Set<string>()
  const rows: SparkRow[] = []
  let sequence = 10000
  for (let index = 0; index < PAGE_CAP; index += 1) {
    sequence += 1
    const body = buildCookieEnvelope(profile.userAgent, INIT_CMD, buildInitInner(pageNo, version), sequence)
    const payload = await postProto(guest, INIT_URL, body)
    explainInitResponse(payload)
    const page = parseInit(payload, profile.uid, new Date())
    for (const row of page.rows) {
      if (!seenIds.has(row.conversationId)) {
        seenIds.add(row.conversationId)
        rows.push(row)
      }
    }
    if (!page.hasMore || page.nextInitVersion === null) {
      return rows
    }
    const marker = page.nextInitVersion.toString()
    if (seenVersions.has(marker)) {
      return rows
    }
    seenVersions.add(marker)
    version = page.nextInitVersion
    pageNo = pageNo === null ? 1 : pageNo + 1
  }
  return rows
}

export async function enrichInbox(guest: Guest, rows: SparkRow[]): Promise<SparkRow[]> {
  let current = rows
  try {
    const raw = await guest.executeJavaScript(readChatDirectoryScript(), true)
    const page = directoryFromGuest(raw)
    current = applyPeerCards(applyPeerSecs(current, page.secs), page.cards)
  } catch {
    current = rows
  }
  const missing = current.filter((row) => !row.isGroup && row.peerUid && (!shownName(row.name) || !row.avatarUrl))
  const secs = [...new Set(missing.map((row) => row.secUid).filter(Boolean))]
  if (!secs.length) {
    if (missing.length) {
      throw new ImError("会话里没有对方的 sec_uid，用户资料接口没法对上")
    }
    return current
  }
  const cards = []
  let failed = ""
  for (let index = 0; index < secs.length; index += USER_INFO_BATCH) {
    try {
      cards.push(...(await fetchUserInfo(guest, secs.slice(index, index + USER_INFO_BATCH))))
    } catch (error) {
      failed = error instanceof Error ? error.message : "用户资料接口没有返回昵称"
    }
  }
  const named = applyPeerCards(current, cards)
  const stillBlank = named.some((row) => !row.isGroup && row.peerUid && !shownName(row.name))
  if (failed && cards.length === 0 && stillBlank) {
    throw new ImError(failed)
  }
  return named
}

export async function renewDue(guest: Guest, profile: ProfileView, rows: SparkRow[], limited: boolean, picked: string[]): Promise<RenewResult> {
  if (!profile.signedIn) {
    return { stopped: "login", lines: [{ uid: "", name: "", status: "failed", detail: profile.detail }] }
  }
  if (dueBlocked(limited, picked)) {
    return { stopped: "none", lines: [{ uid: "", name: "", status: "skipped", detail: "限定名单是空的，先勾选要续的人" }] }
  }
  const due = filterPicked(
    rows.filter((row) => sendDecision(row)[0] === "due"),
    limited,
    picked
  )
  if (!due.length) {
    return { stopped: "none", lines: [{ uid: "", name: "", status: "skipped", detail: "今天没有要发的人" }] }
  }
  return deliverRows(guest, profile, due)
}

export async function sendChecked(guest: Guest, profile: ProfileView, rows: SparkRow[], picked: string[]): Promise<RenewResult> {
  if (!profile.signedIn) {
    return { stopped: "login", lines: [{ uid: "", name: "", status: "failed", detail: profile.detail }] }
  }
  if (picked.length === 0) {
    return { stopped: "none", lines: [{ uid: "", name: "", status: "skipped", detail: "先勾选要测试的人" }] }
  }
  const plan = planChecked(rows, picked, testBlock)
  if (!plan.ready.length) {
    return {
      stopped: "none",
      lines: plan.skipped.length
        ? plan.skipped.map((item) => ({ ...item, status: "skipped" as const }))
        : [{ uid: "", name: "", status: "skipped", detail: "勾选的人里没有能发的单聊" }]
    }
  }
  const sent = await deliverRows(guest, profile, plan.ready)
  return {
    stopped: sent.stopped,
    lines: [...plan.skipped.map((item) => ({ ...item, status: "skipped" as const })), ...sent.lines]
  }
}

async function deliverRows(guest: Guest, profile: ProfileView, targets: SparkRow[]): Promise<RenewResult> {
  const content = await sparkContent(guest)
  const lines: RenewLine[] = []
  let sequence = 20000
  for (const row of targets) {
    sequence += 1
    const clientId = crypto.randomUUID()
    try {
      const body = buildSessionSend(
        profile.userAgent,
        row.conversationId,
        row.conversationShortId,
        content,
        row.ticket,
        sequence,
        clientId,
        row.conversationType
      )
      const payload = await postProto(guest, SEND_URL, body)
      explainSendResponse(payload)
      lines.push({ uid: row.peerUid, name: row.name, status: "sent", detail: "互动表情已交给聊天页" })
    } catch (error) {
      const detail = error instanceof Error ? error.message : "发送失败"
      lines.push({ uid: row.peerUid, name: row.name, status: "failed", detail })
      if (detail.includes("decision=KICK")) {
        return { stopped: "kick", lines }
      }
    }
    await wait(400)
  }
  return { stopped: "none", lines }
}

async function fetchUserInfo(guest: Guest, secUids: string[]) {
  const raw = await guest.executeJavaScript(readUserInfoScript(secUids), true)
  return cardsFromGuest(raw)
}

async function sparkContent(guest: Guest): Promise<string> {
  const raw = await guest.executeJavaScript(readEmojiScript(), true)
  const data = raw as { statusCode?: number; body?: Record<string, unknown> }
  if (data.statusCode !== 0 || !data.body) {
    throw new ImError("互动表情接口没有返回资源")
  }
  return interactiveContent(selectSparkEmoji(data.body))
}

async function postProto(guest: Guest, url: string, body: Uint8Array): Promise<Uint8Array> {
  const raw = await guest.executeJavaScript(postProtobufScript(url, toBase64(body)), true)
  const data = raw as ProtoResult & { blocked?: string }
  if (data && data.blocked) {
    throw new ImError(data.blocked)
  }
  if (!data || typeof data.body !== "string") {
    throw new ImError("聊天页没有返回响应")
  }
  if (data.status && data.status >= 400) {
    throw new ImError(`HTTP ${data.status}`)
  }
  return fromBase64(data.body)
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
