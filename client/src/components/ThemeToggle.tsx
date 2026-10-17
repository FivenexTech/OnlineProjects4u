import { Moon, Sun } from 'lucide-react'

export function ThemeToggle({ theme, onToggle }: { theme: 'dark' | 'light'; onToggle: () => void }) {
  const nextTheme = theme === 'dark' ? 'light' : 'dark'
  return <button className="icon-button theme-toggle" onClick={onToggle} aria-label={`Switch to ${nextTheme} theme`} title={`Switch to ${nextTheme} theme`}>
    {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
  </button>
}