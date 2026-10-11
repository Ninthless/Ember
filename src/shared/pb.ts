export function encodeVarint(value: number | bigint): Uint8Array {
  let current = typeof value === "bigint" ? value : BigInt(value)
  if (current < 0n) {
    current = BigInt.asUintN(64, current)
  }
  const out: number[] = []
  while (true) {
    const piece = Number(current & 0x7fn)
    current >>= 7n
    if (current > 0n) {
      out.push(piece | 0x80)
    } else {
      out.push(piece)
      return Uint8Array.from(out)
    }
  }
}

export function encodeKey(field: number, wire: number): Uint8Array {
  return encodeVarint((field << 3) | wire)
}

export function encodeInt(field: number, value: number | bigint): Uint8Array {
  return concat(encodeKey(field, 0), encodeVarint(value))
}

export function encodeBytes(field: number, payload: Uint8Array): Uint8Array {
  return concat(encodeKey(field, 2), encodeVarint(payload.length), payload)
}

export function encodeString(field: number, text: string): Uint8Array {
  return encodeBytes(field, new TextEncoder().encode(text))
}

export function encodeKv(field: number, key: string, value: string): Uint8Array {
  return encodeBytes(field, concat(encodeString(1, key), encodeString(2, value)))
}

export function concat(...parts: Uint8Array[]): Uint8Array {
  const length = parts.reduce((sum, part) => sum + part.length, 0)
  const out = new Uint8Array(length)
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}

export function decodeVarint(data: Uint8Array, pos: number): [bigint, number] {
  let value = 0n
  let shift = 0n
  while (pos < data.length) {
    const piece = data[pos]
    pos += 1
    value |= BigInt(piece & 0x7f) << shift
    if ((piece & 0x80) === 0) {
      return [value, pos]
    }
    shift += 7n
    if (shift > 63n) {
      break
    }
  }
  throw new Error("varint 被截断")
}

export type Field = [number, number, bigint | Uint8Array]

export function iterFields(data: Uint8Array): Field[] {
  const found: Field[] = []
  let pos = 0
  while (pos < data.length) {
    const [tag, next] = decodeVarint(data, pos)
    pos = next
    const field = Number(tag >> 3n)
    const wire = Number(tag & 7n)
    if (wire === 0) {
      const [value, after] = decodeVarint(data, pos)
      found.push([field, wire, value])
      pos = after
    } else if (wire === 2) {
      const [length, after] = decodeVarint(data, pos)
      const end = after + asLength(length)
      if (end > data.length) {
        throw new Error("length-delimited 越界")
      }
      found.push([field, wire, data.slice(after, end)])
      pos = end
    } else if (wire === 1) {
      const end = pos + 8
      if (end > data.length) {
        throw new Error("fixed64 越界")
      }
      found.push([field, wire, data.slice(pos, end)])
      pos = end
    } else if (wire === 5) {
      const end = pos + 4
      if (end > data.length) {
        throw new Error("fixed32 越界")
      }
      found.push([field, wire, data.slice(pos, end)])
      pos = end
    } else if (wire === 3) {
      const start = pos
      const [contentEnd, after] = skipGroup(data, pos, field)
      found.push([field, 2, data.slice(start, contentEnd)])
      pos = after
    } else {
      throw new Error(`不支持的 wire type: ${wire}`)
    }
  }
  return found
}

function skipGroup(data: Uint8Array, pos: number, field: number): [number, number] {
  while (pos < data.length) {
    const tagAt = pos
    const [tag, next] = decodeVarint(data, pos)
    pos = next
    const number = Number(tag >> 3n)
    const wire = Number(tag & 7n)
    if (wire === 4 && number === field) {
      return [tagAt, pos]
    }
    pos = skipPayload(data, pos, wire, number)
  }
  throw new Error("group 没结束")
}

function skipPayload(data: Uint8Array, pos: number, wire: number, field: number): number {
  if (wire === 0) {
    return decodeVarint(data, pos)[1]
  }
  if (wire === 1) {
    if (pos + 8 > data.length) {
      throw new Error("fixed64 越界")
    }
    return pos + 8
  }
  if (wire === 5) {
    if (pos + 4 > data.length) {
      throw new Error("fixed32 越界")
    }
    return pos + 4
  }
  if (wire === 2) {
    const [length, after] = decodeVarint(data, pos)
    const end = after + asLength(length)
    if (end > data.length) {
      throw new Error("length-delimited 越界")
    }
    return end
  }
  if (wire === 3) {
    return skipGroup(data, pos, field)[1]
  }
  if (wire === 4) {
    throw new Error("group 提前结束")
  }
  throw new Error(`不支持的 wire type: ${wire}`)
}

export function fieldBytes(data: Uint8Array, field: number): Uint8Array | null {
  for (const [number, wire, value] of iterFields(data)) {
    if (number === field && wire === 2 && value instanceof Uint8Array) {
      return value
    }
  }
  return null
}

export function fieldInt(data: Uint8Array, field: number): bigint | null {
  for (const [number, wire, value] of iterFields(data)) {
    if (number === field && wire === 0 && typeof value === "bigint") {
      return value
    }
  }
  return null
}

export function fieldText(data: Uint8Array, field: number): string {
  const payload = fieldBytes(data, field)
  if (!payload) {
    return ""
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(payload)
}

export function repeatedKv(data: Uint8Array, field: number): Array<[string, string]> {
  const pairs: Array<[string, string]> = []
  for (const [number, wire, value] of iterFields(data)) {
    if (number === field && wire === 2 && value instanceof Uint8Array) {
      pairs.push([fieldText(value, 1), fieldText(value, 2)])
    }
  }
  return pairs
}

export function utf8Strings(data: Uint8Array): string[] {
  const found: string[] = []
  let fields: Field[]
  try {
    fields = iterFields(data)
  } catch {
    return found
  }
  for (const [, wire, value] of fields) {
    if (wire !== 2 || !(value instanceof Uint8Array)) {
      continue
    }
    try {
      const text = new TextDecoder("utf-8", { fatal: true }).decode(value)
      if (text) {
        found.push(text)
      }
    } catch {
      found.push(...utf8Strings(value))
      continue
    }
    found.push(...utf8Strings(value))
  }
  return found
}

function asLength(value: bigint): number {
  if (value < 0n || value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("length-delimited 越界")
  }
  return Number(value)
}

export function toBase64(data: Uint8Array): string {
  let binary = ""
  for (const piece of data) {
    binary += String.fromCharCode(piece)
  }
  return btoa(binary)
}

export function fromBase64(value: string): Uint8Array {
  const binary = atob(value)
  const out = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    out[index] = binary.charCodeAt(index)
  }
  return out
}
