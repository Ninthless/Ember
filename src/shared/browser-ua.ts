export function chromeUserAgent(chromeVersion: string): string {
  const version = /^\d+\.\d+\.\d+\.\d+$/.test(chromeVersion) ? chromeVersion : "152.0.7977.130"
  return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version} Safari/537.36`
}

export function chromeClientHint(chromeVersion: string): string {
  const major = chromeVersion.split(".")[0] || "152"
  return `"Chromium";v="${major}", "Google Chrome";v="${major}", "Not.A/Brand";v="99"`
}
