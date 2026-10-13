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

test("group can be due and a missing short id or ticket never sends", () => {
  assert.deepEqual(sendDecision({ ...row, isGroup: true, sendTarget: true, ticket: "ticket-1" }), ["due", "今天待发"])
  assert.equal(sendDecision({ ...row, sendTarget: false })[0], "blocked")
  assert.equal(sendDecision({ ...row, conversationShortId: 0n })[0], "short")
  assert.equal(sendDecision({ ...row, ticket: "" })[0], "ticket")
  assert.equal(sendDecision({ ...row, iSentToday: true })[0], "sent")
})

test("test send ignores already sent today", () => {
  assert.equal(testBlock({ ...row, iSentToday: true }), null)
  assert.equal(testBlock({ ...row, isGroup: true, sendTarget: true }), null)
  assert.equal(testBlock({ ...row, sendTarget: false }), "这个会话不能发")
  assert.equal(testBlock({ ...row, conversationShortId: 0n }), "没有会话短号")
  assert.equal(testBlock({ ...row, ticket: "  " }), "没有票据")
})
