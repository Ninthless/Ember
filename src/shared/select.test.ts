import assert from "node:assert/strict"
import test from "node:test"
import { testBlock } from "./decide"
import { dueBlocked, filterPicked, omitExcluded, planChecked } from "./select"

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
  { peerUid: "", conversationId: "7524551011583771176", name: "群", isGroup: true, sendTarget: true, conversationShortId: 9n, iSentToday: false, ticket: "ticket-1" },
  { peerUid: "4", name: "短", isGroup: false, sendTarget: true, conversationShortId: 0n, iSentToday: false },
  { peerUid: "5", name: "挡", isGroup: false, sendTarget: false, conversationShortId: 9n, iSentToday: false }
]

test("test send uses only checked chats and still sends a group after today", () => {
  const plan = planChecked(people, ["1", "7524551011583771176", "4", "5", "9"], testBlock)
  assert.deepEqual(
    plan.ready.map((row) => row.peerUid || row.conversationId),
    ["1", "7524551011583771176"]
  )
  assert.deepEqual(plan.skipped.map((item) => item.detail), ["没有会话短号", "这个会话不能发", "当前会话里没有这个人"])
  assert.deepEqual(planChecked(people, [], testBlock), { ready: [], skipped: [] })
})

test("excluded chats leave the due set and are not test-sent", () => {
  assert.deepEqual(
    omitExcluded(rows, ["1"]).map((row) => row.peerUid),
    ["2"]
  )
  assert.equal(omitExcluded(rows, []).length, 2)
  const plan = planChecked(people, ["1", "7524551011583771176", "4"], testBlock, ["7524551011583771176", "4"])
  assert.deepEqual(
    plan.ready.map((row) => row.peerUid || row.conversationId),
    ["1"]
  )
  assert.deepEqual(plan.skipped.map((item) => item.detail), ["已排除", "已排除"])
})
