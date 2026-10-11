import assert from "node:assert/strict"
import test from "node:test"
import { formatChatTime, previewMessage } from "./preview"

test("chat preview uses the page labels", () => {
  assert.equal(previewMessage(7, JSON.stringify({ text: "全是技术部的" })), "全是技术部的")
  assert.equal(previewMessage(8, "{}"), "分享[视频]")
  assert.equal(previewMessage(5, JSON.stringify({ display_name: "早上好" })), "[早上好]")
  assert.equal(previewMessage(17, ""), "[语音]")
  assert.equal(previewMessage(99, "纯文本"), "纯文本")
})

test("chat time is clock today and month-day earlier this year", () => {
  const now = new Date(2026, 9, 11, 15, 4, 0)
  assert.equal(formatChatTime(Math.floor(now.getTime() / 1000) - 60, now), "15:03")
  assert.equal(formatChatTime(Math.floor(new Date(2026, 9, 10, 8, 0, 0).getTime() / 1000), now), "10-10")
  assert.equal(formatChatTime(0, now), "")
})
