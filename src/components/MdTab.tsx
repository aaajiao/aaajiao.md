import { useState } from 'react'
import { Portfolio } from './Portfolio'
import type { Work } from '../../shared/types'

interface MdTabProps {
  works: Work[]
  onDownload: () => void
}

export function MdTab({ works, onDownload }: MdTabProps) {
  const [showJson, setShowJson] = useState(false)

  return (
    <div>
      <div className="md-tab-toolbar">
        <button
          className={`toolbar-btn${showJson ? ' toolbar-btn-active' : ''}`}
          onClick={() => setShowJson(!showJson)}
          aria-label={showJson ? 'Hide JSON background' : 'Show JSON background'}
          title={showJson ? 'Hide JSON background' : 'Show JSON background'}
        >
          {'{ }'}
        </button>
        <button className="download-btn" onClick={onDownload}>
          下载 MD
        </button>
      </div>
      <Portfolio works={works} showJson={showJson} />
    </div>
  )
}
