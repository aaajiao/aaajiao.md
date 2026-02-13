import type { Work } from './types.js'

export type { Work }

export function headerMarkdown(): string {
  return ['# aaajiao 作品集（完整元数据）', '', '---', ''].join('\n')
}

export function workToMarkdown(work: Work): string {
  const lines: string[] = []

  const title = work.title_cn
    ? `## ${work.title} / ${work.title_cn}`
    : `## ${work.title}`
  lines.push(title, '')

  if (work.year) lines.push(`**Year**: ${work.year}`, '')
  if (work.type) lines.push(`**Type**: ${work.type}`, '')
  if (work.materials) lines.push(`**Materials**: ${work.materials}`, '')
  if (work.size) lines.push(`**Size**: ${work.size}`, '')
  if (work.duration) lines.push(`**Duration**: ${work.duration}`, '')
  if (work.credits) lines.push(`**Credits**: ${work.credits}`, '')
  if (work.video_link) lines.push(`**Video**: [${work.video_link}](${work.video_link})`, '')
  if (work.url) lines.push(`**URL**: [${work.url}](${work.url})`, '')

  if (work.description_cn) {
    lines.push(`**中文描述**: ${work.description_cn}`, '')
  }
  if (work.description_en) {
    lines.push(`**Description**: ${work.description_en}`, '')
  }

  if (work.images.length > 0) {
    lines.push('### 图片', '')
    for (const img of work.images) {
      lines.push(`[![](${img})](${img})`, '')
    }
  }

  lines.push('---', '')

  return lines.join('\n')
}

export function worksChunkToMarkdown(works: Work[]): string {
  return works.map(workToMarkdown).join('\n')
}

export function jsonToMarkdown(works: Work[]): string {
  return headerMarkdown() + worksChunkToMarkdown(works)
}

export function buildFrontMatter(worksCount: number): string {
  return [
    '---',
    'title: aaajiao portfolio',
    'source: https://github.com/aaajiao/aaajiao_scraper',
    `works_count: ${worksCount}`,
    `generated: ${new Date().toISOString()}`,
    '---',
    '',
  ].join('\n')
}

export function workToMarkdownWithFrontMatter(work: Work): string {
  const fields = [
    `title: "${work.title.replace(/"/g, '\\"')}"`,
    work.title_cn ? `title_cn: "${work.title_cn.replace(/"/g, '\\"')}"` : null,
    `year: "${work.year}"`,
    `type: "${work.type}"`,
    work.url ? `url: "${work.url}"` : null,
  ].filter(Boolean)

  const fm = ['---', ...fields, '---', ''].join('\n')

  return fm + '\n' + workToMarkdown(work)
}
