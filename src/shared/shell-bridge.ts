export const CHAT_URL = "https://www.douyin.com/chat"

const ALLOWED_PREFIXES = ["https://", "http://", "file://", "about:", "devtools://", "blob:", "data:"]

export function isInAppUrl(url: string): boolean {
  return ALLOWED_PREFIXES.some((prefix) => url.startsWith(prefix))
}

export function chromeUserAgent(chromeVersion: string): string {
  const version = /^\d+\.\d+\.\d+\.\d+$/.test(chromeVersion) ? chromeVersion : "152.0.7977.130"
  return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version} Safari/537.36`
}

export function chromeClientHint(chromeVersion: string): string {
  const major = chromeVersion.split(".")[0] || "152"
  return `"Chromium";v="${major}", "Google Chrome";v="${major}", "Not.A/Brand";v="99"`
}

export function frontierCursorScript(): string {
  return `(() => {
    const state = window.__sparkFrontier
    return state && typeof state.seq === "number" ? state.seq : 0
  })()`
}

export function installFrontierWatchScript(): string {
  return `(() => {
    const host = "frontier-im.douyin.com"
    const previous = window.__sparkFrontier
    const state = previous && typeof previous === "object" ? previous : { seq: 0, installed: false }
    state.installed = true
    window.__sparkFrontier = state
    const Native = window.WebSocket
    if (!Native || Native.__sparkWrapped) {
      return state.seq || 0
    }
    function Wrapped(url, protocols) {
      const socket = protocols === undefined ? new Native(url) : new Native(url, protocols)
      if (String(url).indexOf(host) >= 0) {
        socket.addEventListener("message", () => { state.seq += 1 })
      }
      return socket
    }
    Wrapped.prototype = Native.prototype
    Wrapped.CONNECTING = Native.CONNECTING
    Wrapped.OPEN = Native.OPEN
    Wrapped.CLOSING = Native.CLOSING
    Wrapped.CLOSED = Native.CLOSED
    Wrapped.__sparkWrapped = true
    window.WebSocket = Wrapped
    return state.seq || 0
  })()`
}
