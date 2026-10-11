const ALLOWED_PREFIXES = ["https://", "http://", "file://", "about:", "devtools://", "blob:", "data:"]

export function isInAppUrl(url: string): boolean {
  return ALLOWED_PREFIXES.some((prefix) => url.startsWith(prefix))
}
