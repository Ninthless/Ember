import assert from "node:assert/strict"
import test from "node:test"
import { flameLabel, formatChatTime, selectId, sendDecision, type SparkRow } from "./spark"

function row(patch: Partial<SparkRow> = {}): SparkRow {
  return {
    conversationId: "0:1:1:2",
    conversationShortId: 9n,
    conversationType: 1,
    name: "青楸",
    peerUid: "2",
    isGroup: false,
    sendTarget: true,
    flame: {
      kind: "gray",
      text: "今天",
      days: 2,
      style: "",
      relation: "",
      state: null,
      recoverDays: null,
      recoverNeedDays: null,
      renewed: false
    },
    iSentToday: false,
    otherSentToday: false,
    ticket: "ticket",
    secUid: "",
    avatarUrl: "",
    uniqueId: "",
    lastText: "",
    lastAt: 0,
    ...patch
  }
}

test("public spark labels stay available without the protocol", () => {
  assert.equal(flameLabel(row().flame), "今天未点亮 今天")
  assert.equal(selectId(row({ isGroup: true, conversationId: "group-1" })), "group-1")
  assert.deepEqual(sendDecision(row()), ["due", "今天待发"])
  const now = new Date(2026, 9, 11, 15, 4, 0)
  assert.equal(formatChatTime(Math.floor(now.getTime() / 1000) - 3600, now), "14:04")
})
