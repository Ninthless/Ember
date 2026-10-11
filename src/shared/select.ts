export type Pickable = {
  peerUid: string
}

export function filterPicked<T extends Pickable>(rows: T[], limited: boolean, picked: string[]): T[] {
  if (!limited) {
    return rows
  }
  const wanted = new Set(picked)
  return rows.filter((row) => wanted.has(row.peerUid))
}

export function dueBlocked(limited: boolean, picked: string[]): boolean {
  return limited && picked.length === 0
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
  block: (row: T) => string | null
): CheckedPlan<T> {
  const wanted = new Set(picked.filter(Boolean))
  const ready: T[] = []
  const skipped: CheckedSkip[] = []
  const seen = new Set<string>()
  for (const row of rows) {
    if (!wanted.has(row.peerUid)) {
      continue
    }
    seen.add(row.peerUid)
    const detail = block(row)
    if (detail) {
      skipped.push({ uid: row.peerUid, name: row.name, detail })
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
