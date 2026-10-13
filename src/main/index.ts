import { app, BrowserWindow, ipcMain, session, shell, type Session } from "electron"
import { existsSync } from "fs"
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
app.setAppUserModelId("com.ninthless.ember")

function windowIcon(): string | undefined {
  const ico = join(app.getAppPath(), "resources", "icon.ico")
  if (existsSync(ico)) {
    return ico
  }
  const png = join(app.getAppPath(), "resources", "icon.png")
  return existsSync(png) ? png : undefined
}

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
    frame: false,
    autoHideMenuBar: true,
    roundedCorners: true,
    backgroundColor: "#fafafa",
    title: "Ember",
    icon: windowIcon(),
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webviewTag: true
    }
  })
  win.on("ready-to-show", () => win.show())
  const notifyMaximized = (value: boolean) => {
    if (!win.isDestroyed()) {
      win.webContents.send("window:maximized", value)
    }
  }
  win.on("maximize", () => notifyMaximized(true))
  win.on("unmaximize", () => notifyMaximized(false))
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
  ipcMain.handle("window:minimize", (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize()
  })
  ipcMain.handle("window:toggle-maximize", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) {
      return false
    }
    if (win.isMaximized()) {
      win.unmaximize()
    } else {
      win.maximize()
    }
    return win.isMaximized()
  })
  ipcMain.handle("window:close", (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close()
  })
  ipcMain.handle("window:is-maximized", (event) => BrowserWindow.fromWebContents(event.sender)?.isMaximized() ?? false)
  ipcMain.handle("window:set-background", (event, color: unknown) => {
    if (typeof color !== "string" || !/^#[0-9a-fA-F]{6}$/.test(color)) {
      return
    }
    BrowserWindow.fromWebContents(event.sender)?.setBackgroundColor(color)
  })
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
