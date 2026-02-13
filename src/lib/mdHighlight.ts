/**
 * Lightweight Markdown syntax highlighter for the curl tab.
 * Returns an HTML string with <span> wrappers — same pattern as jsonHighlight.
 */

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function highlightMarkdown(text: string): string {
  const lines = text.split('\n')
  let inFrontMatter = false
  let fmCount = 0

  return lines.map((raw) => {
    const line = escapeHtml(raw)

    // YAML front-matter fences
    if (line === '---') {
      fmCount++
      inFrontMatter = fmCount === 1
      return `<span class="md-hr">${line}</span>`
    }

    // YAML front-matter key: value
    if (inFrontMatter) {
      return line.replace(
        /^([^:]+)(:)\s*(.*)$/,
        '<span class="md-meta-key">$1</span><span class="md-hr">$2</span> <span class="md-meta-val">$3</span>'
      )
    }

    // Headings
    if (/^#{1,3}\s/.test(line)) {
      return `<span class="md-heading">${line}</span>`
    }

    // Comment lines (our // ... markers)
    if (/^\/\//.test(line)) {
      return `<span class="md-comment">${line}</span>`
    }

    // Inline: bold, links, images
    let out = line
    // **bold**
    out = out.replace(/\*\*([^*]+)\*\*/g, '<span class="md-bold">**$1**</span>')
    // [text](url)
    out = out.replace(
      /\[([^\]]*)\]\(([^)]+)\)/g,
      '<span class="md-link-bracket">[</span><span class="md-link-text">$1</span><span class="md-link-bracket">](</span><span class="md-link-url">$2</span><span class="md-link-bracket">)</span>'
    )

    return out
  }).join('\n')
}
