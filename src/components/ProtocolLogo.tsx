import { useState, type ReactNode } from 'react'
import soroswapRaw from '../../public/logos/soroswap.svg?raw'
import defindexRaw from '../../public/logos/defindex.svg?raw'

/**
 * Protocol logo used in the contract catalogs (project picker + landing library).
 *
 * Soroswap and DeFindex ship as wordmark SVGs whose text is `currentColor`, so
 * we render them INLINE and drive the color from the theme (`var(--ink)` →
 * black in light, cream in dark). An <img> can't inherit page CSS, which is why
 * those two looked white-on-white in light mode. Every other logo is a plain
 * <img>; a load failure falls back to the line icon.
 */
const INLINE_SVG: Record<string, string> = {
  '/logos/soroswap.svg': soroswapRaw,
  '/logos/defindex.svg': defindexRaw,
}

export function ProtocolLogo({
  logo,
  name,
  size = 26,
  fallback,
}: {
  logo?: string
  name: string
  size?: number
  fallback: ReactNode
}) {
  const [failed, setFailed] = useState(false)
  const inline = logo ? INLINE_SVG[logo] : undefined

  if (inline) {
    return (
      <span
        role="img"
        aria-label={name}
        className="stx-inline-logo"
        style={{ color: 'var(--ink)', display: 'inline-flex', width: size, height: size }}
        dangerouslySetInnerHTML={{ __html: inline }}
      />
    )
  }

  if (logo && !failed) {
    return (
      <img
        src={logo}
        alt={name}
        width={size}
        height={size}
        style={{ objectFit: 'contain' }}
        onError={() => setFailed(true)}
      />
    )
  }

  return <>{fallback}</>
}
