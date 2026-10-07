/**
 * Static template list for the landing/app badges. Hardcoded (no fetch) so the
 * badges never flicker — each links straight to its read-only shared preview at
 * /p/:token. Tokens are the permanent public share tokens of the seeded system
 * templates (info@xlmcode.dev). If templates are ever re-seeded, update these.
 */
export interface StaticTemplate {
  name: string
  kind: 'token' | 'nft' | 'swap'
  token: string
}

export const TEMPLATES: StaticTemplate[] = [
  { name: 'Fungible Token', kind: 'token', token: '2e723a14bb91bd6524aaa1432ca78a9c' },
  { name: 'NFT Collection', kind: 'nft', token: '130ccca599d13140f5b753e8a7eb96d2' },
  { name: 'Token Swap', kind: 'swap', token: '8dc25344c07b65686216767467e23359' },
]
