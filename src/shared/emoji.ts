export const SPARK_EMOJI_NAME = "续火花"
export const INTERACTIVE_AWE = 507
export const STRATEGY_URL = "https://www.douyin.com/aweme/v1/web/im/strategy/config/"

export class EmojiError extends Error {}

export type EmojiResource = {
  display_name?: unknown
  height?: unknown
  width?: unknown
  animate_url?: unknown
  resource_type?: unknown
  static_url_list?: unknown
  id?: unknown
}

export function interactiveContent(resource: EmojiResource): string {
  const animateUrl = String(resource.animate_url ?? "")
  if (!animateUrl) {
    throw new EmojiError("互动表情缺少图片地址")
  }
  const height = Number(resource.height ?? 0) || 0
  const width = Number(resource.width ?? 0) || 0
  let chosen = animateUrl
  if (Number(resource.resource_type ?? 0) === 5 && Array.isArray(resource.static_url_list)) {
    const first = resource.static_url_list[0]
    if (first && typeof first === "object" && !Array.isArray(first)) {
      chosen = String((first as { static_url?: unknown }).static_url ?? animateUrl)
    }
  }
  const payload: Record<string, unknown> = {
    aweType: INTERACTIVE_AWE,
    createdAt: 0,
    display_name: String(resource.display_name ?? SPARK_EMOJI_NAME),
    height,
    width,
    image_type: "gif",
    is_card: false,
    may_show_special_effect: false,
    msgHint: "",
    package_id: 0,
    updateConversationTime: true,
    url: {
      height,
      uri: chosen,
      url_list: [chosen],
      width
    }
  }
  if (typeof resource.id === "number" && Number.isInteger(resource.id)) {
    payload.image_id = resource.id
  }
  return JSON.stringify(payload)
}

export function selectSparkEmoji(loaded: Record<string, unknown>): EmojiResource {
  const config = loaded.interactive_resource_config
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new EmojiError("互动表情配置缺失")
  }
  for (const block of Object.values(config)) {
    if (!block || typeof block !== "object" || Array.isArray(block)) {
      continue
    }
    const resources = (block as { interactive_resources?: unknown }).interactive_resources
    if (!Array.isArray(resources)) {
      continue
    }
    for (const item of resources) {
      if (item && typeof item === "object" && !Array.isArray(item) && (item as EmojiResource).display_name === SPARK_EMOJI_NAME) {
        return item as EmojiResource
      }
    }
  }
  throw new EmojiError("互动表情里没有续火花")
}

export function strategyQuery(): string {
  return new URLSearchParams({
    device_platform: "webapp",
    aid: "1128",
    channel: "channel_pc_web",
    app_id: "1128",
    scenes: '["interactive_resources"]',
    update_version_code: "170400",
    pc_client_type: "1",
    version_code: "170400",
    version_name: "17.4.0"
  }).toString()
}
