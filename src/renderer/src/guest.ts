import { STRATEGY_URL, strategyQuery } from "@shared/emoji"
import { sendGuardScript } from "@shared/send-guard"
import { readUserInfoScript } from "@shared/user-info"

export { readUserInfoScript }

export const CHAT_URL = "https://www.douyin.com/chat"
const PROFILE_URL =
  "https://www.douyin.com/aweme/v1/web/user/profile/self/?device_platform=webapp&aid=6383&channel=channel_pc_web&pc_client_type=1&update_version_code=170400&version_code=170400&version_name=17.4.0"
export const INIT_URL = "https://imapi.douyin.com/v1/message/get_message_by_init"
export const SEND_URL = "https://imapi.douyin.com/v1/message/send"

export function readProfileScript(): string {
  return `fetch(${JSON.stringify(PROFILE_URL)}, { credentials: "include", headers: { Accept: "application/json" } }).then(async (response) => {
    const data = await response.json()
    const user = data && data.user && typeof data.user === "object" ? data.user : {}
    return { http: response.status, statusCode: data && data.status_code, uid: String(user.uid || ""), nickname: String(user.nickname || ""), userAgent: navigator.userAgent }
  })`
}

export function readEmojiScript(): string {
  const url = `${STRATEGY_URL}?${strategyQuery()}`
  return `fetch(${JSON.stringify(url)}, { credentials: "include", headers: { Accept: "application/json" } }).then(async (response) => {
    const data = await response.json()
    return { http: response.status, statusCode: data && data.status_code, body: data }
  })`
}

export function postProtobufScript(url: string, body: string): string {
  if (url !== INIT_URL && url !== SEND_URL) {
    throw new Error("只允许会话页和发送接口")
  }
  if (!/^[A-Za-z0-9+/]+=*$/.test(body)) {
    throw new Error("发送体不是合法编码")
  }
  const guard = url === SEND_URL ? sendGuardScript(url) : '""'
  return `(() => {
    const blocked = ${guard}
    if (blocked) return { status: 0, body: "", blocked }
    const bytes = Uint8Array.from(atob(${JSON.stringify(body)}), (char) => char.charCodeAt(0))
    return fetch(${JSON.stringify(url)}, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/x-protobuf", Accept: "application/x-protobuf" },
      body: bytes
    }).then(async (response) => {
      const raw = new Uint8Array(await response.arrayBuffer())
      let binary = ""
      for (const piece of raw) binary += String.fromCharCode(piece)
      return { status: response.status, body: btoa(binary), userAgent: navigator.userAgent }
    })
  })()`
}
