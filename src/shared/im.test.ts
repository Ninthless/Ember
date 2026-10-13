import assert from "node:assert/strict"
import test from "node:test"
import { buildCookieEnvelope, buildSessionSend, edgeDecision, explainSendResponse, ImError, INIT_CMD } from "./im"
import { fieldBytes, fieldInt, fieldText } from "./pb"

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

test("group send uses the same command with conversation type 2", () => {
  const body = buildSessionSend("Mozilla/5.0 test", "7524551011583771176", 99n, "{}", "ticket-1", 7, "client-1", 2)
  const wrapped = fieldBytes(body, 8)
  assert.ok(wrapped)
  const inner = fieldBytes(wrapped, 100)
  assert.ok(inner)
  assert.equal(fieldText(inner, 1), "7524551011583771176")
  assert.equal(fieldInt(inner, 2), 2n)
  assert.equal(fieldInt(inner, 3), 99n)
  assert.equal(fieldInt(inner, 6), 5n)
  assert.equal(fieldText(inner, 7), "ticket-1")
  assert.equal(fieldText(inner, 8), "client-1")
  assert.throws(() => buildSessionSend("Mozilla/5.0 test", "0:1:1:2", 99n, "{}", "ticket-1", 7, "client-1", 0), /不能发/)
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
