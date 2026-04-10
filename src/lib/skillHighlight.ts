/**
 * Lightweight syntax highlighter for skill tab content.
 * Reuses json-* CSS classes from index.css.
 */
export function highlightSkill(text: string): string {
  return text
    // Comments: // ...
    .replace(
      /^(\/\/.*)$/gm,
      (line) => {
        let highlighted = line
        // Numbers inside comments
        highlighted = highlighted.replace(
          /\b(\d[\d,]*(?:\.\d+)?)\s*(words|files|transcripts|articles|PDFs|artworks|works)\b/g,
          '<span class="json-num">$1</span> <span class="json-null">$2</span>'
        )
        // File paths and extensions
        highlighted = highlighted.replace(
          /\b(SKILL\.md|docs\/|aaajiao_works\.json|interviews\/|letter\/|opencall\/|project\/|media\/)\b/g,
          '<span class="json-str">$1</span>'
        )
        // Tool names
        highlighted = highlighted.replace(
          /\b(Claude Code|Codex|OpenClaw|Cursor|Gemini CLI)\b/g,
          '<span class="json-key">$1</span>'
        )
        // Flags
        highlighted = highlighted.replace(
          /(\s)(--?\w[\w-]*)/g,
          '$1<span class="json-bool">$2</span>'
        )
        return `<span class="text-muted">${highlighted}</span>`
      }
    )
}
