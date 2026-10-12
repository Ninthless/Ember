import assert from "node:assert/strict"
import test from "node:test"
import vm from "node:vm"
import { frontierCursorScript, installFrontierWatchScript } from "./frontier-watch"

test("frontier frames advance the cursor once per message", () => {
  class FakeSocket {
    listeners: Array<() => void>
    constructor(public url: string) {
      this.listeners = []
    }
    addEventListener(_type: string, listener: () => void) {
      this.listeners.push(listener)
    }
    emit() {
      for (const listener of this.listeners) {
        listener()
      }
    }
    static CONNECTING = 0
    static OPEN = 1
    static CLOSING = 2
    static CLOSED = 3
  }
  const sandbox = { window: { WebSocket: FakeSocket, __sparkFrontier: undefined as unknown } }
  vm.createContext(sandbox)
  vm.runInContext(installFrontierWatchScript(), sandbox)
  vm.runInContext(installFrontierWatchScript(), sandbox)
  const live = new sandbox.window.WebSocket("wss://frontier-im.douyin.com/ws/v2?aid=1") as FakeSocket
  const other = new sandbox.window.WebSocket("wss://example.invalid/ws") as FakeSocket
  live.emit()
  live.emit()
  other.emit()
  assert.equal(vm.runInContext(frontierCursorScript(), sandbox), 2)
})
