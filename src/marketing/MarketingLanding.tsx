import { useState, type CSSProperties, type ReactNode } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../auth/store'
import { useProjects } from '../projects/store'
import { LoginModal } from '../auth/LoginModal'
import { TEMPLATES, type StaticTemplate } from '../lib/templates'
import { StellitaPromptComposer } from './StellitaPromptComposer'
import { ThemeToggle } from '../components/ThemeToggle'
import { ProtocolLogo } from '../components/ProtocolLogo'
import './marketing.css'
import { useMarketingSeo } from './seo'

/** Public Stellita landing ("/") — faithful to the "Stellita Landing" design
 *  doc (neobrutalist, cream, Poppins + Press Start 2P pixel eyebrows). Keeps the
 *  real auth + project flow: prompt → login → create; chips → open template.
 *
 *  Everything Stellita-branded lives inline here (or in StellitaPromptComposer)
 *  so we never touch shared.tsx / PromptComposer.tsx, which the APP reuses and
 *  which must stay Stellita. */

const MASCOT = '/stellita/mascot.png'
const MASCOT_MAIN = '/stellita/mascot-main.gif'
const MASCOT_EXPLAIN = '/stellita/mascot-explaining.gif'
const MASCOT_LOADING = '/stellita/mascot-loading.gif'
const MASCOT_THINKING = '/stellita/mascot-thinking.gif'

type NavKey = 'contracts' | 'templates' | 'pricing' | 'faq'
const NAV_LINKS: { key: NavKey; label: string; to: string }[] = [
  { key: 'contracts', label: 'Contracts', to: '/contracts' },
  { key: 'templates', label: 'Templates', to: '/templates' },
  { key: 'pricing', label: 'Pricing', to: '/pricing' },
  { key: 'faq', label: 'FAQ', to: '/faq' },
]

/** The Stellita pixel wordmark: mascot + "STELLITA.APP". Built inline (NOT the
 *  shared Logo/Wordmark, which stay Stellita for the app). */
function StellitaMark({ size = 38, font = 20 }: { size?: number; font?: number }) {
  return (
    <>
      <img src={MASCOT} alt="Stellita" width={size} height={size} className="st-pixelated" style={{ display: 'block' }} />
      <span style={{ fontSize: font, fontWeight: 800, letterSpacing: '-0.01em' }}>
        STELLITA<span style={{ color: 'var(--gold-dk)' }}>.APP</span>
      </span>
    </>
  )
}

export function MarketingLanding() {
  useMarketingSeo({
    title: 'Stellita — Ship on Stellar without a line of Rust',
    description:
      'Stellita is the AI builder for Stellar. Describe a dApp in plain language and it generates audited OpenZeppelin Soroban contracts, deploys them to Stellar testnet in one click, and wires up a working React frontend connected to your wallet — no Rust, no CLI, no setup.',
    path: '/',
  })
  const navigate = useNavigate()
  const { user } = useAuth()
  const { createProject } = useProjects()
  const [showLogin, setShowLogin] = useState(false)
  const [prompt, setPrompt] = useState('')

  const enter = () => (user ? navigate('/app') : setShowLogin(true))

  const submitPrompt = () => {
    const text = prompt.trim()
    if (!text) return enter()
    if (user) navigate(`/projects/${createProject(text)}`)
    else {
      // Preserve the (possibly long) prompt across the login round-trip.
      // localStorage survives the Google OAuth full-page redirect (same origin) —
      // unlike React state, or a URL/cookie that would truncate a long prompt.
      // /app reads + prefills it so the user just hits Enter (see BuildHome).
      localStorage.setItem('stellita_pending_prompt', text)
      setShowLogin(true)
    }
  }

  // Clicking a template opens its shared read-only preview (/p/:token), where
  // "Sign in" → "Clone" lives — same flow as a shared project. Static, no fetch.
  const openTemplate = (t: StaticTemplate) => {
    navigate(`/p/${t.token}`)
  }

  // Logged-in users never see the public landing.
  if (user) return <Navigate to="/app" replace />

  return (
    <div className="st-marketing" style={{ height: '100%', overflowY: 'auto' }}>
      {/* ============ NAV ============ */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 60, height: 72, background: 'var(--nav-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '2px solid var(--ink)' }}>
        <div style={{ maxWidth: 1280, height: '100%', margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <StellitaMark />
          </div>
          <div className="st-hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 30, fontSize: 15 }}>
            {NAV_LINKS.map((l) => (
              <span key={l.key} className="st-navlink" onClick={() => navigate(l.to)}>
                {l.label}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ThemeToggle size={42} />
            <div onClick={enter} className="st-lift st-lift-dark" style={{ fontSize: 15, fontWeight: 700, color: 'var(--gink)', background: 'var(--gold)', padding: '9px 22px', borderRadius: 12, border: '2px solid var(--ink)', cursor: 'pointer', boxShadow: '3px 3px 0 var(--shadow)' }}>
              Sign In
            </div>
          </div>
        </div>
      </nav>

      {/* ============ HERO ============ */}
      <section style={{ position: 'relative', padding: '56px 32px 72px', textAlign: 'center', overflow: 'hidden' }}>
        <div aria-hidden style={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)', width: 760, height: 420, background: 'radial-gradient(50% 50% at 50% 50%, rgba(255,215,0,0.28), transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 900, margin: '0 auto' }}>
          <img src={MASCOT_MAIN} alt="Stellita" width={150} className="st-pixelated" style={{ display: 'block', margin: '0 auto 20px' }} />
          <div className="st-up st-pixel" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, border: '2px solid var(--ink)', background: 'var(--surface)', borderRadius: 999, padding: '7px 16px 7px 12px', fontSize: 11, color: 'var(--ink)', marginBottom: 28, boxShadow: '3px 3px 0 var(--shadow)' }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: 'var(--gold)', border: '1.5px solid var(--ink)' }} />
            NO RUST · NO CLI · JUST VIBES
          </div>
          <h1 className="st-h1 st-up-1" style={{ fontSize: 66, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.02, margin: '0 0 36px' }}>
            What do you want to<br />build on Stellar?
          </h1>

          {/* prompt box — same behavior contract as /app's composer */}
          <StellitaPromptComposer value={prompt} onChange={setPrompt} onSubmit={submitPrompt} />

          {/* quick chips → static templates → /p/:token (no fetch, no flicker) */}
          <div className="st-up-2" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 26 }}>
            {TEMPLATES.map((t, i) => (
              <div key={t.token} onClick={() => openTemplate(t)} className="st-lift st-lift-yellow-sm" style={{ display: 'flex', alignItems: 'center', gap: 8, border: '2px solid var(--ink)', background: 'var(--surface)', borderRadius: 999, padding: '9px 18px', fontSize: 14, fontWeight: 600, color: 'var(--ink)', cursor: 'pointer' }}>
                <ChipIcon kind={t.kind} highlight={i === 0} />
                {t.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CONTRACT LIBRARY ============ */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '44px 32px 30px' }}>
        <div style={{ marginBottom: 32 }}>
          <div className="st-pixel" style={{ fontSize: 11, color: 'var(--gold-dk)', marginBottom: 18 }}>THE CONTRACT LIBRARY</div>
          <h2 className="st-h2" style={{ fontSize: 46, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 16px', lineHeight: 1.05 }}>
            Deploy audited contracts.<br />Write zero Rust.
          </h2>
          <p style={{ fontSize: 19, color: 'var(--muted)', maxWidth: 680, margin: 0, lineHeight: 1.55, fontWeight: 500 }}>
            Pick a battle-tested OpenZeppelin contract, connect to a live protocol, or describe your own — Stellita compiles and deploys it to Stellar testnet.
          </p>
        </div>
        <ContractLibrary onCustom={enter} />
      </section>

      {/* ============ BENTO ============ */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 32px 40px' }}>
        <div style={{ marginBottom: 38 }}>
          <div className="st-pixel" style={{ fontSize: 11, color: 'var(--gold-dk)', marginBottom: 18 }}>WHY STELLITA</div>
          <h2 className="st-h2" style={{ fontSize: 46, fontWeight: 800, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.05 }}>
            Everything you need to ship on Stellar
          </h2>
        </div>
        <div className="st-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div className="st-bento-tall st-onyellow" style={{ gridRow: 'span 2', border: '2.5px solid var(--ink)', borderRadius: 20, padding: 36, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 420, background: 'var(--gold)', boxShadow: '6px 6px 0 var(--shadow)' }}>
            <img src={MASCOT_LOADING} alt="Stellita" width={96} className="st-pixelated" />
            <div>
              <h3 style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.02, margin: '0 0 16px', color: 'var(--gink)' }}>Prompt.<br />Deploy.<br />Done.</h3>
              <p style={{ fontSize: 16, color: '#4a4536', lineHeight: 1.55, margin: 0, fontWeight: 600 }}>Generate a working Soroban smart contract in minutes and deploy it to Stellar testnet in seconds.</p>
            </div>
          </div>
          <BentoCard
            title="Audited by default"
            body="Every base contract is an audited OpenZeppelin implementation. You build on code that's already battle-tested."
            iconMarginBottom={50}
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>}
          />
          <div className="st-lift st-lift-yellow" style={{ border: '2px solid var(--ink)', borderRadius: 20, padding: 30, background: 'var(--surface)', overflow: 'hidden' }}>
            <h3 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 10px' }}>Plug into live protocols</h3>
            <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.55, margin: '0 0 20px', fontWeight: 500 }}>Compose with Soroswap, Blend, Reflector, USDC and more — by contract ID.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 9 }}>
              {[
                { l: 'S', bg: '#EDE3FA', c: '#6a3fb0' },
                { l: 'B', bg: '#D8F3E2', c: '#1f7a4d' },
                { l: 'R', bg: 'var(--gold-soft)', c: '#8a6a00' },
                { l: 'D', bg: '#D9E6FA', c: '#2b5bab' },
                { l: '$', bg: '#F0EBDD', c: 'var(--muted)' },
              ].map((p) => (
                <div key={p.l} style={{ aspectRatio: '1', borderRadius: 10, border: '2px solid var(--ink)', background: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: p.c }}>
                  {p.l}
                </div>
              ))}
            </div>
          </div>
          <BentoCard
            title="One-click testnet deploy"
            body="Go live on Stellar testnet instantly. No CLI, no toolchain, no funding dance — keys and faucet are handled."
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2 2 7l10 5 10-5-10-5z" /><path d="m2 17 10 5 10-5" /><path d="m2 12 10 5 10-5" /></svg>}
          />
          <BentoCard
            title="Start from templates"
            body="Token dashboards, NFT minters and swap UIs — ready to fork and make your own."
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>}
          />
        </div>
      </section>

      {/* ============ MARQUEE ============ */}
      <section style={{ padding: '60px 0 30px', borderTop: '2px solid var(--ink)', borderBottom: '2px solid var(--ink)', marginTop: 56, background: 'var(--bg2)' }}>
        <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--muted2)', letterSpacing: '0.04em', marginBottom: 34, fontWeight: 600 }}>Composable with the protocols you already trust</div>
        <div style={{ overflow: 'hidden', WebkitMaskImage: 'linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)', maskImage: 'linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)' }}>
          <div style={{ display: 'flex', gap: 64, width: 'max-content', animation: 'stMarquee 28s linear infinite', fontSize: 28, fontWeight: 800, color: 'var(--marquee)', whiteSpace: 'nowrap', padding: '0 32px' }}>
            {[...Array(2)].flatMap((_, r) => ['Soroswap', 'Blend', 'Reflector', 'DeFindex', 'Trustless Work', 'USDC', 'x402', 'OpenZeppelin', 'Soroban'].map((n) => <span key={`${r}-${n}`}>{n}</span>))}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section style={{ padding: '110px 32px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden style={{ position: 'absolute', bottom: -120, left: '50%', transform: 'translateX(-50%)', width: 820, height: 420, background: 'radial-gradient(50% 50% at 50% 50%, rgba(255,215,0,0.3), transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 720, margin: '0 auto' }}>
          <img src={MASCOT_THINKING} alt="Stellita" width={120} className="st-pixelated" style={{ display: 'block', margin: '0 auto 22px' }} />
          <h2 className="st-cta-h2" style={{ fontSize: 58, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.04, margin: '0 0 20px' }}>
            Start building<br />on Stellar
          </h2>
          <p style={{ fontSize: 20, color: 'var(--muted)', lineHeight: 1.55, margin: '0 0 36px', fontWeight: 500 }}>Experiment freely. Everything runs on testnet — deploy fearlessly, break nothing.</p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <div onClick={enter} className="st-lift st-lift-dark-lg" style={{ background: 'var(--gold)', color: 'var(--gink)', fontWeight: 700, fontSize: 17, padding: '15px 34px', borderRadius: 14, border: '2.5px solid var(--ink)', cursor: 'pointer', boxShadow: '5px 5px 0 var(--shadow)' }}>Get Started</div>
            <div onClick={() => navigate('/faq')} className="st-lift st-lift-yellow-lg" style={{ background: 'var(--surface)', color: 'var(--ink)', fontWeight: 700, fontSize: 17, padding: '15px 34px', borderRadius: 14, border: '2.5px solid var(--ink)', cursor: 'pointer', boxShadow: '5px 5px 0 var(--gold)' }}>Read the FAQ</div>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer style={{ borderTop: '2px solid var(--ink)', padding: '42px 32px', marginTop: 40, background: 'var(--bg2)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <StellitaMark size={32} font={17} />
          </div>
          <div style={{ display: 'flex', gap: 26, fontSize: 14, fontWeight: 600 }}>
            {NAV_LINKS.map((l) => (
              <span key={l.key} className="st-navlink" onClick={() => navigate(l.to)}>
                {l.label}
              </span>
            ))}
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted3)', fontWeight: 500 }}>Audited Soroban contracts · testnet only · © 2026 Stellita.app</div>
        </div>
      </footer>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} googleNext="/app" />}
    </div>
  )
}

/* ---- Bento card ---- */
function BentoCard({ title, body, icon, iconMarginBottom = 16 }: { title: string; body: string; icon: ReactNode; iconMarginBottom?: number }) {
  return (
    <div className="st-lift st-lift-yellow" style={{ border: '2px solid var(--ink)', borderRadius: 20, padding: 30, background: 'var(--surface)' }}>
      <div style={{ width: 44, height: 44, borderRadius: 11, border: '2px solid var(--ink)', background: 'var(--gold-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: iconMarginBottom, color: 'var(--ink)' }}>{icon}</div>
      <h3 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 10px' }}>{title}</h3>
      <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.55, margin: 0, fontWeight: 500 }}>{body}</p>
    </div>
  )
}

/* ---- Chip icon (quick templates) ---- */
function ChipIcon({ kind, highlight }: { kind: string | null; highlight?: boolean }) {
  const c = highlight ? 'var(--gold-dk)' : 'var(--ink)'
  if (kind === 'nft') return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.5-3.5L9 20" /></svg>
  if (kind === 'swap') return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><circle cx="8" cy="8" r="6" /><path d="M18.09 10.37A6 6 0 1 1 10.34 18" /></svg>
}

/* ==========================================================================
   Contract library — tabbed catalog (Configurable / Existing / Custom).
   Built inline in Stellita brand rather than reusing marketing/ContractLibrary
   (which is Stellita-styled and shared with the /contracts page). Presentational
   + a single onCustom CTA that runs the real enter() flow.
   ========================================================================== */

function Svg({ children, color = 'var(--ink)', w = 22 }: { children: ReactNode; color?: string; w?: number }) {
  return (
    <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}

type Card = { name: string; blurb: string; soon?: boolean; icon: ReactNode }

const CONFIGURABLE: Card[] = [
  { name: 'Fungible Token', blurb: 'Token with name, symbol and supply. The MVP hello-world.', icon: <Svg color="var(--gold-dk)"><circle cx="8" cy="8" r="6" /><path d="M18.09 10.37A6 6 0 1 1 10.34 18" /></Svg> },
  { name: 'Non-Fungible Token (NFT)', blurb: 'Unique collectibles: galleries, art, items.', icon: <Svg><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.5-3.5L9 20" /></Svg> },
  { name: 'NFT with Royalties', blurb: 'NFTs where the creator earns on resales.', soon: true, icon: <Svg color="var(--muted3)"><circle cx="12" cy="12" r="10" /><path d="m9 9 6 6" /></Svg> },
  { name: 'Ownable', blurb: 'Simple access control: a single owner account.', icon: <Svg><circle cx="7.5" cy="15.5" r="4.5" /><path d="m10.5 12.5 7-7" /><path d="m16 7 2 2 3-3-2-2z" /></Svg> },
  { name: 'Role-Based Access Control', blurb: 'Distinct roles per privileged action.', soon: true, icon: <Svg color="var(--muted3)"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></Svg> },
  { name: 'Vault (SEP-56)', blurb: 'Tokenized shares of an asset pool; yield products.', soon: true, icon: <Svg color="var(--muted3)"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="10" y1="9" x2="10" y2="15" /><line x1="14" y1="9" x2="14" y2="15" /></Svg> },
  { name: 'Pausable', blurb: 'Pause/unpause functions for emergencies.', soon: true, icon: <Svg color="var(--muted3)"><circle cx="12" cy="12" r="10" /><line x1="10" y1="9" x2="10" y2="15" /><line x1="14" y1="9" x2="14" y2="15" /></Svg> },
  { name: 'Smart Account', blurb: 'Programmable auth (signers + policies).', soon: true, icon: <Svg color="var(--muted3)"><circle cx="9" cy="8" r="3.5" /><path d="M3 20c0-3.3 2.7-6 6-6" /><circle cx="17.5" cy="16.5" r="3" /></Svg> },
]

type Protocol = { name: string; desc: string; initial: string; logo?: string; wide?: boolean; live?: boolean }
const EXISTING: Protocol[] = [
  { name: 'Soroswap', desc: 'DEX + liquidity aggregator. Best-price swaps (XLM/USDC).', initial: 'S', logo: '/logos/soroswap.svg', live: true },
  { name: 'Blend', desc: 'Lending / borrowing pools with backstop.', initial: 'B', logo: '/logos/blend.svg' },
  { name: 'Reflector', desc: 'Price oracle (SEP-40). Read-only, low risk.', initial: 'R', logo: '/logos/reflector.png' },
  { name: 'DeFindex', desc: 'Yield infrastructure: automated vault strategies.', initial: 'D', logo: '/logos/defindex.svg' },
  { name: 'Trustless Work', desc: 'Non-custodial milestone escrow in USDC.', initial: 'T', logo: '/logos/trustless-work.png' },
  { name: 'USDC (Stellar Asset Contract)', desc: 'The asset most flows touch. First-class citizen.', initial: '$', logo: '/logos/usdc.svg' },
  { name: 'x402', desc: 'HTTP-request payments / micropayments / agent payments.', initial: 'x', logo: '/logos/x402.svg', wide: true },
]

const SOON_PILL = (
  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--soon-ink)', background: 'var(--gold-soft)', border: '1.5px solid var(--soon-line)', borderRadius: 999, padding: '3px 10px' }}>SOON</span>
)
const LIVE_PILL = (
  <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--gink)', background: 'var(--gold)', border: '2px solid var(--ink)', borderRadius: 999, padding: '2px 10px' }}>LIVE</span>
)

function tabStyle(active: boolean): CSSProperties {
  return {
    padding: '9px 16px',
    borderRadius: 10,
    fontSize: 14.5,
    fontWeight: 600,
    cursor: 'pointer',
    color: active ? 'var(--ink)' : 'var(--muted2)',
    background: active ? 'var(--gold-soft)' : 'transparent',
    border: active ? '2px solid var(--ink)' : '2px solid transparent',
    transition: 'background .15s ease, color .15s ease',
  }
}

function ContractLibrary({ onCustom }: { onCustom: () => void }) {
  const [tab, setTab] = useState<'cfg' | 'ext' | 'cus'>('cfg')
  return (
    <div style={{ border: '2.5px solid var(--ink)', borderRadius: 22, background: 'var(--surface)', overflow: 'hidden', boxShadow: '6px 6px 0 var(--gold)' }}>
      <div style={{ display: 'flex', gap: 6, padding: '16px 18px', borderBottom: '2px solid var(--ink)', background: 'var(--bg)' }}>
        <div onClick={() => setTab('cfg')} style={tabStyle(tab === 'cfg')}>Configurable</div>
        <div onClick={() => setTab('ext')} style={tabStyle(tab === 'ext')}>Existing</div>
        <div onClick={() => setTab('cus')} style={tabStyle(tab === 'cus')}>Custom</div>
      </div>

      {tab === 'cfg' && (
        <div style={{ padding: 26 }}>
          <div style={{ fontSize: 14.5, color: 'var(--muted)', marginBottom: 22, fontWeight: 500 }}>Audited OpenZeppelin contracts for Soroban. Configure, then deploy.</div>
          <div className="st-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {CONFIGURABLE.map((c) =>
              c.soon ? (
                <div key={c.name} style={{ border: '2px dashed var(--line-soft)', borderRadius: 14, padding: 22, background: 'var(--surface2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    {c.icon}
                    {SOON_PILL}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 7, color: 'var(--muted2)' }}>{c.name}</div>
                  <div style={{ fontSize: 14.5, color: 'var(--muted3)', lineHeight: 1.5, fontWeight: 500 }}>{c.blurb}</div>
                </div>
              ) : (
                <div key={c.name} className="st-lift st-lift-yellow" style={{ border: '2px solid var(--ink)', borderRadius: 14, padding: 22, background: 'var(--surface)' }}>
                  <div style={{ marginBottom: 16 }}>{c.icon}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 7 }}>{c.name}</div>
                  <div style={{ fontSize: 14.5, color: 'var(--muted)', lineHeight: 1.5, fontWeight: 500 }}>{c.blurb}</div>
                </div>
              ),
            )}
          </div>
        </div>
      )}

      {tab === 'ext' && (
        <div style={{ padding: 26 }}>
          <div style={{ fontSize: 14.5, color: 'var(--muted)', marginBottom: 22, fontWeight: 500 }}>Connect to a live, audited protocol by its contract ID. Soroswap is live — more coming soon.</div>
          <div className="st-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {EXISTING.map((p) =>
              p.live ? (
                <div key={p.name} className="st-lift st-lift-yellow" style={{ border: '2px solid var(--ink)', borderRadius: 14, padding: 22, background: 'var(--surface)', gridColumn: p.wide ? '1 / -1' : undefined }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, border: '2px solid var(--ink)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ProtocolLogo logo={p.logo} name={p.name} size={26} fallback={<span style={{ color: 'var(--ink)', fontWeight: 800, fontSize: 16 }}>{p.initial}</span>} />
                    </div>
                    {LIVE_PILL}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 7 }}>{p.name}</div>
                  <div style={{ fontSize: 14.5, color: 'var(--muted)', lineHeight: 1.5, fontWeight: 500 }}>{p.desc}</div>
                </div>
              ) : (
                <div key={p.name} style={{ border: '2px dashed var(--line-soft)', borderRadius: 14, padding: 22, background: 'var(--surface2)', gridColumn: p.wide ? '1 / -1' : undefined }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, border: '2px solid var(--line-soft)', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.85 }}>
                      <ProtocolLogo logo={p.logo} name={p.name} size={26} fallback={<span style={{ color: 'var(--muted3)', fontWeight: 800, fontSize: 16 }}>{p.initial}</span>} />
                    </div>
                    {SOON_PILL}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 7, color: 'var(--muted2)' }}>{p.name}</div>
                  <div style={{ fontSize: 14.5, color: 'var(--muted3)', lineHeight: 1.5, fontWeight: 500 }}>{p.desc}</div>
                </div>
              ),
            )}
          </div>
        </div>
      )}

      {tab === 'cus' && (
        <div style={{ padding: '48px 26px 58px', textAlign: 'center' }}>
          <img src={MASCOT_EXPLAIN} alt="Stellita" width={90} className="st-pixelated" style={{ display: 'block', margin: '0 auto 20px' }} />
          <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Describe any contract in plain language</div>
          <div style={{ fontSize: 16, color: 'var(--muted)', maxWidth: 480, margin: '0 auto 26px', lineHeight: 1.55, fontWeight: 500 }}>
            Stellita generates the Soroban code, compiles it, and deploys it to testnet — so you can experiment with logic that no template covers.
          </div>
          <div onClick={onCustom} className="st-lift st-lift-dark-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: 'var(--gold)', color: 'var(--gink)', fontWeight: 700, fontSize: 15, padding: '12px 24px', borderRadius: 12, border: '2px solid var(--ink)', cursor: 'pointer', boxShadow: '4px 4px 0 var(--shadow)' }}>
            Generate a custom contract
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
          </div>
        </div>
      )}
    </div>
  )
}
