import assert from "node:assert/strict"
import test from "node:test"
import { isInAppUrl } from "./navigation"

test("app schemes stay inside the window", () => {
  assert.equal(isInAppUrl("bytedance://dispatch_message/"), false)
  assert.equal(isInAppUrl("snssdk1128://feed"), false)
  assert.equal(isInAppUrl("https://www.douyin.com/chat"), true)
  assert.equal(isInAppUrl("file:///index.html"), true)
})
