import { contextBridge, ipcRenderer } from "electron"
import type { Settings } from "../shared/settings"

const spark = {
  getSettings: (): Promise<Settings> => ipcRenderer.invoke("settings:get"),
  saveSettings: (settings: Settings): Promise<Settings> => ipcRenderer.invoke("settings:save", settings)
}

contextBridge.exposeInMainWorld("spark", spark)

