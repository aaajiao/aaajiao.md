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
    <div className="work-layered">
      {showJson && (
        <div className="work-json-bg" aria-hidden="true">
          <pre dangerouslySetInnerHTML={{ __html: jsonHtml }} />
        </div>
      )}
      <div className="work-rendered-fg">
        <Streamdown mode="static" linkSafety={{ enabled: false }}>
          {workToMarkdown(work)}
        </Streamdown>
      </div>
    </div>
  )
}
