import { useState, type ReactNode } from 'react'
import { MessageSquare, LayoutGrid } from 'lucide-react'

type Tab = 'chat' | 'workspace'

/**
 * Mobile layout for the project editor. Desktop shows chat + workspace side by
 * side (react-resizable-panels); on a phone that doesn't fit, so we collapse the
 * two primary surfaces into a top switcher — Chat | Workspace — mirroring the
 * desktop hierarchy (chat left, workspace right). The workspace keeps its own
 * Preview/Code/Contracts/Console sub-tabs + Share.
 *
 * BOTH panels stay mounted and are toggled with `hidden`, never unmounted — the
 * workspace hosts the Sandpack preview iframe, which must not remount on every
 * tab switch (it would reload the bundler and lose preview state).
 */
export function MobileEditor({
  chat,
  workspace,
}: {
  chat: ReactNode
  workspace: ReactNode
}) {
  const [tab, setTab] = useState<Tab>('chat')

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 border-b-2 border-[var(--ink)] bg-[var(--surface)]">
        {(
          [
            { id: 'chat', label: 'Chat', Icon: MessageSquare },
            { id: 'workspace', label: 'Workspace', Icon: LayoutGrid },
          ] as const
        ).map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex flex-1 items-center justify-center gap-2 py-3 text-[13px] font-semibold transition-colors ${
              tab === id
                ? 'border-b-2 border-[var(--ink)] bg-[var(--gold)] text-[var(--gink)]'
                : 'text-[var(--muted2)] hover:text-[var(--ink)]'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="relative min-h-0 flex-1">
        <div className={tab === 'chat' ? 'h-full' : 'hidden'}>{chat}</div>
        <div className={tab === 'workspace' ? 'h-full' : 'hidden'}>{workspace}</div>
      </div>
    </div>
  )
}
