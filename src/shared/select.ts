export type Pickable = {
  peerUid: string
  isGroup?: boolean
  conversationId?: string
}

export function selectId(row: Pickable): string {
  if (row.isGroup && row.conversationId) {
    return row.conversationId
  }
  return row.peerUid
}

export function filterPicked<T extends Pickable>(rows: T[], limited: boolean, picked: string[]): T[] {
  if (!limited) {
    return rows
  }
  const wanted = new Set(picked)
  return rows.filter((row) => wanted.has(selectId(row)))
}

export function dueBlocked(limited: boolean, picked: string[]): boolean {
  return limited && picked.length === 0
}

export function omitExcluded<T extends Pickable>(rows: T[], excluded: string[]): T[] {
  const blocked = new Set(excluded)
  return rows.filter((row) => !blocked.has(selectId(row)))
}

export type CheckedSkip = {
  uid: string
  name: string
  detail: string
}

export type CheckedPlan<T> = {
  ready: T[]
  skipped: CheckedSkip[]
}

export function planChecked<T extends Pickable & { name: string }>(
  rows: T[],
  picked: string[],
  block: (row: T) => string | null,
  excluded: string[] = []
): CheckedPlan<T> {
  const wanted = new Set(picked.filter(Boolean))
  const held = new Set(excluded)
  const ready: T[] = []
  const skipped: CheckedSkip[] = []
  const seen = new Set<string>()
  for (const row of rows) {
    const id = selectId(row)
    if (!wanted.has(id)) {
      continue
    }
    seen.add(id)
    if (held.has(id)) {
      skipped.push({ uid: id, name: row.name, detail: "已排除" })
      continue
    }
    const detail = block(row)
    if (detail) {
      skipped.push({ uid: id, name: row.name, detail })
      continue
    }
    ready.push(row)
  }
  for (const uid of picked) {
    if (uid && !seen.has(uid)) {
      skipped.push({ uid, name: "", detail: "当前会话里没有这个人" })
    }
  }
  return { ready, skipped }
}
