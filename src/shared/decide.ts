export type DecisionRow = {
  isGroup: boolean
  sendTarget: boolean
  conversationShortId: bigint
  iSentToday: boolean
}

export function sendDecision(row: DecisionRow): [string, string] {
  if (row.isGroup || !row.sendTarget) {
    return ["group", "群聊不发"]
  }
  if (row.conversationShortId <= 0n) {
    return ["short", "没有会话短号"]
  }
  if (row.iSentToday) {
    return ["sent", "今天已发，定时跳过"]
  }
  return ["due", "今天待发"]
}

export function testBlock(row: DecisionRow): string | null {
  const [kind, label] = sendDecision({ ...row, iSentToday: false })
  return kind === "due" ? null : label
}
