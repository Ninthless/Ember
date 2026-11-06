export type WindowChrome = {
  platform: "darwin" | "win32" | "linux"
  height: number
  leading: number
  trailing: number
}

export function windowChrome(platform: string): WindowChrome {
  if (platform === "darwin") {
    return { platform: "darwin", height: 48, leading: 84, trailing: 12 }
  }
  if (platform === "linux") {
    return { platform: "linux", height: 48, leading: 14, trailing: 144 }
  }
  return { platform: "win32", height: 48, leading: 14, trailing: 144 }
}
