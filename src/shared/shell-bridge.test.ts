import assert from "node:assert/strict"
import test from "node:test"
import { chromeClientHint, chromeUserAgent, isInAppUrl } from "./shell-bridge"

test("guest browser identity does not carry the desktop shell token", () => {
  const ua = chromeUserAgent("152.0.7977.130")
  assert.equal(ua.includes("Electron"), false)
  assert.match(ua, /Chrome\/152\.0\.7977\.130/)
  assert.equal(chromeClientHint("152.0.7977.130").includes("Electron"), false)
})

test("app schemes stay inside the window", () => {
  assert.equal(isInAppUrl("bytedance://dispatch_message/"), false)
  assert.equal(isInAppUrl("snssdk1128://feed"), false)
  assert.equal(isInAppUrl("https://www.douyin.com/chat"), true)
  assert.equal(isInAppUrl("file:///index.html"), true)
})
