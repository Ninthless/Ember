import { app, BrowserWindow, ipcMain, session, shell, type Session } from "electron"
import { join } from "path"
import { chromeClientHint, chromeUserAgent } from "../shared/browser-ua"
import { containContents, installGuestSchemeHandlers, registerGuestSchemes } from "./guest-schemes"
import { readSettings, writeSettings } from "./settings-store"

registerGuestSchemes()

const CHAT_URL = "https://www.douyin.com/chat"
const CHROME_VERSION = process.versions.chrome || "152.0.7977.130"
const CHROME_UA = chromeUserAgent(CHROME_VERSION)
const CHROME_HINT = chromeClientHint(CHROME_VERSION)

app.userAgentFallback = CHROME_UA

function prepareGuestSession(): Session {
  const guest = session.fromPartition("persist:douyin")
  guest.setUserAgent(CHROME_UA, "zh-CN")
  guest.webRequest.onBeforeSendHeaders(
    { urls: ["https://*.douyin.com/*", "https://*.douyinpic.com/*", "https://*.douyincdn.com/*", "https://*.iesdouyin.com/*", "https://*.douyinstatic.com/*", "https://*.bytegoofy.com/*", "https://*.bytetos.com/*", "https://*.byteimg.com/*", "https://*.snssdk.com/*"] },
    (details, callback) => {
      const headers = { ...details.requestHeaders }
      const current = String(headers["User-Agent"] || headers["user-agent"] || "")
      if (current.includes("Electron")) {
        headers["User-Agent"] = CHROME_UA
        delete headers["user-agent"]
      }
      const brand = String(headers["sec-ch-ua"] || headers["Sec-CH-UA"] || "")
      if (brand.includes("Electron")) {
        headers["sec-ch-ua"] = CHROME_HINT
        headers["sec-ch-ua-mobile"] = "?0"
        headers["sec-ch-ua-platform"] = '"Windows"'
      }
      callback({ requestHeaders: headers })
    }
  )
  return guest
}

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1080,
    minHeight: 680,
    show: false,
    autoHideMenuBar: true,
    title: "续火花",
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webviewTag: true
    }
  })
  win.on("ready-to-show", () => win.show())
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) {
      shell.openExternal(url)
    }
    return { action: "deny" }
  })
  win.webContents.on("did-attach-webview", (_event, guestContents) => {
    guestContents.setUserAgent(CHROME_UA)
  })
  win.webContents.on("will-attach-webview", (event, webPreferences, params) => {
    if (!params.src.startsWith(CHAT_URL)) {
      event.preventDefault()
      return
    }
    delete webPreferences.preload
    webPreferences.nodeIntegration = false
    webPreferences.contextIsolation = true
  })
  if (process.env.ELECTRON_RENDERER_URL) {
    void win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    void win.loadFile(join(__dirname, "../renderer/index.html"))
  }
  return win
}

app.on("web-contents-created", (_event, contents) => {
  containContents(contents)
})

app.whenReady().then(() => {
  prepareGuestSession()
  installGuestSchemeHandlers()
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ["https://*.douyinpic.com/*", "https://*.douyincdn.com/*"] },
    (details, callback) => {
      callback({ requestHeaders: { ...details.requestHeaders, Referer: "https://www.douyin.com/" } })
    }
  )
  ipcMain.handle("settings:get", () => readSettings())
  ipcMain.handle("settings:save", (_event, input: unknown) => writeSettings(input))
  createWindow()
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

let quitting = false

app.on("before-quit", (event) => {
  if (quitting) {
    return
  }
  quitting = true
  event.preventDefault()
  const guest = session.fromPartition("persist:douyin")
  guest.flushStorageData()
  let released = false
  const done = () => {
    if (released) {
      return
    }
    released = true
    clearTimeout(timer)
    app.quit()
  }
  const timer = setTimeout(done, 1500)
  void guest.cookies.flushStore().finally(done)
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})
