import { ThemeToggle } from './ThemeToggle'

type TabId = '.md' | 'curl' | 'bin'

interface SiteHeaderProps {
  theme: string
  onToggleTheme: () => void
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

export function SiteHeader({ theme, onToggleTheme, activeTab, onTabChange }: SiteHeaderProps) {
  return (
    <header className="flex items-end justify-between pb-8 mb-8 border-b border-border">
      <div>
        <div className="flex items-baseline gap-[1.2rem]">
          <h1 className="font-display text-[2.5rem] font-medium tracking-[-0.02em] leading-none text-foreground">aaajiao</h1>
          <nav className="flex gap-[0.15rem]">
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
          </nav>
        </div>
        <p className="font-display text-[0.8rem] text-subtle mt-[0.4rem] tracking-[0.04em]">作品档案 / Works Archive</p>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
    </header>
  )
}
