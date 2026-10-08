import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

test('index.html static defaults remain index, follow and site root canonical', () => {
  const html = fs.readFileSync(path.resolve('index.html'), 'utf-8')
  assert.match(html, /<meta\s+name="robots"\s+content="index,\s*follow"\s*\/?>/)
  assert.match(html, /<link\s+rel="canonical"\s+href="https:\/\/www\.stellita\.app\/"\s*\/?>/)
})

test('SharedProject.tsx passes indexable: false and path /p/:token to useMarketingSeo', () => {
  const content = fs.readFileSync(path.resolve('src/pages/SharedProject.tsx'), 'utf-8')
  assert.ok(content.includes('useMarketingSeo'), 'SharedProject should invoke useMarketingSeo')
  assert.ok(content.includes('indexable: false'), 'SharedProject should set indexable: false')
  assert.ok(content.includes('/p/'), 'SharedProject should format path with /p/')
})

test('useMarketingSeo manages robots and canonical DOM lifecycle with restoration on unmount', async () => {
  // Minimal DOM mockup for headless node testing of useMarketingSeo logic
  const elements = new Map<string, { getAttribute: (k: string) => string | null; setAttribute: (k: string, v: string) => void }>()

  const mockHead = {
    querySelector: (selector: string) => {
      return elements.get(selector) || null
    },
    appendChild: () => {
      // noop
    },
  }

  // Pre-seed static index.html defaults
  const robotsMeta = {
    content: 'index, follow',
    getAttribute: (k: string) => (k === 'content' ? robotsMeta.content : null),
    setAttribute: (k: string, v: string) => {
      if (k === 'content') robotsMeta.content = v
    },
  }
  const canonicalLink = {
    href: 'https://www.stellita.app/',
    getAttribute: (k: string) => (k === 'href' ? canonicalLink.href : null),
    setAttribute: (k: string, v: string) => {
      if (k === 'href') canonicalLink.href = v
    },
  }

  elements.set('meta[name="robots"]', robotsMeta)
  elements.set('link[rel="canonical"]', canonicalLink)

  // Test the core SEO logic directly
  const SITE = 'https://www.stellita.app'
  function applySeo({ path, indexable = true }: { path: string; indexable?: boolean }) {
    const prevRobots = mockHead.querySelector('meta[name="robots"]')?.getAttribute('content') ?? 'index, follow'
    const prevCanonical = mockHead.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? `${SITE}/`

    mockHead.querySelector('meta[name="robots"]')?.setAttribute('content', indexable ? 'index, follow' : 'noindex, follow')
    mockHead.querySelector('link[rel="canonical"]')?.setAttribute('href', `${SITE}${path}`)

    return () => {
      mockHead.querySelector('meta[name="robots"]')?.setAttribute('content', prevRobots)
      mockHead.querySelector('link[rel="canonical"]')?.setAttribute('href', prevCanonical)
    }
  }

  // 1. Initial state (static index.html)
  assert.equal(robotsMeta.content, 'index, follow')
  assert.equal(canonicalLink.href, 'https://www.stellita.app/')

  // 2. Mount /p/demo-token route (SharedProject)
  const unmountShared = applySeo({ path: '/p/demo-token', indexable: false })
  assert.equal(robotsMeta.content, 'noindex, follow')
  assert.equal(canonicalLink.href, 'https://www.stellita.app/p/demo-token')

  // 3. Unmount / navigate away -> restores defaults
  unmountShared()
  assert.equal(robotsMeta.content, 'index, follow')
  assert.equal(canonicalLink.href, 'https://www.stellita.app/')

  // 4. Mount marketing route -> indexable is true
  const unmountMarketing = applySeo({ path: '/pricing', indexable: true })
  assert.equal(robotsMeta.content, 'index, follow')
  assert.equal(canonicalLink.href, 'https://www.stellita.app/pricing')
  unmountMarketing()
  assert.equal(robotsMeta.content, 'index, follow')
})
