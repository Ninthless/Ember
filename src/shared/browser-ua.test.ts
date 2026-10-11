import assert from "node:assert/strict"
import test from "node:test"
import { chromeClientHint, chromeUserAgent } from "./browser-ua"
import { sendGuardScript } from "./send-guard"

test("guest browser identity does not carry the desktop shell token", () => {
  const ua = chromeUserAgent("152.0.7977.130")
  assert.equal(ua.includes("Electron"), false)
  assert.match(ua, /Chrome\/152\.0\.7977\.130/)
  assert.equal(chromeClientHint("152.0.7977.130").includes("Electron"), false)
})

test("send is blocked before the request when the chat page cannot sign", () => {
  const script = sendGuardScript("https://imapi.douyin.com/v1/message/send")
  assert.match(script, /Electron/)
  assert.match(script, /needProxy/)
  assert.equal(script.includes("sessionid"), false)
})
