import assert from "node:assert/strict"
import test from "node:test"
import { classifyFlame } from "./flame"

test("active normal segment is lit", () => {
  const state = classifyFlame(
    {
      flame_infos: [{ level: "normal|friend", text: "3", start: 1, end: 100, days: 3 }]
    },
    50
  )
  assert.equal(state.kind, "lit")
  assert.equal(state.days, 3)
  assert.equal(state.renewed, true)
})
