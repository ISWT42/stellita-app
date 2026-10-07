import { useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { MobileSidebarDrawer } from './MobileSidebarDrawer'
import { Logo, Wordmark } from '../marketing/shared'
import { useAuth } from '../auth/store'
import { useIsMobile } from '../hooks/useIsMobile'
import { useFreighterBridge } from '../wallet/freighterBridge'

/** Authed app layout: collapsible sidebar + routed body (no top header). */
export function AppShell() {
  const { user, loading } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const isMobile = useIsMobile()
  // Answer Freighter requests forwarded from the preview iframe (top-level only).
  useFreighterBridge()

  if (loading) return null

  // Not authenticated → back to the marketing landing.
  if (!user) return <Navigate to="/" replace />

  // Mobile: the sidebar becomes a drawer behind a hamburger; the body stacks
  // below a slim top bar. Desktop layout below is left untouched.
  if (isMobile) {
    return (
      <div className="flex h-full flex-col bg-[var(--bg)] text-[var(--ink)]">
        <header className="flex h-12 shrink-0 items-center gap-2.5 border-b-2 border-[var(--ink)] bg-[var(--surface)] px-3">
          <button
            onClick={() => setNavOpen(true)}
            title="Menu"
            aria-label="Open menu"
            className="-ml-1 rounded-md p-1.5 text-[var(--ink)] transition-colors hover:bg-[var(--gold-soft)]"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Logo size={18} />
          <Wordmark size={14} />
        </header>
        <div className="flex min-h-0 flex-1 flex-col">
          <Outlet />
        </div>
        <MobileSidebarDrawer open={navOpen} onOpenChange={setNavOpen} />
      </div>
    )
  }

  return (
    <div className="flex h-full select-none bg-[var(--bg)] text-[var(--ink)]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Outlet />
      </div>
    </div>
  )
}
