import { useState } from 'react'
import { Loader2, AlertTriangle, Copy, Check } from 'lucide-react'

/** Normalize for the name match: trim, case-insensitive, accent-insensitive. */
function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip combining accent marks
    .trim()
    .toLowerCase()
}

/**
 * Destructive delete guard. The user must type BOTH:
 *   1. the project name (trim + case/accent-insensitive), and
 *   2. the word "delete" (case-insensitive)
 * before the action is enabled.
 */
export function DeleteProjectModal({
  projectName,
  onClose,
  onConfirm,
}: {
  projectName: string
  onClose: () => void
  onConfirm: () => void | Promise<void>
}) {
  const [nameInput, setNameInput] = useState('')
  const [wordInput, setWordInput] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const copyName = async () => {
    try {
      await navigator.clipboard.writeText(projectName)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard unavailable (insecure context / denied) — the user can still
      // type the name manually.
    }
  }

  const nameOk = normalize(nameInput) === normalize(projectName)
  const wordOk = wordInput.trim().toLowerCase() === 'delete'
  const ready = nameOk && wordOk && !deleting

  const confirm = async () => {
    if (!ready) return
    setDeleting(true)
    setError('')
    try {
      await onConfirm()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete the project')
      setDeleting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border-2 border-[var(--ink)] bg-[var(--surface)] p-5"
        style={{ boxShadow: '6px 6px 0 var(--shadow)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 text-[var(--danger)]">
          <AlertTriangle className="h-5 w-5" />
          <h2 className="text-[15px] font-medium">Delete project</h2>
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted)]">
          This permanently deletes{' '}
          <span className="text-[var(--ink)]">{projectName}</span> — its files,
          versions, messages and contract records. This can't be undone.
        </p>

        <label className="mt-4 block">
          <span className="mb-1.5 flex flex-wrap items-center gap-1.5 text-[12px] text-[var(--muted2)]">
            Type
            <span className="inline-flex items-center gap-1 rounded-md border-2 border-[var(--ink)] bg-[var(--bg2)] px-1.5 py-0.5">
              <code className="select-all font-mono text-[12.5px] text-[var(--ink)]">{projectName}</code>
              <button
                type="button"
                onClick={() => void copyName()}
                title="Copy project name"
                aria-label="Copy project name"
                className="text-[var(--muted2)] transition-colors hover:text-[var(--ink)]"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            </span>
            to confirm
          </span>
          <input
            autoFocus
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder={projectName}
            className={`w-full select-text rounded-lg border-2 bg-[var(--surface)] px-3 py-2 text-[14px] text-[var(--ink)] outline-none ${
              nameInput && !nameOk
                ? 'border-[var(--danger)] focus:border-[var(--danger)]'
                : 'border-[var(--ink)] focus:border-[var(--gold-dk)]'
            }`}
          />
        </label>

        <label className="mt-3 block">
          <span className="mb-1 block text-[12px] text-[var(--muted2)]">
            Type <code className="font-mono text-[var(--ink)]">delete</code> to confirm
          </span>
          <input
            value={wordInput}
            onChange={(e) => setWordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && ready) void confirm()
              if (e.key === 'Escape') onClose()
            }}
            placeholder="delete"
            className={`w-full select-text rounded-lg border-2 bg-[var(--surface)] px-3 py-2 text-[14px] text-[var(--ink)] outline-none ${
              wordInput && !wordOk
                ? 'border-[var(--danger)] focus:border-[var(--danger)]'
                : 'border-[var(--ink)] focus:border-[var(--gold-dk)]'
            }`}
          />
        </label>

        {error && (
          <p className="mt-3 text-[12.5px] text-[var(--danger)]">{error}</p>
        )}

        <div className="mt-5 flex justify-end gap-2 text-[13px]">
          <button
            onClick={onClose}
            className="rounded-lg px-3.5 py-1.5 text-[var(--muted2)] hover:text-[var(--ink)]"
          >
            Cancel
          </button>
          <button
            onClick={() => void confirm()}
            disabled={!ready}
            style={{ boxShadow: ready ? '3px 3px 0 var(--shadow)' : undefined }}
            className="flex items-center gap-1.5 rounded-lg border-2 border-[var(--ink)] bg-red-600 px-3.5 py-1.5 font-medium text-white transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {deleting ? 'Deleting…' : 'Delete project'}
          </button>
        </div>
      </div>
    </div>
  )
}
