import { useState } from 'react'
import { useAuth } from './store'

export function LoginModal({
  onClose,
  onAuthed,
  googleNext,
}: {
  onClose?: () => void
  /** Fired after a successful OTP login (the user is now set). */
  onAuthed?: () => void
  /** Relative path Google OAuth should return to (defaults to current URL). */
  googleNext?: string
}) {
  const { startOtp, verifyOtp, loginWithGoogle } = useAuth()
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    try {
      await startOtp(email.trim())
      setStep('code')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send code')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true)
    setError('')
    try {
      await verifyOtp(email.trim(), code.trim())
      onAuthed?.()
      onClose?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--ink)]/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border-[2.5px] border-[var(--ink)] bg-[var(--surface)] p-6 shadow-[6px_6px_0_var(--shadow)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-[17px] font-semibold text-[var(--ink)]">
          {step === 'email' ? 'Sign in to Stellita' : 'Check your email'}
        </h2>
        <p className="mb-6 text-[13px] text-[var(--muted2)]">
          {step === 'email'
            ? 'Enter your email to receive a sign-in code.'
            : `We sent a 6-digit code to ${email}.`}
        </p>

        {step === 'email' ? (
          <form onSubmit={(e) => void handleSendCode(e)} className="flex flex-col gap-3">
            <input
              autoFocus
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border-2 border-[var(--ink)] bg-[var(--surface)] px-3.5 py-2.5 text-[14px] text-[var(--ink)] outline-none placeholder:text-[var(--muted3)] focus:border-[var(--gold-dk)]"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg border-2 border-[var(--ink)] bg-[var(--gold)] py-2.5 text-[14px] font-medium text-[var(--gink)] shadow-[3px_3px_0_var(--shadow)] transition-all duration-150 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_var(--shadow)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[3px_3px_0_var(--shadow)]"
            >
              {loading ? 'Sending…' : 'Send code'}
            </button>
          </form>
        ) : (
          <form onSubmit={(e) => void handleVerify(e)} className="flex flex-col gap-3">
            <input
              autoFocus
              type="text"
              inputMode="numeric"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              required
              className="w-full rounded-lg border-2 border-[var(--ink)] bg-[var(--surface)] px-3.5 py-2.5 text-[14px] text-[var(--ink)] outline-none placeholder:text-[var(--muted3)] focus:border-[var(--gold-dk)]"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg border-2 border-[var(--ink)] bg-[var(--gold)] py-2.5 text-[14px] font-medium text-[var(--gink)] shadow-[3px_3px_0_var(--shadow)] transition-all duration-150 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_var(--shadow)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[3px_3px_0_var(--shadow)]"
            >
              {loading ? 'Verifying…' : 'Verify'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('email'); setCode(''); setError('') }}
              className="text-[12.5px] text-[var(--muted2)] hover:text-[var(--ink)]"
            >
              Use a different email
            </button>
          </form>
        )}

        {error && (
          <p className="mt-3 text-[12.5px] text-red-600">{error}</p>
        )}

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--line-soft)]" />
          <span className="text-[11.5px] text-[var(--muted3)]">or</span>
          <div className="h-px flex-1 bg-[var(--line-soft)]" />
        </div>

        <button
          onClick={() => loginWithGoogle(googleNext)}
          className="flex w-full items-center justify-center gap-2.5 rounded-lg border-2 border-[var(--ink)] bg-[var(--surface)] py-2.5 text-[14px] font-medium text-[var(--ink)] transition-all duration-150 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-[var(--gold-soft)] hover:shadow-[3px_3px_0_var(--shadow)]"
        >
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908C16.658 14.463 17.64 12.037 17.64 9.2z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18L12.048 13.56C11.242 14.1 10.211 14.42 9 14.42c-2.33 0-4.306-1.573-5.012-3.687H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
            <path d="M3.988 10.733A5.54 5.54 0 0 1 3.67 9c0-.601.103-1.185.288-1.733V4.935H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.065l3.031-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.935L3.988 6.267C4.694 4.153 6.67 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  )
}
