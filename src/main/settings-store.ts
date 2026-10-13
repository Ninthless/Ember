import { app } from "electron"
import { mkdir, readFile, rename, writeFile } from "fs/promises"
import { dirname, join } from "path"
import { DEFAULT_SETTINGS, normalizeSettings, type Settings } from "../shared/settings"

export async function readSettings(): Promise<Settings> {
  try {
    const raw = await readFile(settingsPath(), "utf8")
    return normalizeSettings(JSON.parse(raw))
  } catch {
    return { ...DEFAULT_SETTINGS, runAt: [...DEFAULT_SETTINGS.runAt], picked: [], excluded: [] }
  }
}

export async function writeSettings(input: unknown): Promise<Settings> {
  const settings = normalizeSettings(input)
  const path = settingsPath()
  await mkdir(dirname(path), { recursive: true })
  const temporary = `${path}.tmp`
  await writeFile(temporary, JSON.stringify(settings), "utf8")
  await rename(temporary, path)
  return settings
}

function settingsPath(): string {
  return join(app.getPath("userData"), "settings.json")
}
