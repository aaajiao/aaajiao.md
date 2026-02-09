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
      <div className="flex justify-end items-center gap-2 mb-4">
        <button
          className={`font-display text-[0.75rem] tracking-[0.04em] px-[0.7rem] py-[0.4rem] border rounded-sm bg-transparent cursor-pointer transition-colors duration-200 ${
            showJson
              ? 'text-foreground bg-code border-border dark:text-[#F0EDE8] dark:bg-[#1E1E1E] dark:border-[#4A4A4A]'
              : 'text-subtle border-border hover:text-muted hover:border-muted dark:text-muted dark:border-[#3A3A3A]'
          }`}
          onClick={() => setShowJson(!showJson)}
          aria-label={showJson ? 'Hide JSON background' : 'Show JSON background'}
          title={showJson ? 'Hide JSON background' : 'Show JSON background'}
        >
          {'{ }'}
        </button>
        <button
          className="p-[0.4rem] border border-border rounded-sm bg-transparent text-muted cursor-pointer transition-colors duration-200 hover:text-foreground hover:border-foreground"
          onClick={onDownload}
          aria-label="Download Markdown"
          title="Download Markdown"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
      </div>
      <Portfolio works={works} showJson={showJson} />
    </div>
  )
}
