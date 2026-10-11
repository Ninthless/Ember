export function sendGuardScript(url: string): string {
  return `(() => {
    if (String(navigator.userAgent || "").includes("Electron")) return "聊天页还被识别成桌面壳，这次没有发出去"
    const interceptor = window.securitySDK && window.securitySDK.secureProxy && window.securitySDK.secureProxy.fetchInterceptor
    const patched = !!(interceptor && interceptor.isInitializedFlag && !String(window.fetch).includes("[native code]"))
    if (!patched) return "聊天页签名还没挂上，这次没有发出去"
    const config = interceptor.utils.getHooksConfigForRequest({ method: "POST", url: ${JSON.stringify(url)} })
    if (!config || !config.needProxy) return "发送接口没有走聊天页签名，这次没有发出去"
    return ""
  })()`
}
