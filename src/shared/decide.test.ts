import assert from "node:assert/strict"
import test from "node:test"
import { sendDecision, testBlock } from "./decide"

const row = {
  isGroup: false,
  sendTarget: true,
  conversationShortId: 9n,
  iSentToday: false
}

test("private due chat can send", () => {
  assert.deepEqual(sendDecision(row), ["due", "今天待发"])
})

test("group and missing short id never send", () => {
  assert.equal(sendDecision({ ...row, isGroup: true, sendTarget: false })[0], "group")
  assert.equal(sendDecision({ ...row, conversationShortId: 0n })[0], "short")
  assert.equal(sendDecision({ ...row, iSentToday: true })[0], "sent")
})

test("test send ignores already sent today", () => {
  assert.equal(testBlock({ ...row, iSentToday: true }), null)
  assert.equal(testBlock({ ...row, isGroup: true, sendTarget: false }), "群聊不发")
  assert.equal(testBlock({ ...row, conversationShortId: 0n }), "没有会话短号")
})
