import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/store'
import { LoginModal } from '../auth/LoginModal'
import { Nav, Footer, Eyebrow, YELLOW } from './shared'
import { useMarketingSeo } from './seo'
import './marketing.css'

type Tier = {
  name: string
  tagline: string
  price: string
  per?: string
  note: string
  cta: string
  features: string[]
  popular?: boolean
}

const TIERS: Tier[] = [
  {
    name: 'Hacker',
    tagline: 'For tinkering on testnet.',
    price: '$0',
    note: 'Free forever on testnet.',
    cta: 'Start free',
    features: ['Audited OpenZeppelin contracts', 'One-click testnet deploys', 'Live preview + version history', '1 active project'],
  },
  {
    name: 'Builder',
    tagline: 'For shipping real dApps.',
    price: '$20',
    per: '/mo',
    note: 'Includes $20 in credits every month.',
    cta: 'Get Builder',
    popular: true,
    features: ['Everything in Hacker', '$20 in monthly credits', 'Unlimited projects', 'Share & clone projects', 'Priority generation'],
  },
  {
    name: 'Studio',
    tagline: 'For teams building together.',
    price: 'Custom',
    note: 'Volume credits & support.',
    cta: 'Contact us',
    features: ['Everything in Builder', 'Team workspaces', 'Higher rate limits', 'Dedicated support'],
  },
]

const TOPUPS = ['+$10', '+$25', '+$50']

export function PricingPage() {
  useMarketingSeo({
    title: 'Pricing — Stellita',
    description:
      'Free to experiment, priced to ship. Everything runs on Stellar testnet so you can start for nothing. Upgrade when you are building for real.',
    path: '/pricing',
  })
  const navigate = useNavigate()
  const { user } = useAuth()
  const [showLogin, setShowLogin] = useState(false)
  const enter = () => (user ? navigate('/app') : setShowLogin(true))

  return (
    <div className="xlm-marketing" style={{ height: '100%', overflowY: 'auto' }}>
      <Nav active="pricing" signedIn={!!user} onSignIn={enter} />
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '90px 32px 40px' }}>
        <div className="xlm-fadeup" style={{ textAlign: 'center', marginBottom: 56 }}>
          <Eyebrow>PRICING</Eyebrow>
          <h1 className="xlm-h1" style={{ fontSize: 56, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 18px', lineHeight: 1.04 }}>
            Free to experiment.<br />Priced to ship.
          </h1>
          <p style={{ fontSize: 19, color: 'var(--muted)', maxWidth: 620, margin: '0 auto', lineHeight: 1.55, fontWeight: 500 }}>
            Everything runs on testnet, so you can start for nothing. Upgrade when you're building for real.
          </p>
        </div>

        <div className="xlm-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18, alignItems: 'start' }}>
          {TIERS.map((t) => (
            <div
              key={t.name}
              className="xlm-cardext"
              style={{
                position: 'relative',
                border: '2.5px solid var(--ink)',
                borderRadius: 22,
                padding: 32,
                background: t.popular ? 'var(--bg2)' : 'var(--surface)',
                boxShadow: t.popular ? '6px 6px 0 var(--gold)' : undefined,
              }}
            >
              {t.popular && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: YELLOW, color: 'var(--gink)', fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', padding: '5px 12px', borderRadius: 999, border: '2px solid var(--ink)' }}>
                  MOST POPULAR
                </div>
              )}
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>{t.name}</div>
              <div style={{ fontSize: 14.5, color: 'var(--muted)', marginBottom: 22, fontWeight: 500 }}>{t.tagline}</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 8 }}>
                <span style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.03em' }}>{t.price}</span>
                {t.per && <span style={{ fontSize: 17, color: 'var(--muted2)', marginBottom: 9, fontWeight: 500 }}>{t.per}</span>}
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--muted2)', marginBottom: 22, fontWeight: 500 }}>{t.note}</div>
              <div
                onClick={enter}
                className={t.popular ? 'xlm-pill' : 'xlm-soft'}
                style={{
                  textAlign: 'center',
                  fontSize: 15,
                  fontWeight: 700,
                  padding: '12px 0',
                  borderRadius: 12,
                  cursor: 'pointer',
                  marginBottom: 26,
                  background: t.popular ? YELLOW : 'var(--surface)',
                  color: t.popular ? 'var(--gink)' : 'var(--ink)',
                  border: '2px solid var(--ink)',
                  boxShadow: t.popular ? '3px 3px 0 var(--shadow)' : undefined,
                }}
              >
                {t.cta}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                {t.features.map((f) => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14.5, color: 'var(--muted)', fontWeight: 500 }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={'var(--gold-dk)'} strokeWidth="2.8" style={{ marginTop: 1, flexShrink: 0 }}><polyline points="20 6 9 17 4 12" /></svg>
                    {f}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Credits */}
        <div style={{ marginTop: 28, border: '2.5px solid var(--ink)', borderRadius: 22, background: 'var(--surface)', padding: 32, display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', justifyContent: 'space-between', boxShadow: '6px 6px 0 var(--shadow)' }}>
          <div style={{ maxWidth: 560 }}>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Runs on credits — top up anytime</div>
            <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.55, margin: 0, fontWeight: 500 }}>
              Every prompt, generation and deploy spends credits. Builder includes <span style={{ color: 'var(--ink)', fontWeight: 700 }}>$20 in credits each month</span>; add more whenever you need them.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {TOPUPS.map((t) => (
              <div key={t} className="xlm-soft" style={{ border: '2px solid var(--ink)', borderRadius: 12, padding: '11px 18px', fontSize: 15, fontWeight: 700, color: 'var(--ink)', background: 'var(--surface)', cursor: 'pointer' }}>{t}</div>
            ))}
            <div onClick={enter} className="xlm-pill" style={{ background: YELLOW, color: 'var(--gink)', borderRadius: 12, padding: '11px 20px', fontSize: 15, fontWeight: 700, border: '2px solid var(--ink)', boxShadow: '3px 3px 0 var(--shadow)', cursor: 'pointer' }}>Buy credits</div>
          </div>
        </div>
      </div>
      <Footer />
      {showLogin && <LoginModal onClose={() => { setShowLogin(false); navigate('/app') }} />}
    </div>
  )
}
