import { useState, useCallback } from 'react'
import { highlightSkill } from '../lib/skillHighlight'

interface SkillSection {
  label: string
  description: string
  command: string
  content: string
}

export function SkillTab() {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  const repoUrl = 'https://github.com/aaajiao/aaajiao.md'
  const rawUrl = 'https://raw.githubusercontent.com/aaajiao/aaajiao.md/main/skills/aaajiao/SKILL.md'

  const sections: SkillSection[] = [
    {
      label: 'Install',
      description: '安装 / One command for all agents',
      command: 'npx skills add aaajiao/aaajiao.md --all',
      content: `// Installs to Claude Code, Codex, OpenClaw, Cursor, Gemini CLI, etc.
// Or pick one agent:
//   npx skills add aaajiao/aaajiao.md -a claude-code
//   npx skills add aaajiao/aaajiao.md -a codex
//
// Install globally (-g) for all projects:
//   npx skills add aaajiao/aaajiao.md --all -g`,
    },
    {
      label: 'Quick Start',
      description: '快速开始 / Tell your agent directly',
      command: `Read ${rawUrl}`,
      content: `// Paste this into any agent conversation.
// The skill tells the agent who aaajiao is,
// how he thinks, and where to find more.
//
// No install needed — the agent reads it,
// then fetches reference docs from GitHub
// as needed.`,
    },
    {
      label: 'What It Contains',
      description: '内容 / Distillation + knowledge base',
      command: `curl -s ${rawUrl} | head -20`,
      content: `// SKILL.md — the distillation (~2100 words)
//   Identity, double helix framework,
//   concept-as-filter methodology,
//   core stances, voice rules, 18 key works,
//   critical lens checklist
//
// docs/ — the knowledge base (112 files)
//   interviews/    4 transcripts (podcast + Ocula)
//   letter/        personal writing
//   opencall/      exhibition applications
//   project/       Symbiosis + Matsutake framework
//   media/         58 articles (MD) + 40 PDFs
//
// aaajiao_works.json — 163 artworks with metadata`,
    },
    {
      label: 'Update',
      description: '更新 / Pull latest version',
      command: 'npx skills update',
      content: `// The skill evolves as new works and
// interviews are added to the repository.
//
// docs/ is fetched fresh from GitHub at
// runtime — always up to date.`,
    },
  ]

  const copy = useCallback((idx: number, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx)
      setTimeout(() => setCopiedIdx(null), 2000)
    })
  }, [])

  return (
    <div className="flex flex-col gap-8 mt-4">
      <div className="font-display text-[0.78rem] text-muted leading-[1.7]">
        <p>
          An <a href="https://agentskills.io" className="text-foreground underline decoration-border hover:decoration-foreground transition-colors duration-200" target="_blank" rel="noopener noreferrer">Agent Skill</a> that
          distills aaajiao's conceptual framework into a format AI agents can load and use.
          Not just data about the artist — a way of seeing the world.
        </p>
        <p className="mt-2 text-subtle">
          .md → human reads text / curl → machine reads structure / bin → machine reads bytes / <span className="text-foreground">skill → agent reads cognition</span>
        </p>
      </div>

      <div className="flex items-center gap-3 font-display text-[0.72rem] text-subtle">
        <a href={repoUrl} className="text-foreground underline decoration-border hover:decoration-foreground transition-colors duration-200" target="_blank" rel="noopener noreferrer">GitHub Repository</a>
        <span>·</span>
        <a href={`${repoUrl}/tree/main/skills/aaajiao`} className="text-foreground underline decoration-border hover:decoration-foreground transition-colors duration-200" target="_blank" rel="noopener noreferrer">SKILL.md</a>
        <span>·</span>
        <a href={`${repoUrl}/tree/main/docs`} className="text-foreground underline decoration-border hover:decoration-foreground transition-colors duration-200" target="_blank" rel="noopener noreferrer">Knowledge Base</a>
      </div>

      {sections.map((section, idx) => (
        <div key={idx} className="border border-border rounded-sm overflow-hidden">
          <div className="flex items-baseline gap-3 px-[0.9rem] py-[0.6rem] border-b border-border bg-code">
            <span className="font-display text-[0.8rem] font-medium text-foreground">{section.label}</span>
            <span className="font-display text-[0.7rem] text-subtle">{section.description}</span>
          </div>
          <div className="flex items-center justify-between px-[0.9rem] py-2 border-b border-border bg-surface-elevated">
            <code className="font-display text-[0.78rem] text-foreground overflow-x-auto whitespace-nowrap">
              {section.command}
            </code>
            <button
              className="font-display text-[0.68rem] tracking-[0.04em] px-2 py-[0.2rem] border border-border rounded-sm bg-transparent text-muted cursor-pointer transition-colors duration-200 hover:text-foreground hover:border-foreground shrink-0 ml-3"
              onClick={() => copy(idx, section.command)}
            >
              {copiedIdx === idx ? 'copied' : 'copy'}
            </button>
          </div>
          <pre
            className="font-display text-[0.72rem] leading-[1.5] text-muted px-[0.9rem] py-[0.8rem] m-0 max-h-80 overflow-y-auto whitespace-pre-wrap break-all"
            dangerouslySetInnerHTML={{ __html: highlightSkill(section.content) }}
          />
        </div>
      ))}
    </div>
  )
}
