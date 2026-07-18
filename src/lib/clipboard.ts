// navigator.clipboard can reject or be unavailable (e.g. iframes, denied
// permission); fall back to the classic textarea + execCommand trick.
// execCommand is deprecated but deliberately kept: it is the only path that
// still works where the async Clipboard API is blocked, and browsers continue
// to support it. The local type below keeps the call off the deprecated
// lib.dom signature so editors don't flag intentional usage.
type LegacyExecCommand = { execCommand?: (commandId: string) => boolean }

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      const ok = (document as unknown as LegacyExecCommand).execCommand?.('copy') ?? false
      document.body.removeChild(textarea)
      return ok
    } catch {
      return false
    }
  }
}
