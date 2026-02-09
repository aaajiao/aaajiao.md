import { useMemo } from 'react'
import { Streamdown } from 'streamdown'
import { workToMarkdown } from '../lib/jsonToMarkdown'
import { highlightJson } from '../lib/jsonHighlight'
import type { Work } from '../../shared/types'

interface WorkLayeredProps {
  work: Work
  showJson: boolean
}

export function WorkLayered({ work, showJson }: WorkLayeredProps) {
  const jsonHtml = useMemo(() => showJson ? highlightJson(work) : '', [work, showJson])

  return (
    <div className="relative">
      {showJson && (
        <div className="absolute inset-0 overflow-hidden z-0 opacity-[0.22] pointer-events-none" aria-hidden="true">
          <pre
            className="font-display text-[0.7rem] leading-[1.4] whitespace-pre-wrap break-all text-foreground m-0 p-0"
            dangerouslySetInnerHTML={{ __html: jsonHtml }}
          />
        </div>
      )}
      <div className="relative z-[1] mix-blend-multiply dark:mix-blend-screen">
        <Streamdown mode="static" linkSafety={{ enabled: false }}>
          {workToMarkdown(work)}
        </Streamdown>
      </div>
    </div>
  )
}
