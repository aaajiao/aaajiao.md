export interface Work {
  url: string
  title: string
  title_cn: string
  year: string
  type: string
  materials: string
  size: string
  duration: string
  credits: string
  description_en: string
  description_cn: string
  images: string[]
  high_res_images: string[]
  source: string
  video_link: string
}

export function jsonToMarkdown(works: Work[]): string {
  const lines: string[] = [
    '# aaajiao 作品集（完整元数据）',
    '',
    '---',
    '',
  ]

  for (const work of works) {
    // Title
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
    if (work.video_link) lines.push(`**Video**: ${work.video_link}`, '')
    if (work.url) lines.push(`**URL**: ${work.url}`, '')

    if (work.description_cn) {
      lines.push(`**中文描述**: ${work.description_cn}`, '')
    }
    if (work.description_en) {
      lines.push(`**Description**: ${work.description_en}`, '')
    }

    if (work.images.length > 0) {
      lines.push('### 图片', '')
      for (const img of work.images) {
        lines.push(
          `<a href="${img}" target="_blank"><img src="${img}" width="400"></a>`,
          ''
        )
      }
    }

    lines.push('---', '')
  }

  return lines.join('\n')
}
