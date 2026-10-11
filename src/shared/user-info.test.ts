import assert from "node:assert/strict"
import test from "node:test"
import type { SparkRow } from "./inbox"
import { applyPeerCards, parseUserInfo, readUserInfoScript, userInfoForm, userInfoQuery } from "./user-info"

const PEER = "2344629675766926"

function row(name: string, group: boolean): SparkRow {
  return {
    conversationId: group ? "group-1" : `0:1:1:${PEER}`,
    conversationShortId: 1n,
    conversationType: group ? 2 : 1,
    name,
    peerUid: group ? "" : PEER,
    isGroup: group,
    sendTarget: !group,
    flame: {
      kind: "lit",
      text: "2",
      days: 2,
      style: "",
      relation: "",
      state: null,
      recoverDays: null,
      recoverNeedDays: null,
      renewed: true
    },
    iSentToday: false,
    otherSentToday: false,
    ticket: "",
    secUid: group ? "" : "SEC-PEER",
    avatarUrl: "",
    uniqueId: "",
    lastText: "",
    lastAt: 0
  }
}

test("user info request matches the chat page batch", () => {
  assert.equal(userInfoQuery().includes("aid=6383"), true)
  assert.equal(userInfoQuery().includes("version_name=17.4.0"), true)
  const form = userInfoForm(["SEC-PEER", "SEC-PEER"])
  assert.equal(form.includes("SEC-PEER"), true)
  assert.equal(form.includes("profile%2Fother") || form.includes("profile/other"), false)
  const script = readUserInfoScript(["SEC-PEER"])
  assert.equal(script.includes("URLSearchParams"), true)
  assert.equal(script.includes("/aweme/v1/web/im/user/info/"), true)
  assert.equal(script.includes("SEC-PEER"), true)
  assert.equal(script.includes("sessionid"), false)
  assert.equal(script.includes("www.douyin.com/aweme/v1/web/im/user/info/"), false)
  assert.throws(() => readUserInfoScript([" "]), /sec_uid/)
})

test("user info prefers remark and does not rename a group", () => {
  const cards = parseUserInfo({
    status_code: 0,
    data: [
      {
        uid: PEER,
        nickname: "昵称",
        remark_name: "郑爽",
        unique_id: "zheng",
        avatar_thumb: { url_list: ["https://example.invalid/a.jpg"] }
      }
    ]
  })
  const named = applyPeerCards([row("", false), row("哈基咪", true), row(PEER, false)], cards)
  assert.equal(named[0].name, "郑爽")
  assert.equal(named[2].name, "郑爽")
  assert.equal(named[0].avatarUrl, "https://example.invalid/a.jpg")
  assert.equal(named[0].uniqueId, "zheng")
  assert.equal(named[1].name, "哈基咪")
  assert.equal(named[2].avatarUrl, "https://example.invalid/a.jpg")
})
