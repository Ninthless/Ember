const TEXT = 7
const SHARE_AWEME = 8
const BIG_EMOJI = 5
const STICKER = 51
const SYSTEM = 1
const PICTURE = 2
const SAY_HELLO = 15
const VOICE = 17
const ENCRYPT_VOICE = 109
const SHARE_LIVE = 21
const STORY_PICTURE = 27
const STORY_VIDEO = 30
const STORY_PICTURE_ONCE = 91
const STORY_VIDEO_ONCE = 92
const SHARE_PHOTOS = 77
const REF_MSG = 83
const SHARE_USER = 25
const SHARE_WEB = 26
const SHARE_COMMENT = 105
const SHARE_LOCATION = 502
const GROUP_INVITE = 58
const GROUP_GREET = 1002
const GROUP_NOTICE = 1004
const TEXT_ONCE = 104

export function previewMessage(type: number, raw: string): string {
  const content = contentOf(raw)
  const text = textOf(content.text)
  switch (type) {
    case SYSTEM:
      return textOf(content.tips) || textOf(content.template) || text
    case BIG_EMOJI:
    case STICKER:
      return `[${textOf(content.display_name) || "表情"}]`
    case TEXT:
      return text
    case TEXT_ONCE:
      return text || "仅看一次消息"
    case SHARE_AWEME:
      return "分享[视频]"
    case SAY_HELLO:
      return textOf(content.nickname) ? `嗨～ 我是${textOf(content.nickname)}，聊聊天吧` : "嗨～ 聊聊天吧"
    case VOICE:
    case ENCRYPT_VOICE:
      return "[语音]"
    case SHARE_LIVE:
      return textOf(content.push_detail) ? `分享[直播]：${textOf(content.push_detail)}` : "分享[直播]"
    case PICTURE:
    case STORY_PICTURE:
    case STORY_PICTURE_ONCE:
      return "[图片]"
    case STORY_VIDEO:
    case STORY_VIDEO_ONCE:
      return "[视频]"
    case SHARE_PHOTOS:
      return "分享[图集]"
    case REF_MSG:
      return content.shareMsgType === SHARE_PHOTOS ? "分享[图集]" : "分享[视频]"
    case SHARE_USER:
      return "[分享用户]"
    case SHARE_COMMENT:
      return "分享[评论]"
    case SHARE_LOCATION:
      return "[地理位置]"
    case SHARE_WEB:
      return textOf(content.title) ? `转发[链接]: ${textOf(content.title)}` : "转发[链接]"
    case GROUP_INVITE:
      return "[群聊邀请]"
    case GROUP_GREET:
      return "和朋友打个招呼吧"
    case GROUP_NOTICE:
      return `[群公告]${textOf(content.notice_content)}`
    default:
      return text
  }
}

export function formatChatTime(epochSeconds: number, now: Date): string {
  if (!epochSeconds) {
    return ""
  }
  const value = new Date(epochSeconds * 1000)
  if (Number.isNaN(value.getTime())) {
    return ""
  }
  if (dayKey(value) === dayKey(now)) {
    return `${pad(value.getHours())}:${pad(value.getMinutes())}`
  }
  if (value.getFullYear() === now.getFullYear()) {
    return `${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
  }
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
}

function contentOf(raw: string): Record<string, unknown> {
  if (!raw) {
    return {}
  }
  try {
    const loaded = JSON.parse(raw) as unknown
    if (loaded && typeof loaded === "object" && !Array.isArray(loaded)) {
      return loaded as Record<string, unknown>
    }
  } catch {
    return { text: raw }
  }
  return {}
}

function textOf(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function dayKey(value: Date): string {
  return `${value.getFullYear()}-${value.getMonth()}-${value.getDate()}`
}

function pad(value: number): string {
  return String(value).padStart(2, "0")
}
