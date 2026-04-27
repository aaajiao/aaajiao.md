import { ThemeToggle } from './ThemeToggle'

type TabId = '.md' | 'curl' | 'bin' | 'skill'

interface SiteHeaderProps {
  theme: string
  onToggleTheme: () => void
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

export function SiteHeader({ theme, onToggleTheme, activeTab, onTabChange }: SiteHeaderProps) {
  return (
    <header className="flex items-end justify-between gap-3 pb-8 mb-8 border-b border-border">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-[1.2rem] gap-y-2">
          <h1 className="font-display text-[2rem] sm:text-[2.5rem] font-medium tracking-[-0.02em] leading-none text-foreground">aaajiao</h1>
          <nav className="flex flex-wrap gap-[0.15rem]">
            <button
              className={`font-display text-[0.8rem] tracking-[0.02em] px-[0.65rem] py-1 border rounded-sm cursor-pointer transition-colors duration-200 ${
                activeTab === '.md'
                  ? 'text-foreground bg-code border-border'
                  : 'text-subtle bg-transparent border-transparent hover:text-muted'
              }`}
              onClick={() => onTabChange('.md')}
            >
              .md
            </button>
            <button
              className={`font-display text-[0.8rem] tracking-[0.02em] px-[0.65rem] py-1 border rounded-sm cursor-pointer transition-colors duration-200 ${
                activeTab === 'curl'
                  ? 'text-foreground bg-code border-border'
                  : 'text-subtle bg-transparent border-transparent hover:text-muted'
              }`}
              onClick={() => onTabChange('curl')}
            >
              curl
            </button>
            <button
              className={`font-display text-[0.8rem] tracking-[0.02em] px-[0.65rem] py-1 border rounded-sm cursor-pointer transition-colors duration-200 ${
                activeTab === 'bin'
                  ? 'text-foreground bg-code border-border'
                  : 'text-subtle bg-transparent border-transparent hover:text-muted'
              }`}
              onClick={() => onTabChange('bin')}
            >
              bin
            </button>
            <button
              className={`font-display text-[0.8rem] tracking-[0.02em] px-[0.65rem] py-1 border rounded-sm cursor-pointer transition-colors duration-200 ${
                activeTab === 'skill'
                  ? 'text-foreground bg-code border-border'
                  : 'text-subtle bg-transparent border-transparent hover:text-muted'
              }`}
              onClick={() => onTabChange('skill')}
            >
              skill
            </button>
          </nav>
        </div>
        <p className="font-display text-[0.8rem] text-subtle mt-[0.4rem] tracking-[0.04em]">作品档案 / Works Archive</p>
      </div>
      <div className="flex items-center shrink-0">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
    </header>
  )
}
