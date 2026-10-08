import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

interface BudgetConfig {
  maxEntryChunkBytes: number
  maxTotalJsBytes: number
  baseline?: {
    entryChunkBytes?: number
    totalJsBytes?: number
    chunks?: Record<string, number>
  }
}

function formatBytes(bytes: number): string {
  return `${(bytes / 1024).toFixed(2)} kB (${bytes.toLocaleString()} bytes)`
}

function formatDelta(deltaBytes: number): string {
  const sign = deltaBytes >= 0 ? '+' : ''
  return `${sign}${(deltaBytes / 1024).toFixed(2)} kB`
}

async function main() {
  const budgetPath = path.join(__dirname, 'bundle-budget.json')
  if (!fs.existsSync(budgetPath)) {
    console.error(`❌ Budget file missing at ${budgetPath}`)
    process.exit(1)
  }

  const budget: BudgetConfig = JSON.parse(fs.readFileSync(budgetPath, 'utf8'))
  const distDir = path.join(rootDir, 'dist')
  const assetsDir = path.join(distDir, 'assets')

  if (!fs.existsSync(assetsDir)) {
    console.error('❌ dist/assets not found. Run `pnpm build` first.')
    process.exit(1)
  }

  const htmlPath = path.join(distDir, 'index.html')
  let entryFilename = ''
  if (fs.existsSync(htmlPath)) {
    const html = fs.readFileSync(htmlPath, 'utf8')
    const match = html.match(/src=["']\/?assets\/(index-[^"']+\.js)["']/)
    if (match) {
      entryFilename = match[1]
    }
  }

  const files = fs.readdirSync(assetsDir).filter(f => f.endsWith('.js'))
  if (files.length === 0) {
    console.error('❌ No JavaScript assets found in dist/assets.')
    process.exit(1)
  }

  if (!entryFilename) {
    // Fallback: pick the largest index-*.js or the largest JS file
    const indexFiles = files.filter(f => f.startsWith('index-'))
    entryFilename = indexFiles.length > 0 ? indexFiles[0] : files[0]
  }

  let totalJsBytes = 0
  let entryChunkBytes = 0
  const chunkRows: { name: string; size: number; isEntry: boolean }[] = []

  for (const file of files) {
    const filePath = path.join(assetsDir, file)
    const stat = fs.statSync(filePath)
    const size = stat.size
    totalJsBytes += size

    const isEntry = file === entryFilename
    if (isEntry) {
      entryChunkBytes = size
    }

    chunkRows.push({ name: file, size, isEntry })
  }

  // Sort descending by size
  chunkRows.sort((a, b) => b.size - a.size)

  const baselineEntry = budget.baseline?.entryChunkBytes ?? entryChunkBytes
  const baselineTotal = budget.baseline?.totalJsBytes ?? totalJsBytes

  const entryDelta = entryChunkBytes - baselineEntry
  const totalDelta = totalJsBytes - baselineTotal

  const entryExceeded = entryChunkBytes > budget.maxEntryChunkBytes
  const totalExceeded = totalJsBytes > budget.maxTotalJsBytes
  const failed = entryExceeded || totalExceeded

  // Build markdown table
  let md = '### 📦 Client Bundle Size Check\n\n'
  md += '| Chunk | Size | Delta vs Baseline | Status |\n'
  md += '| :--- | :--- | :--- | :--- |\n'

  for (const c of chunkRows) {
    const label = c.isEntry ? `**${c.name} (entry)**` : `\`${c.name}\``
    const deltaStr = c.isEntry ? formatDelta(entryDelta) : '-'
    const status = c.isEntry
      ? (entryExceeded ? `❌ Exceeds budget (${formatBytes(budget.maxEntryChunkBytes)})` : `✅ Under budget (${formatBytes(budget.maxEntryChunkBytes)})`)
      : '✅ Emitted'
    md += `| ${label} | ${formatBytes(c.size)} | ${deltaStr} | ${status} |\n`
  }

  md += `| **Total Initial JS** | **${formatBytes(totalJsBytes)}** | **${formatDelta(totalDelta)}** | ${totalExceeded ? `❌ Exceeds budget (${formatBytes(budget.maxTotalJsBytes)})` : `✅ Under budget (${formatBytes(budget.maxTotalJsBytes)})`} |\n\n`

  console.log('\n========================================')
  console.log('       CLIENT BUNDLE BUDGET REPORT       ')
  console.log('========================================')
  for (const c of chunkRows) {
    const tag = c.isEntry ? ' [ENTRY]' : ''
    console.log(`- ${c.name}${tag}: ${formatBytes(c.size)}`)
  }
  console.log('----------------------------------------')
  console.log(`Total JS Size:    ${formatBytes(totalJsBytes)} (Budget: ${formatBytes(budget.maxTotalJsBytes)}, Delta: ${formatDelta(totalDelta)})`)
  console.log(`Entry Chunk Size: ${formatBytes(entryChunkBytes)} (Budget: ${formatBytes(budget.maxEntryChunkBytes)}, Delta: ${formatDelta(entryDelta)})`)
  console.log('========================================\n')

  // Write to GitHub Step Summary if running in CI
  const stepSummaryFile = process.env.GITHUB_STEP_SUMMARY
  if (stepSummaryFile) {
    try {
      fs.appendFileSync(stepSummaryFile, md, 'utf8')
    } catch (e) {
      console.warn('Could not write to GITHUB_STEP_SUMMARY:', e)
    }
  }

  if (failed) {
    console.error('❌ BUNDLE BUDGET CHECK FAILED:')
    if (entryExceeded) {
      console.error(`  - Entry chunk ${entryFilename} is ${formatBytes(entryChunkBytes)}, exceeding max allowed ${formatBytes(budget.maxEntryChunkBytes)}`)
    }
    if (totalExceeded) {
      console.error(`  - Total JS is ${formatBytes(totalJsBytes)}, exceeding max allowed ${formatBytes(budget.maxTotalJsBytes)}`)
    }
    process.exit(1)
  }

  console.log('✅ All bundle size checks passed within budget limits.\n')
}

main().catch(err => {
  console.error('Unexpected error in bundle budget check:', err)
  process.exit(1)
})
