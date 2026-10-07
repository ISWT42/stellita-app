import type { CSSProperties, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ThemeToggle } from '../components/ThemeToggle'

export const YELLOW = 'var(--gold)'

/** The Stellita mark: the pixel star mascot. Rendered pixelated. */
export function Logo({ size = 24 }: { size?: number }) {
  return (
    <img
      src="/stellita/mascot.png"
      alt="Stellita"
      width={size}
      height={size}
      style={{ display: 'block', imageRendering: 'pixelated' }}
    />
  )
}

/** "STELLITA.APP" wordmark — STELLITA bold, ".APP" in accent-dark. */
export function Wordmark({ size = 19 }: { size?: number }) {
  return (
    <span style={{ fontSize: size, fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--ink)' }}>
      STELLITA<span style={{ color: 'var(--gold-dk)' }}>.APP</span>
    </span>
  )
}

type NavKey = 'home' | 'templates' | 'contracts' | 'pricing' | 'faq'

const NAV_LINKS: { key: NavKey; label: string; to: string }[] = [
  { key: 'contracts', label: 'Contracts', to: '/contracts' },
  { key: 'templates', label: 'Templates', to: '/templates' },
  { key: 'pricing', label: 'Pricing', to: '/pricing' },
  { key: 'faq', label: 'FAQ', to: '/faq' },
]

/** Sticky top nav, shared across the marketing pages. */
export function Nav({
  active,
  signedIn,
  onSignIn,
}: {
  active: NavKey
  signedIn: boolean
  onSignIn: () => void
}) {
  const navigate = useNavigate()
  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 60,
        height: 72,
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '2px solid var(--ink)',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          height: '100%',
          margin: '0 auto',
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          onClick={() => navigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
        >
          <Logo size={38} />
          <Wordmark size={20} />
        </div>
        <div className="xlm-hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 30, fontSize: 15 }}>
          {NAV_LINKS.map((l) => (
            <span
              key={l.key}
              className="xlm-navlink"
              onClick={() => navigate(l.to)}
              style={l.key === active ? { color: 'var(--ink)' } : undefined}
            >
              {l.label}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ThemeToggle size={42} />
          <div
            onClick={onSignIn}
            className="xlm-pill st-lift st-lift-dark"
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--gink)',
              background: YELLOW,
              padding: '9px 22px',
              borderRadius: 12,
              border: '2px solid var(--ink)',
              boxShadow: '3px 3px 0 var(--shadow)',
              cursor: 'pointer',
            }}
          >
            {signedIn ? 'Go to app' : 'Sign In'}
          </div>
        </div>
      </div>
    </nav>
  )
}

/** Eyebrow label used above section headings. Press Start 2P pixel label. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="st-pixel" style={{ fontSize: 11, color: 'var(--gold-dk)', marginBottom: 18 }}>
      {children}
    </div>
  )
}

/** Soft radial glow used behind hero / CTA. */
export function Glow({ style }: { style?: CSSProperties }) {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        background: `radial-gradient(50% 50% at 50% 50%, rgba(253,218,36,0.12), transparent 70%)`,
        animation: 'xlmGlow 6s ease-in-out infinite',
        pointerEvents: 'none',
        ...style,
      }}
    />
  )
}

export function Footer() {
  const navigate = useNavigate()
  const col: { title: string; links: { label: string; to: string }[] }[] = [
    { title: 'Product', links: [{ label: 'Contracts', to: '/contracts' }, { label: 'Pricing', to: '/pricing' }, { label: 'FAQ', to: '/#faq' }] },
    { title: 'Build', links: [{ label: 'Open the app', to: '/app' }, { label: 'Templates', to: '/app' }] },
  ]
  return (
    <footer style={{ borderTop: '2px solid var(--ink)', padding: '56px 32px 48px', marginTop: 40, background: 'var(--bg2)' }}>
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 40,
          justifyContent: 'space-between',
        }}
      >
        <div style={{ maxWidth: 320 }}>
          <div
            onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 14 }}
          >
            <Logo size={32} />
            <Wordmark size={17} />
          </div>
          <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
            Build on Stellar without writing a single line of Rust. Prompt, deploy, done.
          </p>
        </div>
        {col.map((c) => (
          <div key={c.title}>
            <div className="st-pixel" style={{ fontSize: 10, color: 'var(--muted2)', marginBottom: 16 }}>
              {c.title}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {c.links.map((l) => (
                <span key={l.label} className="xlm-navlink" style={{ fontSize: 14.5 }} onClick={() => navigate(l.to)}>
                  {l.label}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ maxWidth: 1280, margin: '40px auto 0', display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', fontSize: 13, color: 'var(--muted3)', fontWeight: 500 }}>
        <span>© {2026} Stellita · Runs on Stellar testnet.</span>
        <span>
          Created by{' '}
          <a
            href="https://www.instagram.com/lasoftwarefactory/"
            target="_blank"
            rel="noreferrer"
            style={{ color: 'var(--muted)', textDecoration: 'none', fontWeight: 600 }}
          >
            lasoftwarefactory
          </a>
        </span>
      </div>
    </footer>
  )
}
