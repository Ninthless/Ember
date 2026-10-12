import { contextBridge, ipcRenderer } from "electron"
import type { Settings } from "../shared/settings"

const spark = {
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
  }
}

contextBridge.exposeInMainWorld("spark", spark)

