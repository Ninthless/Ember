import assert from "node:assert/strict"
import test from "node:test"
import { interactiveContent, selectSparkEmoji } from "./emoji"

test("spark emoji content uses aweType 507", () => {
  const resource = selectSparkEmoji({
    interactive_resource_config: {
      block: {
        interactive_resources: [{ display_name: "续火花", animate_url: "https://example.test/a.gif", height: 64, width: 64, id: 7 }]
      }
    }
  })
  const content = JSON.parse(interactiveContent(resource)) as { aweType: number; image_id: number }
  assert.equal(content.aweType, 507)
  assert.equal(content.image_id, 7)
})
