import assert from "node:assert/strict"
import test from "node:test"
import { normalizeSettings } from "./settings"

test("saved settings stay off until auto send is explicitly true", () => {
  const settings = normalizeSettings({ autoSend: "yes", runAt: ["10:05", "21:05"], picked: ["1", "1", "abc"] })
  assert.equal(settings.autoSend, false)
  assert.deepEqual(settings.picked, ["1"])
  assert.deepEqual(normalizeSettings({ autoSend: true }).runAt, ["10:05", "21:05"])
})
