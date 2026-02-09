import { ThemeToggle } from './ThemeToggle'

interface SiteHeaderProps {
  theme: string
  onToggleTheme: () => void
  onDownload: () => void
}

export function SiteHeader({ theme, onToggleTheme, onDownload }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <div className="site-header-identity">
        <h1 className="site-title">aaajiao</h1>
        <p className="site-subtitle">作品档案 / Works Archive</p>
      </div>
      <div className="site-header-actions">
        <button onClick={onDownload} className="download-btn">
          下载 MD
        </button>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
    </header>
  )
}
