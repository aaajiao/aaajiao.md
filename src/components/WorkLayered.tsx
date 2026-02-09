import { Streamdown } from 'streamdown'
import { workToMarkdown } from '../lib/jsonToMarkdown'
import type { Work } from '../../shared/types'

interface WorkLayeredProps {
  work: Work
  showJson: boolean
}

export function WorkLayered({ work, showJson }: WorkLayeredProps) {
  return (
    <div className="work-layered">
      {showJson && (
        <div className="work-json-bg" aria-hidden="true">
          <pre>{JSON.stringify(work, null, 2)}</pre>
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
