export const FRONTIER_SOCKET = "wss://frontier-im.douyin.com/ws/v2"

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

export function frontierCursorScript(): string {
  return `(() => {
    const state = window.__sparkFrontier
    return state && typeof state.seq === "number" ? state.seq : 0
  })()`
}
