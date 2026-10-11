import assert from "node:assert/strict"
import test from "node:test"
import { testBlock } from "./decide"
import { dueBlocked, filterPicked, planChecked } from "./select"

const rows = [{ peerUid: "1" }, { peerUid: "2" }]

test("missing limit sends every due row", () => {
  assert.equal(filterPicked(rows, false, []).length, 2)
  assert.equal(dueBlocked(false, []), false)
})

test("an empty saved list blocks the due send", () => {
  assert.deepEqual(filterPicked(rows, true, []), [])
  assert.equal(dueBlocked(true, []), true)
})

test("a saved list keeps only those uids", () => {
  assert.deepEqual(filterPicked(rows, true, ["2"]), [{ peerUid: "2" }])
})

const people = [
  { peerUid: "1", name: "甲", isGroup: false, sendTarget: true, conversationShortId: 9n, iSentToday: true },
  { peerUid: "2", name: "乙", isGroup: false, sendTarget: true, conversationShortId: 9n, iSentToday: false },
  { peerUid: "3", name: "群", isGroup: true, sendTarget: false, conversationShortId: 9n, iSentToday: false },
  { peerUid: "4", name: "短", isGroup: false, sendTarget: true, conversationShortId: 0n, iSentToday: false }
]

test("test send uses only checked people and still sends after today", () => {
  const plan = planChecked(people, ["1", "3", "4", "9"], testBlock)
  assert.deepEqual(plan.ready.map((row) => row.peerUid), ["1"])
  assert.deepEqual(plan.skipped.map((item) => item.detail), ["群聊不发", "没有会话短号", "当前会话里没有这个人"])
  assert.deepEqual(planChecked(people, [], testBlock), { ready: [], skipped: [] })
})
