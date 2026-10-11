import { protocol, session, type WebContents } from "electron"
import { isInAppUrl } from "../shared/navigation"

const APP_SCHEMES = ["bytedance", "snssdk", "snssdk1128", "aweme", "douyin"]

export function registerGuestSchemes(): void {
  protocol.registerSchemesAsPrivileged(
    APP_SCHEMES.map((scheme) => ({
      scheme,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true
      }
    }))
  )
}

export function installGuestSchemeHandlers(): void {
  const swallow = () => new Response(null, { status: 204 })
  const sessions = [session.defaultSession, session.fromPartition("persist:douyin")]
  for (const scheme of APP_SCHEMES) {
    for (const current of sessions) {
      current.protocol.handle(scheme, swallow)
    }
  }
}

export function containContents(contents: WebContents): void {
  contents.setWindowOpenHandler(({ url }) => {
    if (!isInAppUrl(url)) {
      return { action: "deny" }
    }
    return { action: "allow" }
  })
  const block = (event: { preventDefault: () => void }, url: string) => {
    if (!isInAppUrl(url)) {
      event.preventDefault()
    }
  }
  contents.on("will-navigate", block)
  contents.on("will-redirect", block)
  contents.on("will-frame-navigate", (event, url) => {
    block(event, url)
  })
}
