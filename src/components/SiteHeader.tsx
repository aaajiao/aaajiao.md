import { ThemeToggle } from './ThemeToggle'

type TabId = '.md' | 'curl'

interface SiteHeaderProps {
  theme: string
  onToggleTheme: () => void
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

export function SiteHeader({ theme, onToggleTheme, activeTab, onTabChange }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <div className="site-header-identity">
        <div className="site-title-row">
          <h1 className="site-title">aaajiao</h1>
          <nav className="tab-nav">
            <button
              className={`tab-btn${activeTab === '.md' ? ' tab-active' : ''}`}
              onClick={() => onTabChange('.md')}
            >
              .md
            </button>
            <button
              className={`tab-btn${activeTab === 'curl' ? ' tab-active' : ''}`}
              onClick={() => onTabChange('curl')}
            >
              curl
            </button>
          </nav>
        </div>
        <p className="site-subtitle">作品档案 / Works Archive</p>
      </div>
      <div className="site-header-actions">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
    </header>
  )
}
