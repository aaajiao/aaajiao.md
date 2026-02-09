/**
 * Lightweight JSON syntax highlighter.
 * Returns an HTML string with <span> wrappers for keys, strings, numbers, booleans, and null.
 */
export function highlightJson(obj: unknown): string {
  const raw = JSON.stringify(obj, null, 2)
  return raw.replace(
    /("(?:\\.|[^"\\])*")\s*(:)|("(?:\\.|[^"\\])*")|([-+]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|(\btrue\b|\bfalse\b)|(\bnull\b)/g,
    (match, key, colon, str, num, bool, nil) => {
      if (key) return `<span class="json-key">${key}</span>${colon}`
      if (str) return `<span class="json-str">${str}</span>`
      if (num) return `<span class="json-num">${num}</span>`
      if (bool) return `<span class="json-bool">${bool}</span>`
      if (nil) return `<span class="json-null">${nil}</span>`
      return match
    }
  )
}
