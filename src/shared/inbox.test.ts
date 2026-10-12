import assert from "node:assert/strict"
import test from "node:test"
import { applySentToday, parseInit } from "./inbox"
import { concat, encodeBytes, encodeInt, encodeKv, encodeString } from "./pb"

test("sent peers are marked as sent today without touching the others", () => {
  const rows = [
    { peerUid: "222222", iSentToday: false },
    { peerUid: "333333", iSentToday: false }
  ]
  const next = applySentToday(rows, ["222222", ""])
  assert.equal(next[0].iSentToday, true)
  assert.equal(next[1].iSentToday, false)
  assert.equal(rows[0].iSentToday, false)
  assert.equal(applySentToday(rows, []).length, 2)
})

test("init packet keeps the peer and skips a group without flame data", () => {
  const now = new Date("2026-10-11T12:00:00")
  const flame = JSON.stringify({
    flame_infos: [{ level: "gray|friend", text: "今天", start: 1, end: 2_000_000_000, days: 2 }]
  })
  const info = concat(
    encodeString(1, "0:1:111111:222222"),
    encodeInt(2, 99n),
    encodeInt(3, 1),
    encodeString(4, "ticket-1"),
    encodeBytes(50, concat(encodeString(5, "青楸"), encodeKv(11, "a:consecutive_chat_data", flame)))
  )
  const page = parseInit(encodeBytes(2043, encodeBytes(1, encodeBytes(1, info))), "111111", now)
  assert.equal(page.rows.length, 1)
  assert.equal(page.rows[0].peerUid, "222222")
  assert.equal(page.rows[0].name, "青楸")
  assert.equal(page.rows[0].ticket, "ticket-1")
  assert.equal(page.rows[0].conversationShortId, 99n)
  assert.equal(page.rows[0].isGroup, false)
  assert.equal(page.rows[0].secUid, "")
  assert.equal(page.rows[0].lastText, "")
})

test("init keeps the peer sec uid, last preview, and group avatar", () => {
  const now = new Date("2026-10-11T12:00:00")
  const flame = JSON.stringify({
    flame_infos: [{ level: "normal|friend", text: "2", start: 1, end: 2_000_000_000, days: 2 }]
  })
  const person = concat(encodeInt(1, 222222n), encodeString(5, "SEC-PEER"))
  const info = concat(
    encodeString(1, "0:1:111111:222222"),
    encodeInt(2, 99n),
    encodeInt(3, 1),
    encodeBytes(6, encodeBytes(1, person)),
    encodeBytes(50, concat(encodeKv(11, "a:consecutive_chat_data", flame)))
  )
  const message = concat(
    encodeInt(6, 8),
    encodeInt(7, 222222n),
    encodeString(8, "{}"),
    encodeInt(10, 1_760_176_800)
  )
  const page = parseInit(encodeBytes(2043, encodeBytes(1, concat(encodeBytes(1, info), encodeBytes(2, message)))), "111111", now)
  assert.equal(page.rows[0].name, "")
  assert.equal(page.rows[0].secUid, "SEC-PEER")
  assert.equal(page.rows[0].lastText, "分享[视频]")
  assert.equal(page.rows[0].lastAt, 1_760_176_800)

  const groupInfo = concat(
    encodeString(1, "7524551011583771176"),
    encodeInt(3, 2),
    encodeBytes(
      50,
      concat(
        encodeString(5, "哈基咪"),
        encodeKv(11, "a:consecutive_chat_data", flame),
        encodeKv(11, "a:ab_avatar", "https://example.invalid/group.jpg")
      )
    )
  )
  const group = parseInit(encodeBytes(2043, encodeBytes(1, encodeBytes(1, groupInfo))), "111111", now)
  assert.equal(group.rows[0].name, "哈基咪")
  assert.equal(group.rows[0].avatarUrl, "https://example.invalid/group.jpg")
  assert.equal(group.rows[0].secUid, "")
})
