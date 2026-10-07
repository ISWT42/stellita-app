import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjects } from '../projects/store'
import { TEMPLATES } from '../lib/templates'
import { PROMPT_MAX } from '../../shared/types'

/** Route "/app" — the build home inside the authed shell. Ports the Stellita
 *  prompt box look manually (Tailwind/inline styles) rather than importing the
 *  marketing composer — see StellitaPromptComposer.tsx for the reference. */
export function BuildHome() {
  const navigate = useNavigate()
  const { createProject } = useProjects()
  // A prompt typed on the landing while logged out is stashed in localStorage
  // across the login round-trip — prefill it (lazy init) so the user just hits
  // Enter. The effect below consumes it so a refresh won't re-prefill it.
  const [prompt, setPrompt] = useState(
    () => localStorage.getItem('stellita_pending_prompt') ?? '',
  )
  useEffect(() => {
    localStorage.removeItem('stellita_pending_prompt')
  }, [])

  const submitPrompt = () => {
    const text = prompt.trim()
    if (!text) return
    navigate(`/projects/${createProject(text)}`)
  }

  const count = prompt.length
  const countColor =
    count >= PROMPT_MAX
      ? 'text-[var(--danger)]'
      : count >= PROMPT_MAX - 200
        ? 'text-[var(--gold-dk)]'
        : 'text-[var(--muted2)]'

  return (
    <main className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-2xl -translate-y-8">
        <img
          src="/stellita/mascot-main.gif"
          alt=""
          width={72}
          height={72}
          className="mx-auto mb-4 block [image-rendering:pixelated]"
        />
        <h1 className="mb-8 text-center text-3xl font-medium tracking-tight text-[var(--ink)] sm:text-4xl">
          What do you want to build?
        </h1>
        <div
          className="relative mx-auto max-w-190 rounded-[20px] border-[2.5px] border-[var(--ink)] bg-[var(--surface)] p-[22px_22px_16px] text-left"
          style={{ boxShadow: '6px 6px 0 var(--gold)' }}
        >
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submitPrompt()
              }
            }}
            rows={2}
            maxLength={PROMPT_MAX}
            placeholder='Describe a contract or dApp… e.g. "an NFT collection with royalties"'
            className="min-h-14.5 w-full resize-none border-none bg-transparent font-sans text-[18px] leading-normal font-medium text-[var(--ink)] outline-none placeholder:text-[var(--placeholder)]"
          />
          <div className="mt-3.5 flex items-center justify-between">
            <span className={`text-[12.5px] font-semibold tabular-nums ${countColor}`}>
              {count}/{PROMPT_MAX}
            </span>
            <button
              onClick={submitPrompt}
              disabled={!prompt.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-[11px] border-2 border-[var(--ink)] bg-[var(--gold)] text-[var(--gink)] shadow-[3px_3px_0_var(--shadow)] transition-transform duration-150 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_var(--shadow)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap justify-center gap-2.5">
          {TEMPLATES.map((t) => (
            <button
              key={t.token}
              onClick={() => navigate(`/p/${t.token}`)}
              className="rounded-full border-2 border-[var(--ink)] bg-[var(--surface)] px-4 py-2 text-[13px] font-medium text-[var(--muted)] transition-all duration-150 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-[var(--gold-soft)] hover:text-[var(--ink)] hover:shadow-[3px_3px_0_var(--shadow)]"
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>
    </main>
  )
}
