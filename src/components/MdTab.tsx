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
          className="font-display text-[0.75rem] tracking-[0.04em] px-[0.9rem] py-[0.4rem] border border-border rounded-sm bg-transparent text-muted cursor-pointer transition-colors duration-200 hover:text-foreground hover:border-foreground"
          onClick={onDownload}
        >
          下载 MD
        </button>
      </div>
      <Portfolio works={works} showJson={showJson} />
    </div>
  )
}
