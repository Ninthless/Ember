import { app, BrowserWindow } from "electron"
import electronUpdater from "electron-updater"
import { idleUpdate, type UpdateSnapshot } from "../shared/update"

const { autoUpdater } = electronUpdater

let snapshot: UpdateSnapshot = idleUpdate(app.getVersion())
let checking = false
let installing = false

function publish(next: UpdateSnapshot) {
  snapshot = next
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send("update:status", snapshot)
    }
  }
}

export function currentUpdate(): UpdateSnapshot {
  return snapshot
}

export function updateInstallPending(): boolean {
  return installing
}

export function installUpdater() {
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.on("checking-for-update", () => {
    publish({ ...snapshot, phase: "checking", percent: 0, detail: "正在向 GitHub Releases 查询" })
  })
  autoUpdater.on("update-available", (info) => {
    publish({
      phase: "available",
      version: info.version,
      current: app.getVersion(),
      percent: 0,
      detail: "发现新版本，开始下载"
    })
  })
  autoUpdater.on("update-not-available", () => {
    publish({
      phase: "current",
      version: app.getVersion(),
      current: app.getVersion(),
      percent: 0,
      detail: "已经是最新版本"
    })
  })
  autoUpdater.on("download-progress", (progress) => {
    publish({
      ...snapshot,
      phase: "downloading",
      percent: Math.round(progress.percent),
      detail: "正在下载安装包"
    })
  })
  autoUpdater.on("update-downloaded", (info) => {
    publish({
      phase: "ready",
      version: info.version,
      current: app.getVersion(),
      percent: 100,
      detail: "下载完成，重启后安装"
    })
  })
  autoUpdater.on("error", (error) => {
    publish({
      ...snapshot,
      phase: "error",
      percent: 0,
      detail: error instanceof Error ? error.message : "检查更新失败"
    })
  })
}

export async function checkForUpdate(): Promise<UpdateSnapshot> {
  if (!app.isPackaged) {
    publish({
      phase: "unavailable",
      version: "",
      current: app.getVersion(),
      percent: 0,
      detail: "开发模式不会下载安装包。安装版启动后会自动检查。"
    })
    return snapshot
  }
  if (checking) {
    return snapshot
  }
  checking = true
  try {
    await autoUpdater.checkForUpdates()
  } catch (error) {
    publish({
      ...snapshot,
      phase: "error",
      percent: 0,
      detail: error instanceof Error ? error.message : "检查更新失败"
    })
  } finally {
    checking = false
  }
  return snapshot
}

export function installUpdate(): boolean {
  if (snapshot.phase !== "ready" || installing) {
    return false
  }
  installing = true
  app.quit()
  return true
}

export function handoffUpdate(): void {
  autoUpdater.quitAndInstall(false, true)
}
