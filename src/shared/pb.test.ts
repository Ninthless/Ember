import assert from "node:assert/strict"
import test from "node:test"
import { encodeInt, fieldInt, iterFields } from "./pb"

test("varint round trip keeps a large short id", () => {
  const shortId = 3601621550632363n
  const encoded = encodeInt(2, shortId)
  assert.equal(fieldInt(encoded, 2), shortId)
})

test("group wire is skipped instead of failing the packet", () => {
  const group = Uint8Array.from([0x1b, 0x08, 0x01, 0x1c])
  const fields = iterFields(group)
  assert.equal(fields.length, 1)
  assert.equal(fields[0][0], 3)
  assert.ok(fields[0][2] instanceof Uint8Array)
})
