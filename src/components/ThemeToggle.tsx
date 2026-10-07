import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../lib/theme'

/** Neobrutalist icon button that flips light↔dark. Used in the marketing navs
 *  (landing + sub-pages), to the left of Sign In. Styled with theme vars so it
 *  looks right in both themes. */
export function ThemeToggle({ size = 42 }: { size?: number }) {
  const { theme, toggle } = useTheme()
  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
  return (
    <button
      onClick={toggle}
      title={label}
      aria-label={label}
      className="st-lift st-lift-dark"
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        border: '2px solid var(--ink)',
        background: 'var(--surface)',
        color: 'var(--ink)',
        cursor: 'pointer',
        boxShadow: '3px 3px 0 var(--shadow)',
      }}
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
