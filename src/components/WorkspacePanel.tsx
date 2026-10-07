import { useEffect, useRef, useState } from 'react'
import {
  SandpackProvider,
  SandpackPreview,
  SandpackCodeEditor,
  Navigator,
  useSandpack,
  useActiveCode,
  useSandpackConsole,
  useErrorMessage,
} from '@codesandbox/sandpack-react'
import { FileExplorer } from './FileTree'
import { ContractsPanel } from './ContractsPanel'
import {
  Monitor,
  Smartphone,
  Download,
  History,
  Copy,
  Check,
  SquarePen,
  Eye,
  X,
  Wand2,
  AlertTriangle,
  Loader2,
  Globe,
  Lock,
} from 'lucide-react'
import type { FileTree, DeployedContract } from '../../shared/types'
import type { Version } from '../projects/store'
import { SANDPACK_TEMPLATE, TAILWIND_CDN, sandpackTheme } from '../lib/project'
import { downloadProjectZip } from '../lib/export'

type Device = 'desktop' | 'mobile'

/**
 * Syncs user edits from the Sandpack editor back into our file tree (debounced),
 * for files we own — so chat/LLM/export/versions stay consistent. Does NOT touch
 * template default files. Must live inside SandpackProvider.
 */
function SandpackSync({
  fileTree,
  onSync,
}: {
  fileTree: FileTree
  onSync: (files: FileTree) => void
}) {
  const { sandpack } = useSandpack()
  const ftRef = useRef(fileTree)
  // Keep the ref pointing at the latest tree without touching it during render.
  useEffect(() => {
    ftRef.current = fileTree
  }, [fileTree])

  // Baseline = Sandpack's OWN view of the files once loaded. We only report an
  // edit (→ dirty) when the live files deviate from that baseline. This avoids
  // false "unsaved edits" on load / agent changes / restore: each of those
  // remounts SandpackProvider (key=generation), which remounts this component
  // and re-establishes the baseline. Only genuine in-editor typing deviates.
  const baselineRef = useRef<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      const ft = ftRef.current
      const current: FileTree = {}
      let allLoaded = true
      for (const path of Object.keys(ft)) {
        const code = sandpack.files[path]?.code
        if (code === undefined) {
          allLoaded = false
          current[path] = ft[path]
        } else {
          current[path] = code
        }
      }
      const key = JSON.stringify(current)
      if (baselineRef.current === null) {
        // Establish the baseline once Sandpack has loaded our files.
        if (allLoaded) baselineRef.current = key
        return
      }
      if (key !== baselineRef.current) onSync(current)
    }, 600)
    return () => clearTimeout(t)
  }, [sandpack.files, onSync])

  return null
}

/** Copy + read-only/edit toggle, pinned top-right of the code editor. */
function CodeBar({
  editable,
  setEditable,
  lock = false,
}: {
  editable: boolean
  setEditable: (v: boolean) => void
  /** When locked (read-only project), hide the edit toggle entirely. */
  lock?: boolean
}) {
  const { code } = useActiveCode()
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex shrink-0 items-center justify-end gap-1.5 border-b-2 border-[var(--ink)] bg-[var(--surface)] px-2 py-1.5">
      <button
        onClick={() => {
          void navigator.clipboard?.writeText(code)
          setCopied(true)
          setTimeout(() => setCopied(false), 1200)
        }}
        title="Copy file"
        className="rounded-md border-2 border-[var(--ink)] p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--gold-soft)] hover:text-[var(--ink)]"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-600" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
      {!lock && (
        <button
          onClick={() => setEditable(!editable)}
          title={editable ? 'Switch to read-only' : 'Edit file'}
          className={`rounded-md border-2 p-1.5 transition-colors ${
            editable
              ? 'border-[var(--gold-dk)] bg-[var(--gold-soft)] text-[var(--gold-dk)]'
              : 'border-[var(--ink)] text-[var(--muted)] hover:bg-[var(--gold-soft)] hover:text-[var(--ink)]'
          }`}
        >
          {editable ? <Eye className="h-3.5 w-3.5" /> : <SquarePen className="h-3.5 w-3.5" />}
        </button>
      )}
    </div>
  )
}

const logLine = (d: unknown[] | undefined) =>
  (d ?? []).map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' ')

/**
 * Surfaces errors: compile errors via useErrorMessage, runtime errors via the
 * console (a thrown render error lands there, not in useErrorMessage).
 */
function ErrorWatcher({ onError }: { onError: (msg: string) => void }) {
  const compileError = useErrorMessage()
  const { logs } = useSandpackConsole({ resetOnPreviewRestart: true })
  useEffect(() => {
    if (compileError) return onError(compileError)
    const errLog = [...logs].reverse().find((l) => l.method === 'error')
    onError(errLog ? logLine(errLog.data) : '')
  }, [compileError, logs, onError])
  return null
}

/** Console output (logs + errors) with copy + clear. Inside SandpackProvider. */
function ConsolePanel() {
  const { logs, reset } = useSandpackConsole({ resetOnPreviewRestart: true })
  const [copied, setCopied] = useState(false)
  const lineOf = logLine
  const copy = () => {
    void navigator.clipboard?.writeText(
      logs.map((l) => `[${l.method}] ${lineOf(l.data)}`).join('\n'),
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }
  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--bg)]">
      <div className="flex shrink-0 items-center justify-between border-b-2 border-[var(--ink)] bg-[var(--surface)] px-3 py-1.5 text-[12px] text-[var(--muted2)]">
        <span>Console · {logs.length}</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={copy}
            className="flex items-center gap-1 rounded-md border-2 border-[var(--ink)] px-2 py-1 text-[var(--muted)] transition-colors hover:bg-[var(--gold-soft)] hover:text-[var(--ink)]"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            Copy
          </button>
          <button
            onClick={reset}
            className="rounded-md border-2 border-[var(--ink)] px-2 py-1 text-[var(--muted)] transition-colors hover:bg-[var(--gold-soft)] hover:text-[var(--ink)]"
          >
            Clear
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 select-text overflow-y-auto p-2 font-mono text-[12px]">
        {logs.length === 0 ? (
          <p className="px-1 text-[var(--muted3)]">No console output.</p>
        ) : (
          logs.map((l, i) => (
            <div
              key={i}
              className={`whitespace-pre-wrap px-1 py-0.5 ${
                l.method === 'error'
                  ? 'text-red-700'
                  : l.method === 'warn'
                    ? 'text-amber-700'
                    : 'text-[var(--ink)]'
              }`}
            >
              {lineOf(l.data)}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

/** Dropdown listing local checkpoints; restore sets the project back to one. */
function VersionMenu({
  versions,
  onOpen,
  onRestore,
}: {
  versions: Version[]
  onOpen: (id: string) => void
  /** Optional — omitted in read-only (shared) views, where you can view a
   *  version but not destructively restore. */
  onRestore?: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState<{ id: string; n: number } | null>(null)
  if (versions.length === 0) return null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-md border-2 border-[var(--ink)] bg-[var(--surface)] px-3 py-1.5 text-[var(--ink)] transition-colors hover:bg-[var(--gold-soft)]"
        title="Version history"
      >
        <History className="h-4 w-4" />
        v{versions.length}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 z-50 mt-1 max-h-96 w-80 overflow-y-auto rounded-lg border-2 border-[var(--ink)] bg-[var(--surface)] p-1"
            style={{ boxShadow: '5px 5px 0 var(--shadow)' }}
          >
            {versions
              .map((v, i) => ({ v, n: i + 1, latest: i === versions.length - 1 }))
              .reverse()
              .map(({ v, n, latest }) => (
                <div
                  key={v.id}
                  className="group rounded-md px-2.5 py-2 hover:bg-[var(--gold-soft)]"
                >
                  <button
                    onClick={() => {
                      onOpen(v.id)
                      setOpen(false)
                    }}
                    className="block w-full text-left"
                    title="Open this version"
                  >
                    <div className="flex items-center gap-2 text-[12.5px] text-[var(--ink)]">
                      <span className="text-[var(--muted2)]">v{n}</span>
                      <span className="truncate font-medium">{v.label}</span>
                      {latest && (
                        <span className="ml-auto shrink-0 rounded bg-[var(--gold-soft)] px-1.5 py-0.5 text-[10px] text-[var(--muted)]">
                          current
                        </span>
                      )}
                    </div>
                    {v.summary && (
                      <p className="mt-0.5 line-clamp-2 text-[11.5px] text-[var(--muted2)]">
                        {v.summary}
                      </p>
                    )}
                  </button>
                  {/* Destructive restore: only for older versions, never at v1.
                      Hidden in read-only (shared) views (no onRestore). */}
                  {onRestore && !latest && versions.length > 1 && (
                    <button
                      onClick={() => setConfirm({ id: v.id, n })}
                      className="mt-1.5 rounded border-2 border-[var(--ink)] px-2 py-0.5 text-[11px] text-[var(--muted)] hover:border-red-700 hover:text-red-700"
                    >
                      Restore (discard newer)
                    </button>
                  )}
                </div>
              ))}
          </div>
        </>
      )}
      {confirm && (
        <RestoreConfirm
          n={confirm.n}
          onClose={() => setConfirm(null)}
          onConfirm={() => {
            onRestore?.(confirm.id)
            setConfirm(null)
            setOpen(false)
          }}
        />
      )}
    </div>
  )
}

/** Destructive-restore guard: user must type "restore" to proceed. */
function RestoreConfirm({
  n,
  onClose,
  onConfirm,
}: {
  n: number
  onClose: () => void
  onConfirm: () => void
}) {
  const [value, setValue] = useState('')
  const ok = value.trim().toLowerCase() === 'restore'
  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border-2 border-[var(--ink)] bg-[var(--surface)] p-5"
        style={{ boxShadow: '6px 6px 0 var(--shadow)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-[15px] font-medium text-red-700">Restore to v{n}?</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted)]">
          This reverts the project to v{n} and{' '}
          <span className="text-[var(--ink)]">permanently discards every newer
          version</span>
          . This can't be undone. Type <code className="text-[var(--ink)]">restore</code>{' '}
          to confirm.
        </p>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && ok) onConfirm()
            if (e.key === 'Escape') onClose()
          }}
          placeholder="restore"
          className="mt-4 w-full select-text rounded-lg border-2 border-[var(--ink)] bg-[var(--surface)] px-3 py-2 text-[14px] text-[var(--ink)] outline-none focus:border-[var(--gold-dk)]"
        />
        <div className="mt-5 flex justify-end gap-2 text-[13px]">
          <button
            onClick={onClose}
            className="rounded-lg px-3.5 py-1.5 text-[var(--muted)] hover:text-[var(--ink)]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!ok}
            className="rounded-lg border-2 border-[var(--ink)] bg-red-600 px-3.5 py-1.5 font-medium text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Restore
          </button>
        </div>
      </div>
    </div>
  )
}

type Tab = 'preview' | 'code' | 'contracts' | 'console'
const TABS: { id: Tab; label: string }[] = [
  { id: 'preview', label: 'Preview' },
  { id: 'code', label: 'Code' },
  { id: 'contracts', label: 'Contracts' },
  { id: 'console', label: 'Console' },
]

/**
 * Custom preview top bar: the route navigator (back/forward/url) on the left,
 * and reload + device toggle + versions + download on the right — all in one
 * row. Must render inside SandpackProvider (uses the navigation client).
 */
function PreviewBar({
  device,
  setDevice,
  versions,
  onOpenVersion,
  onRestore,
  onDownload,
}: {
  device: Device
  setDevice: (d: Device) => void
  versions: Version[]
  onOpenVersion?: (id: string) => void
  onRestore?: (id: string) => void
  onDownload: () => void
}) {
  return (
    <div className="flex shrink-0 items-center gap-1.5 border-b-2 border-[var(--ink)] bg-[var(--surface)] px-2 py-1.5">
      <Navigator clientId="default" className="min-w-0 flex-1" />
      <div className="flex items-center rounded-md border-2 border-[var(--ink)] p-0.5">
        <button
          onClick={() => setDevice('desktop')}
          title="Desktop"
          className={`rounded p-1 transition-colors ${device === 'desktop' ? 'bg-[var(--gold)] text-[var(--gink)]' : 'text-[var(--muted2)] hover:text-[var(--ink)]'}`}
        >
          <Monitor className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setDevice('mobile')}
          title="Mobile"
          className={`rounded p-1 transition-colors ${device === 'mobile' ? 'bg-[var(--gold)] text-[var(--gink)]' : 'text-[var(--muted2)] hover:text-[var(--ink)]'}`}
        >
          <Smartphone className="h-3.5 w-3.5" />
        </button>
      </div>
      {onOpenVersion && versions.length > 0 && (
        <VersionMenu
          versions={versions}
          onOpen={onOpenVersion}
          onRestore={onRestore}
        />
      )}
      <button
        onClick={onDownload}
        title="Download project"
        className="flex items-center gap-1.5 rounded-md border-2 border-[var(--ink)] bg-[var(--surface)] px-2.5 py-1.5 text-[12.5px] text-[var(--ink)] transition-colors hover:bg-[var(--gold-soft)]"
      >
        <Download className="h-3.5 w-3.5" />
        Download
      </button>
    </div>
  )
}

/**
 * Right column: live preview + code in one Sandpack instance.
 *
 * - Tailwind is injected via `externalResources` (the only thing that works in
 *   the classic bundler).
 * - The provider remounts (via `key`) when file content changes, so updates are
 *   always reflected.
 * - The `absolute inset-0` wrapper gives the iframe a concrete pixel box.
 */
export function WorkspacePanel({
  fileTree,
  projectId = '',
  projectName = 'stellar-app',
  versions = [],
  onOpenVersion,
  onRestore,
  generation = 0,
  dirty = false,
  onSyncFiles,
  onDiscard,
  onSave,
  onCreateFile,
  onCreateFolder,
  onDeleteEntry,
  onFixError,
  contracts = [],
  onDeployed,
  readOnly = false,
  visibility = 'private',
  shareUrl: shareUrlProp = '',
  onSetVisibility,
  onEmailShare,
}: {
  fileTree: FileTree
  projectId?: string
  projectName?: string
  versions?: Version[]
  onOpenVersion?: (id: string) => void
  onRestore?: (id: string) => void
  generation?: number
  dirty?: boolean
  onSyncFiles?: (files: FileTree) => void
  onDiscard?: () => void
  onSave?: () => void
  onCreateFile?: (path: string) => void
  onCreateFolder?: (folderPath: string) => void
  onDeleteEntry?: (path: string) => void
  onFixError?: (text: string) => void
  contracts?: DeployedContract[]
  onDeployed?: (c: DeployedContract) => void
  /** Read-only view (template/shared): no editing, no deploy, no share. */
  readOnly?: boolean
  /** Current sharing state — drives the header badge and the share modal. */
  visibility?: 'private' | 'link'
  /** The project's existing public link (empty when none). */
  shareUrl?: string
  /** Switch the project private / link-shareable. Returns the public URL when
   *  link-shared, or null when private. */
  onSetVisibility?: (
    visibility: 'private' | 'link',
  ) => Promise<{ visibility: 'private' | 'link'; url: string | null }>
  /** Email a share link to a recipient (via Resend). */
  onEmailShare?: (to: string) => Promise<{ url?: string } | unknown>
}) {
  const [tab, setTab] = useState<Tab>('preview')
  const [device, setDevice] = useState<Device>('desktop')
  const [downloadOpen, setDownloadOpen] = useState(false)
  const [editable, setEditable] = useState(false)
  const [previewError, setPreviewError] = useState('')
  const [shareOpen, setShareOpen] = useState(false)
  const [vis, setVis] = useState<'private' | 'link'>(visibility)
  const [url, setUrl] = useState(shareUrlProp)
  const [visBusy, setVisBusy] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [emailTo, setEmailTo] = useState('')
  const [emailState, setEmailState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  // Keep local (optimistic) share state in sync when the project's share info
  // changes — e.g. it finishes loading from the backend. Adjusting state during
  // render on a prop change is React's recommended alternative to a prop→state
  // effect (https://react.dev/learn/you-might-not-need-an-effect).
  const [shareSync, setShareSync] = useState({ visibility, shareUrlProp })
  if (shareSync.visibility !== visibility || shareSync.shareUrlProp !== shareUrlProp) {
    setShareSync({ visibility, shareUrlProp })
    setVis(visibility)
    setUrl(shareUrlProp)
  }

  const changeVisibility = async (next: 'private' | 'link') => {
    if (!onSetVisibility || next === vis) return
    const prev = vis
    setVis(next)
    setVisBusy(true)
    try {
      const res = await onSetVisibility(next)
      setVis(res.visibility)
      setUrl(res.url ?? '')
    } catch {
      setVis(prev) // revert on failure
    } finally {
      setVisBusy(false)
    }
  }

  const sendShareEmail = async () => {
    const to = emailTo.trim()
    if (!to || !onEmailShare) return
    setEmailState('sending')
    try {
      const res = (await onEmailShare(to)) as { url?: string } | undefined
      // Emailing the link enables it server-side — reflect that here.
      setVis('link')
      if (res?.url) setUrl(res.url)
      setEmailState('sent')
      setEmailTo('')
    } catch {
      setEmailState('error')
    }
  }

  const copyLink = () => {
    if (!url) return
    void navigator.clipboard?.writeText(url)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 1200)
  }

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col">
      <nav className="flex shrink-0 items-center justify-between border-b-2 border-[var(--ink)] bg-[var(--surface)] px-3 py-2.5 text-[13px]">
        <div className="flex min-w-0 items-center gap-1 max-md:overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-md border-2 px-3 py-1.5 font-medium transition-colors ${
                tab === t.id
                  ? 'border-[var(--ink)] bg-[var(--gold)] text-[var(--gink)]'
                  : 'border-transparent text-[var(--muted2)] hover:text-[var(--ink)]'
              }`}
            >
              {t.label}
              {t.id === 'console' && previewError && (
                <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
              )}
            </button>
          ))}
        </div>
        {!readOnly && (
          <div className="flex shrink-0 items-center gap-3 max-md:pl-2">
            <span
              className="flex items-center gap-1 text-[11.5px] font-normal text-[var(--muted2)]"
              title={vis === 'link' ? 'Anyone with the link can view and clone' : 'Only you can access this project'}
            >
              {vis === 'link' ? (
                <Globe className="h-3 w-3" />
              ) : (
                <Lock className="h-3 w-3" />
              )}
              {vis === 'link' ? 'Public' : 'Private'}
            </span>
            <button
              onClick={() => setShareOpen(true)}
              className="rounded-full border-2 border-[var(--ink)] bg-[var(--gold)] px-3.5 py-1.5 font-medium text-[var(--gink)] transition-transform hover:-translate-y-0.5"
              style={{ boxShadow: '3px 3px 0 var(--shadow)' }}
            >
              Share
            </button>
          </div>
        )}
      </nav>

      <div className="relative min-h-0 flex-1 bg-[var(--bg)]">
        <div className="absolute inset-0">
          <SandpackProvider
            key={generation}
            template={SANDPACK_TEMPLATE}
            files={fileTree}
            theme={sandpackTheme}
            options={{ externalResources: [TAILWIND_CDN] }}
            style={{ height: '100%' }}
          >
            {onSyncFiles && !readOnly && (
              <SandpackSync fileTree={fileTree} onSync={onSyncFiles} />
            )}
            <ErrorWatcher onError={setPreviewError} />
            <div className="flex h-full flex-col">
              <div
                className={
                  tab === 'preview' ? 'flex min-h-0 flex-1 flex-col' : 'hidden'
                }
              >
                <PreviewBar
                  device={device}
                  setDevice={setDevice}
                  versions={versions}
                  onOpenVersion={onOpenVersion}
                  onRestore={onRestore}
                  onDownload={() => setDownloadOpen(true)}
                />
                <div className="flex min-h-0 flex-1 justify-center bg-[var(--bg2)]">
                  <div
                    className="h-full"
                    style={{ width: device === 'mobile' ? 390 : '100%' }}
                  >
                    <SandpackPreview
                      showNavigator={false}
                      showOpenInCodeSandbox={false}
                      showRefreshButton={false}
                      style={{ height: '100%' }}
                    />
                  </div>
                </div>
              </div>
              <div
                className={
                  tab === 'code' ? 'flex min-h-0 flex-1 select-text' : 'hidden'
                }
              >
                <FileExplorer
                  fileTree={fileTree}
                  onCreateFile={readOnly ? () => {} : onCreateFile ?? (() => {})}
                  onCreateFolder={readOnly ? () => {} : onCreateFolder ?? (() => {})}
                  onDelete={readOnly ? () => {} : onDeleteEntry ?? (() => {})}
                />
                <div className="flex min-w-0 flex-1 flex-col">
                  <CodeBar
                    editable={editable}
                    setEditable={setEditable}
                    lock={readOnly}
                  />
                  <SandpackCodeEditor
                    readOnly={readOnly || !editable}
                    showLineNumbers
                    showTabs={false}
                    style={{ height: '100%', flex: 1 }}
                  />
                </div>
              </div>
              <div className={tab === 'console' ? 'min-h-0 flex-1' : 'hidden'}>
                <ConsolePanel />
              </div>
            </div>
          </SandpackProvider>
        </div>

        {tab === 'contracts' && (
          <ContractsPanel
            projectId={projectId}
            contracts={contracts}
            onDeployed={onDeployed ?? (() => {})}
            readOnly={readOnly}
          />
        )}


        {previewError && (
          <div
            className="absolute bottom-4 left-1/2 z-30 flex w-[min(92%,560px)] -translate-x-1/2 items-start gap-3 rounded-xl border-2 border-[var(--ink)] bg-[var(--surface)] px-3 py-2.5"
            style={{ boxShadow: '5px 5px 0 var(--shadow)' }}
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-medium text-red-700">App error</p>
              <p className="mt-0.5 max-h-16 select-text overflow-y-auto whitespace-pre-wrap font-mono text-[11.5px] text-[var(--ink)]">
                {previewError}
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-1.5">
              {onFixError && (
                <button
                  onClick={() => onFixError(previewError)}
                  className="flex items-center gap-1 rounded-md border-2 border-[var(--ink)] bg-[var(--gold)] px-2.5 py-1 text-[12px] font-medium text-[var(--gink)] transition-transform hover:-translate-y-0.5"
                  style={{ boxShadow: '2px 2px 0 var(--shadow)' }}
                >
                  <Wand2 className="h-3.5 w-3.5" /> Fix with AI
                </button>
              )}
              <button
                onClick={() => void navigator.clipboard?.writeText(previewError)}
                className="rounded-md border-2 border-[var(--ink)] px-2.5 py-1 text-[12px] text-red-700 transition-colors hover:bg-[var(--gold-soft)]"
              >
                Copy
              </button>
            </div>
          </div>
        )}

        {!previewError && dirty && (onDiscard || onSave) && (
          <div
            className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-xl border-2 border-[var(--ink)] bg-[var(--surface)] px-3 py-2"
            style={{ boxShadow: '5px 5px 0 var(--shadow)' }}
          >
            <span className="text-[13px] text-[var(--ink)]">
              You have unsaved edits
            </span>
            {onDiscard && (
              <button
                onClick={onDiscard}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[12.5px] text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
              >
                <X className="h-3.5 w-3.5" />
                Discard
              </button>
            )}
            {onSave && (
              <button
                onClick={onSave}
                className="rounded-md border-2 border-[var(--ink)] bg-[var(--gold)] px-3 py-1 text-[12.5px] font-medium text-[var(--gink)] transition-transform hover:-translate-y-0.5"
                style={{ boxShadow: '2px 2px 0 var(--shadow)' }}
              >
                Save
              </button>
            )}
          </div>
        )}
      </div>

      {downloadOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setDownloadOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border-2 border-[var(--ink)] bg-[var(--surface)] p-5"
            style={{ boxShadow: '6px 6px 0 var(--shadow)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-[15px] font-medium text-[var(--ink)]">Download project</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted)]">
              Download <span className="text-[var(--ink)]">{projectName}</span> as a
              complete Vite + React + TypeScript project (.zip) that runs locally
              with <code className="text-[var(--muted)]">pnpm install &amp;&amp; pnpm dev</code>.
            </p>
            <div className="mt-5 flex justify-end gap-2 text-[13px]">
              <button
                onClick={() => setDownloadOpen(false)}
                className="rounded-lg px-3.5 py-1.5 text-[var(--muted)] hover:text-[var(--ink)]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  void downloadProjectZip(projectName, fileTree)
                  setDownloadOpen(false)
                }}
                className="rounded-lg border-2 border-[var(--ink)] bg-[var(--gold)] px-3.5 py-1.5 font-medium text-[var(--gink)] transition-transform hover:-translate-y-0.5"
                style={{ boxShadow: '3px 3px 0 var(--shadow)' }}
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {shareOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShareOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border-2 border-[var(--ink)] bg-[var(--surface)] p-5"
            style={{ boxShadow: '6px 6px 0 var(--shadow)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-medium text-[var(--ink)]">Share “{projectName}”</h2>
              <button
                onClick={() => setShareOpen(false)}
                className="rounded p-1 text-[var(--muted2)] hover:text-[var(--ink)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--muted)]">
              Anyone you share this with can{' '}
              <span className="text-[var(--ink)]">clone it</span> into their own
              account — not just view.
            </p>

            {onEmailShare && (
              <div className="mt-4">
                <label className="mb-1.5 block text-[12px] font-medium text-[var(--muted)]">
                  Add people
                </label>
                <div className="flex gap-2">
                  <input
                    value={emailTo}
                    onChange={(e) => { setEmailTo(e.target.value); setEmailState('idle') }}
                    onKeyDown={(e) => { if (e.key === 'Enter') void sendShareEmail() }}
                    type="email"
                    placeholder="name@email.com"
                    className="min-w-0 flex-1 rounded-lg border-2 border-[var(--ink)] bg-[var(--surface)] px-3 py-2 text-[13px] text-[var(--ink)] outline-none placeholder:text-[var(--muted3)] focus:border-[var(--gold-dk)]"
                  />
                  <button
                    onClick={() => void sendShareEmail()}
                    disabled={emailState === 'sending' || !emailTo.trim()}
                    className="shrink-0 rounded-lg border-2 border-[var(--ink)] bg-[var(--gold)] px-3.5 py-2 text-[13px] font-medium text-[var(--gink)] transition-transform hover:-translate-y-0.5 disabled:opacity-50"
                  >
                    {emailState === 'sending' ? 'Sending…' : 'Send'}
                  </button>
                </div>
                {emailState === 'sent' && (
                  <p className="mt-1.5 text-[12px] text-emerald-700">
                    Invite sent — they can now open and clone this project.
                  </p>
                )}
                {emailState === 'error' && (
                  <p className="mt-1.5 text-[12px] text-red-700">
                    Could not send — check the email is configured.
                  </p>
                )}
              </div>
            )}

            <div className="mt-4 border-t-2 border-[var(--ink)] pt-4">
              <p className="mb-2 text-[12px] font-medium text-[var(--muted)]">General access</p>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[var(--ink)] bg-[var(--bg2)] text-[var(--ink)]">
                  {vis === 'link' ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <select
                      value={vis}
                      disabled={visBusy || !onSetVisibility}
                      onChange={(e) => void changeVisibility(e.target.value as 'private' | 'link')}
                      className="cursor-pointer rounded-md bg-transparent py-0.5 text-[13.5px] font-medium text-[var(--ink)] outline-none disabled:opacity-60"
                    >
                      <option value="private" className="bg-[var(--surface)]">Restricted</option>
                      <option value="link" className="bg-[var(--surface)]">Anyone with the link</option>
                    </select>
                    {visBusy && <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--muted2)]" />}
                  </div>
                  <p className="mt-0.5 text-[12px] text-[var(--muted2)]">
                    {vis === 'link'
                      ? 'Anyone with the link can view and clone it.'
                      : 'Only you can open this project.'}
                  </p>
                </div>
              </div>

              {vis === 'link' && url && (
                <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border-2 border-[var(--ink)] bg-[var(--bg)] px-3 py-2">
                  <code className="min-w-0 truncate font-mono text-[12px] text-[var(--muted)]">{url}</code>
                  <button
                    onClick={copyLink}
                    className="flex shrink-0 items-center gap-1 rounded-md border-2 border-[var(--ink)] bg-[var(--gold)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--gink)] transition-transform hover:-translate-y-0.5"
                  >
                    {linkCopied ? <Check className="h-3.5 w-3.5 text-emerald-700" /> : <Copy className="h-3.5 w-3.5" />}
                    {linkCopied ? 'Copied' : 'Copy link'}
                  </button>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShareOpen(false)}
                className="rounded-full border-2 border-[var(--ink)] bg-[var(--gold)] px-4 py-1.5 text-[13px] font-medium text-[var(--gink)] transition-transform hover:-translate-y-0.5"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
