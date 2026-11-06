import { contextBridge, ipcRenderer } from "electron"
import type { Settings } from "../shared/settings"
import type { UpdateSnapshot } from "../shared/update"
import { windowChrome } from "../shared/window-chrome"

const spark = {
  chrome: windowChrome(process.platform),
  getSettings: (): Promise<Settings> => ipcRenderer.invoke("settings:get"),
  saveSettings: (settings: Settings): Promise<Settings> => ipcRenderer.invoke("settings:save", settings),
  window: {
    minimize: (): Promise<void> => ipcRenderer.invoke("window:minimize"),
    toggleMaximize: (): Promise<boolean> => ipcRenderer.invoke("window:toggle-maximize"),
    close: (): Promise<void> => ipcRenderer.invoke("window:close"),
    isMaximized: (): Promise<boolean> => ipcRenderer.invoke("window:is-maximized"),
    setBackground: (color: string): Promise<void> => ipcRenderer.invoke("window:set-background", color),
    onMaximized: (listener: (value: boolean) => void): (() => void) => {
      const wrapped = (_event: unknown, value: boolean) => listener(value)
      ipcRenderer.on("window:maximized", wrapped)
      return () => ipcRenderer.removeListener("window:maximized", wrapped)
    }
  },
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke("app:open", url),
  update: {
    status: (): Promise<UpdateSnapshot> => ipcRenderer.invoke("update:status"),
    check: (): Promise<UpdateSnapshot> => ipcRenderer.invoke("update:check"),
    install: (): Promise<boolean> => ipcRenderer.invoke("update:install"),
    onStatus: (listener: (snapshot: UpdateSnapshot) => void): (() => void) => {
      const wrapped = (_event: unknown, snapshot: UpdateSnapshot) => listener(snapshot)
      ipcRenderer.on("update:status", wrapped)
      return () => ipcRenderer.removeListener("update:status", wrapped)
    }
  }
}

contextBridge.exposeInMainWorld("spark", spark)

