import assert from "node:assert/strict"
import test from "node:test"
import { windowChrome } from "./window-chrome"

test("window chrome reserves the system buttons for each platform", () => {
  const mac = windowChrome("darwin")
  const win = windowChrome("win32")
  const linux = windowChrome("linux")
  assert.equal(mac.leading > mac.trailing, true)
  assert.equal(win.trailing > win.leading, true)
  assert.equal(linux.trailing > linux.leading, true)
  assert.equal(windowChrome("freebsd").platform, "win32")
})
