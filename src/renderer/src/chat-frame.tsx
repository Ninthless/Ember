import type { WebviewTag } from "electron"
import { useEffect, useRef, type MutableRefObject } from "react"
import { isInAppUrl } from "@shared/navigation"
import { CHAT_URL } from "./guest"

type Guest = WebviewTag

type Props = {
  visible: boolean
  guestRef: MutableRefObject<Guest | null>
  onReady: () => void
  onSettled: () => void
}

export function ChatFrame({ visible, guestRef, onReady, onSettled }: Props) {
  const localRef = useRef<Guest | null>(null)
  const readyRef = useRef(onReady)
  const settledRef = useRef(onSettled)
  readyRef.current = onReady
  settledRef.current = onSettled

  useEffect(() => {
    let detach = () => {}
    let watch = 0
    const attach = () => {
      const node = localRef.current
      if (!node) {
        return false
      }
      const wake = () => {
        readyRef.current()
        settledRef.current()
      }
      const keepInside = (event: Event) => {
        const url = "url" in event && typeof event.url === "string" ? event.url : ""
        if (url && !isInAppUrl(url)) {
          event.preventDefault()
        }
      }
      node.addEventListener("dom-ready", wake)
      node.addEventListener("did-finish-load", wake)
      node.addEventListener("did-stop-loading", wake)
      node.addEventListener("did-navigate", wake)
      node.addEventListener("did-navigate-in-page", wake)
      node.addEventListener("will-navigate", keepInside)
      node.addEventListener("new-window", keepInside)
      const timer = window.setTimeout(wake, 800)
      detach = () => {
        window.clearTimeout(timer)
        node.removeEventListener("dom-ready", wake)
        node.removeEventListener("did-finish-load", wake)
        node.removeEventListener("did-stop-loading", wake)
        node.removeEventListener("did-navigate", wake)
        node.removeEventListener("did-navigate-in-page", wake)
        node.removeEventListener("will-navigate", keepInside)
        node.removeEventListener("new-window", keepInside)
      }
      return true
    }
    if (!attach()) {
      watch = window.setInterval(() => {
        if (attach()) {
          window.clearInterval(watch)
        }
      }, 200)
    }
    return () => {
      window.clearInterval(watch)
      detach()
    }
  }, [])

  return (
    <div className={visible ? "min-h-0 flex-1" : "pointer-events-none fixed top-0 left-[-12000px] h-[720px] w-[1100px]"}>
      <webview
        ref={(node) => {
          const tag = node as unknown as Guest | null
          localRef.current = tag
          guestRef.current = tag
        }}
        src={CHAT_URL}
        partition="persist:douyin"
        useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.7977.130 Safari/537.36"
        allowpopups={true}
        className="h-full w-full"
      />
    </div>
  )
}
