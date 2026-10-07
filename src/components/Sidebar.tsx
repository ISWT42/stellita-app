import { useState } from 'react'
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom'
import {
  Plus,
  MessageSquare,
  LayoutGrid,
  User,
  LogOut,
  PanelLeft,
  Trash2,
  Search,
  Moon,
  Sun,
} from 'lucide-react'
import { useProjects } from '../projects/store'
import { useAuth } from '../auth/store'
import { useTheme } from '../lib/theme'
import { DeleteProjectModal } from './DeleteProjectModal'
import { PlanBadge } from './PlanBadge'
import { Logo, Wordmark } from '../marketing/shared'

function initials(name: string): string {
  return (name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

/**
 * v0-style collapsible sidebar: brand → home, new project, project history, and
 * the user profile pinned bottom-left. Collapses to an icon rail on desktop.
 *
 * The desktop chrome (the fixed-width `<aside>`) lives here; the actual content
 * lives in `SidebarInner` so the mobile Drawer can reuse it verbatim.
 */
export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  return (
    <aside
      className={`flex shrink-0 flex-col border-r-2 border-[var(--ink)] bg-[var(--bg2)] transition-[width] duration-200 ${
        collapsed ? 'w-14' : 'w-64'
      }`}
    >
      <SidebarInner collapsed={collapsed} onToggle={onToggle} />
    </aside>
  )
}

/**
 * The sidebar's contents, with no outer container. Rendered inside the desktop
 * `<aside>` and inside the mobile Drawer. On mobile it's always expanded
 * (`collapsed={false}`) and `onToggle` closes the drawer.
 */
export function SidebarInner({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  const { projects, deleteProject } = useProjects()
  const { user, logout, credits } = useAuth()
  const { theme, toggle: toggleTheme } = useTheme()
  const navigate = useNavigate()
  const { slug: activeSlug } = useParams<{ slug: string }>()
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  // How many projects to render before "See more". Projects arrive newest-first
  // (by last activity); we page through them 20 at a time. A search shows all
  // matches (searching should never be gated behind pagination).
  const [visible, setVisible] = useState(20)
  const [deleting, setDeleting] = useState<{ slug: string; name: string } | null>(
    null,
  )

  const q = query.trim().toLowerCase()
  const filtered = q
    ? projects.filter((p) => p.name.toLowerCase().includes(q))
    : projects
  const shown = q ? filtered : filtered.slice(0, visible)
  const hasMore = !q && filtered.length > shown.length

  const handleDelete = async () => {
    if (!deleting) return
    const { slug } = deleting
    await deleteProject(slug)
    setDeleting(null)
    if (activeSlug === slug) navigate('/app')
  }

  return (
    <>
      {/* Brand → home, with the collapse toggle to its right */}
      <div className="flex h-14 items-center justify-between px-3">
        {!collapsed && (
          <Link
            to="/app"
            className="flex items-center gap-2 rounded-md px-1 py-1"
            title="Stellita — home"
          >
            <Logo size={20} />
            <Wordmark size={15} />
          </Link>
        )}
        <button
          onClick={onToggle}
          title="Toggle sidebar"
          aria-label="Toggle sidebar"
          className={`rounded-md p-1.5 text-[var(--muted2)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--ink)] ${
            collapsed ? 'mx-auto' : ''
          }`}
        >
          <PanelLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Search conversations */}
      {!collapsed && (
        <div className="px-2 pt-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted2)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="search"
              placeholder="Search chats…"
              aria-label="Search conversations"
              className="w-full rounded-[10px] border-2 border-[var(--ink)] bg-[var(--surface)] py-1.5 pl-8 pr-2.5 text-[13px] text-[var(--ink)] outline-none placeholder:text-[var(--muted3)] focus:border-[var(--ink)]"
            />
          </div>
        </div>
      )}

      {/* New project */}
      <div className="px-2 py-2">
        <Link
          to="/app"
          className={`flex items-center gap-2 rounded-[10px] border-2 border-[var(--ink)] bg-[var(--gold)] px-2.5 py-2 text-[13px] font-semibold text-[var(--gink)] shadow-[3px_3px_0_var(--shadow)] transition-all hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0_var(--shadow)] ${
            collapsed ? 'justify-center' : ''
          }`}
          title="New project"
        >
          <Plus className="h-4 w-4 shrink-0" />
          {!collapsed && <span>New project</span>}
        </Link>
      </div>

      {/* Templates */}
      <div className="px-2 pb-1">
        <NavLink
          to="/app/templates"
          className={({ isActive }) =>
            `flex items-center gap-2 rounded-[10px] px-2.5 py-2 text-[13px] transition-colors ${
              isActive
                ? 'border-2 border-[var(--ink)] bg-[var(--gold)] text-[var(--gink)]'
                : 'border-2 border-transparent text-[var(--muted)] hover:bg-[var(--surface)]/70 hover:text-[var(--ink)]'
            } ${collapsed ? 'justify-center' : ''}`
          }
          title="Templates"
        >
          <LayoutGrid className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Templates</span>}
        </NavLink>
      </div>

      {/* History */}
      <div className="min-h-0 flex-1 overflow-y-auto px-2">
        {!collapsed && (
          <p className="px-2.5 py-2 text-[11px] font-medium uppercase tracking-wide text-[var(--muted3)]">
            Projects
          </p>
        )}
        <nav className="flex flex-col gap-0.5">
          {shown.map((p) => (
            <div key={p.slug} className="group relative">
              <NavLink
                to={`/projects/${p.slug}`}
                className={({ isActive }) =>
                  `relative flex items-center gap-2 rounded-[10px] px-2.5 py-2 text-[13px] transition-colors ${
                    isActive
                      ? 'border-2 border-[var(--ink)] bg-[var(--gold)] text-[var(--gink)]'
                      : 'border-2 border-transparent text-[var(--muted)] hover:bg-[var(--surface)]/70 hover:text-[var(--ink)]'
                  } ${collapsed ? 'justify-center' : 'pr-8'}`
                }
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{p.name}</span>}
                {collapsed && (
                  <span className="pointer-events-none absolute left-full z-50 ml-2 hidden max-w-[220px] truncate whitespace-nowrap rounded-[10px] border-2 border-[var(--ink)] bg-[var(--surface)] px-2.5 py-1.5 text-[12.5px] text-[var(--ink)] shadow-[3px_3px_0_var(--shadow)] group-hover:block">
                    {p.name}
                  </span>
                )}
              </NavLink>
              {!collapsed && (
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setDeleting({ slug: p.slug, name: p.name })
                  }}
                  title="Delete project"
                  aria-label={`Delete ${p.name}`}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--muted2)] opacity-0 transition-opacity hover:bg-[var(--surface)] hover:text-red-600 focus:opacity-100 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
          {!collapsed && filtered.length === 0 && (
            <p className="px-2.5 py-2 text-[12.5px] text-[var(--muted3)]">
              {q ? 'No chats match your search.' : 'No projects yet.'}
            </p>
          )}
          {!collapsed && hasMore && (
            <button
              onClick={() => setVisible((v) => v + 20)}
              className="mt-1 rounded-[10px] px-2.5 py-2 text-left text-[12.5px] font-medium text-[var(--muted2)] transition-colors hover:bg-[var(--surface)]/70 hover:text-[var(--ink)]"
            >
              See more ({filtered.length - shown.length})
            </button>
          )}
        </nav>
      </div>

      {/* Credits (bottom): plan badge + a bar that drops as prompts are used. */}
      {!collapsed && credits && (
        <div className="border-t-2 border-[var(--ink)] px-3 py-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--muted2)]">
              Credits
            </span>
            <PlanBadge plan={credits.plan} />
          </div>
          {credits.unlimited ? (
            <p className="text-[13px] font-medium text-[var(--ink)]">∞ Unlimited</p>
          ) : (
            <>
              <div className="h-1.5 w-full overflow-hidden rounded-full border-2 border-[var(--ink)] bg-[var(--surface)]">
                <div
                  className="h-full rounded-full bg-[var(--gold)] transition-[width] duration-300"
                  style={{
                    width: `${credits.limit > 0 ? Math.max((credits.remaining / credits.limit) * 100, 0) : 0}%`,
                  }}
                />
              </div>
              <p className="mt-1.5 text-[12px] text-[var(--muted)]">
                <span className="font-semibold text-[var(--ink)]">{credits.remaining}</span>
                {' / '}
                {credits.limit} credits left today
              </p>
            </>
          )}
        </div>
      )}

      {/* User profile (bottom-left) — opens a popover menu */}
      {user && (
        <div className="relative border-t-2 border-[var(--ink)] p-2">
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute bottom-full left-2 z-20 mb-1 w-56 overflow-hidden rounded-[10px] border-2 border-[var(--ink)] bg-[var(--surface)] p-1 shadow-[4px_4px_0_var(--shadow)]">
                <div className="border-b-2 border-[var(--ink)] px-2.5 py-2">
                  <p className="truncate text-[13px] text-[var(--ink)]">
                    {user.name}
                  </p>
                  <p className="truncate text-[11.5px] text-[var(--muted2)]">
                    {user.email}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    navigate('/profile')
                  }}
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-[var(--muted)] transition-colors hover:bg-[var(--gold-soft)] hover:text-[var(--ink)]"
                >
                  <User className="h-4 w-4" />
                  Profile
                </button>
                <button
                  onClick={toggleTheme}
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-[var(--muted)] transition-colors hover:bg-[var(--gold-soft)] hover:text-[var(--ink)]"
                >
                  {theme === 'dark' ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                  {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    logout()
                    navigate('/')
                  }}
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-[var(--muted)] transition-colors hover:bg-[var(--gold-soft)] hover:text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </>
          )}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            title={user.name}
            className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-[var(--surface)]/70 ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-[var(--ink)] bg-[var(--gold)] text-[11px] font-semibold text-[var(--gink)]">
              {initials(user.name)}
            </div>
            {!collapsed && (
              <div className="min-w-0 text-left">
                <p className="truncate text-[13px] text-[var(--ink)]">{user.name}</p>
                <p className="truncate text-[11px] text-[var(--muted2)]">
                  {user.email}
                </p>
              </div>
            )}
          </button>
        </div>
      )}

      {deleting && (
        <DeleteProjectModal
          projectName={deleting.name}
          onClose={() => setDeleting(null)}
          onConfirm={handleDelete}
        />
      )}
    </>
  )
}
