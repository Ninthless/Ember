import assert from "node:assert/strict"
import test from "node:test"
import { buildCookieEnvelope, edgeDecision, explainSendResponse, ImError, INIT_CMD } from "./im"
import { fieldInt, fieldText } from "./pb"

test("cookie envelope matches the chat page command shape", () => {
  const body = buildCookieEnvelope("Mozilla/5.0 test", INIT_CMD, new Uint8Array(), 10001)
  assert.equal(fieldInt(body, 1), BigInt(INIT_CMD))
  assert.equal(fieldText(body, 3), "0.1.8")
  assert.equal(fieldInt(body, 6), 1n)
  assert.equal(fieldText(body, 11), "douyin_pc")
  assert.equal(fieldText(body, 14), "360000")
  assert.equal(fieldInt(body, 18), 1n)
  assert.equal(fieldText(body, 21), "douyin_web")
  assert.equal(fieldText(body, 22), "web_sdk")
  assert.equal(body[0], 0x08)
  assert.equal(body[1], 0xfb)
  assert.equal(body[2], 0x0f)
})

test("kick json stops before protobuf parsing", () => {
  const payload = new TextEncoder().encode('{"decision": "KICK"}')
  assert.equal(edgeDecision(payload), "KICK")
  assert.throws(() => explainSendResponse(payload), (error: unknown) => {
    assert.ok(error instanceof ImError)
    assert.match(error.message, /decision=KICK/)
    return true
  })
})
