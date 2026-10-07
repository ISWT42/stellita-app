import type { MouseEvent } from 'react'
import { Drawer } from 'vaul'
import { SidebarInner } from './Sidebar'

/**
 * Mobile-only left drawer that hosts the full sidebar (project list, search,
 * credits, profile). Opened by the hamburger in the AppShell top bar. Reuses
 * `SidebarInner` verbatim so the mobile nav never drifts from desktop.
 *
 * Tapping any link inside navigates and closes the drawer (handled here via
 * capture so the sidebar itself stays untouched).
 */
export function MobileSidebarDrawer({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const closeIfLink = (e: MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('a')) onOpenChange(false)
  }

  return (
    <Drawer.Root direction="left" open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Drawer.Content
          className="fixed inset-y-0 left-0 z-50 flex w-[82%] max-w-[300px] flex-col border-r-2 border-[var(--ink)] bg-[var(--bg2)] outline-none"
          aria-describedby={undefined}
        >
          <Drawer.Title className="sr-only">Navigation</Drawer.Title>
          <div className="flex min-h-0 flex-1 flex-col" onClickCapture={closeIfLink}>
            <SidebarInner collapsed={false} onToggle={() => onOpenChange(false)} />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
