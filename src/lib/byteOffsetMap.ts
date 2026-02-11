export interface FieldRegion {
  start: number
  end: number
  path: string
  key: string
  value: string
  workIndex: number
}

function buildCharToByteMap(str: string): number[] {
  const map: number[] = new Array(str.length + 1)
  let bytePos = 0
  for (let i = 0; i < str.length; i++) {
    map[i] = bytePos
    const c = str.charCodeAt(i)
    if (c < 0x80) bytePos += 1
    else if (c < 0x800) bytePos += 2
    else if (c >= 0xd800 && c <= 0xdbff) {
      i++
      if (i < str.length) map[i] = bytePos
      bytePos += 4
    } else bytePos += 3
  }
  map[str.length] = bytePos
  return map
}

export function buildByteOffsetMap(jsonString: string): FieldRegion[] {
  const regions: FieldRegion[] = []
  const c2b = buildCharToByteMap(jsonString)
  let i = 0
  let workIndex = -1
  let depth = 0

  while (i < jsonString.length) {
    const ch = jsonString[i]

    if (ch === '{') {
      if (depth === 1) workIndex++
      depth++
      i++
    } else if (ch === '}') {
      depth--
      i++
    } else if (ch === '[' && depth < 2) {
      depth++
      i++
    } else if (ch === ']' && depth <= 1) {
      depth--
      i++
    } else if (ch === '"' && depth === 2) {
      const regionStart = i
      i++
      let key = ''
      while (i < jsonString.length && jsonString[i] !== '"') {
        if (jsonString[i] === '\\') {
          key += jsonString[i + 1]
          i += 2
        } else {
          key += jsonString[i]
          i++
        }
      }
      i++ // closing "

      while (i < jsonString.length && (jsonString[i] === ':' || jsonString[i] === ' ')) i++

      const valueStart = i

      if (i < jsonString.length && jsonString[i] === '"') {
        i++
        while (i < jsonString.length && jsonString[i] !== '"') {
          if (jsonString[i] === '\\') i += 2
          else i++
        }
        i++
      } else if (i < jsonString.length && jsonString[i] === '[') {
        let d = 1
        i++
        while (i < jsonString.length && d > 0) {
          if (jsonString[i] === '[') d++
          else if (jsonString[i] === ']') d--
          else if (jsonString[i] === '"') {
            i++
            while (i < jsonString.length && jsonString[i] !== '"') {
              if (jsonString[i] === '\\') i++
              i++
            }
          }
          i++
        }
      } else if (i < jsonString.length && jsonString[i] === '{') {
        let d = 1
        i++
        while (i < jsonString.length && d > 0) {
          if (jsonString[i] === '{') d++
          else if (jsonString[i] === '}') d--
          else if (jsonString[i] === '"') {
            i++
            while (i < jsonString.length && jsonString[i] !== '"') {
              if (jsonString[i] === '\\') i++
              i++
            }
          }
          i++
        }
      } else {
        while (
          i < jsonString.length &&
          jsonString[i] !== ',' &&
          jsonString[i] !== '\n' &&
          jsonString[i] !== '\r' &&
          jsonString[i] !== '}'
        )
          i++
      }

      regions.push({
        start: c2b[regionStart],
        end: c2b[i],
        path: `[${workIndex}].${key}`,
        key,
        value: jsonString.slice(valueStart, i),
        workIndex,
      })
    } else {
      i++
    }
  }

  return regions
}

export function findRegion(regions: FieldRegion[], byteOffset: number): FieldRegion | null {
  let lo = 0
  let hi = regions.length - 1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (regions[mid].end <= byteOffset) lo = mid + 1
    else if (regions[mid].start > byteOffset) hi = mid - 1
    else return regions[mid]
  }
  return null
}
