#!/usr/bin/env node
/**
 * ChainKit Demo — Portfolio Tracker
 *
 * Full portfolio tracker — every token a wallet holds + live USD value via Jupiter.
 * This is what `heliushack` did manually. Here it's 10 lines of ChainKit.
 *
 * Providers used:
 *   @solana/web3.js  — getBalance, getParsedTokenAccountsByOwner
 *   Jupiter price    — live USD price per token
 *   Metaplex         — token name/symbol on-chain
 *
 * Usage:
 *   npx tsx demo/portfolio-tracker.ts <address>
 *   SOLANA_RPC_URL=https://... npx tsx demo/portfolio-tracker.ts <address>
 */

import { ChainKit } from '../src/index.js'

const RPC_URL = process.env.SOLANA_RPC_URL
const NETWORK = (process.env.SOLANA_NETWORK as 'mainnet-beta' | 'devnet' | 'testnet') ?? 'mainnet-beta'
const ADDRESS = process.argv[2]

if (!ADDRESS) {
  console.error('Usage: npx tsx demo/portfolio-tracker.ts <wallet-address>')
  process.exit(1)
}

function divider(char = '─', width = 60): string {
  return char.repeat(width)
}

function fmt(n: number, d = 2): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
}

function bar(pct: number, width = 20): string {
  const filled = Math.round(pct * width)
  return '█'.repeat(filled) + '░'.repeat(width - filled)
}

async function main() {
  console.log()
  console.log('⛓️  ChainKit — Portfolio Tracker')
  console.log(divider())
  console.log(`Wallet: ${ADDRESS}`)
  console.log()

  const kit = new ChainKit(
    RPC_URL
      ? { chain: 'solana', rpcUrl: RPC_URL }
      : { chain: 'solana', network: NETWORK },
  )

  // Fetch balances
  process.stdout.write('  Fetching balances...')
  const balances = await kit.getBalances(ADDRESS)
  process.stdout.write(' done\n')

  // Gather all assets to price
  const SOL_MINT = 'So11111111111111111111111111111111111111112'
  const assets: Array<{ label: string; mint: string; amount: number; symbol: string }> = [
    { label: 'SOL', mint: SOL_MINT, amount: balances.sol, symbol: 'SOL' },
    ...balances.tokens
      .filter((t) => t.uiAmount > 0)
      .map((t) => ({
        label: t.symbol || t.mint.slice(0, 6) + '..',
        mint: t.mint,
        amount: t.uiAmount,
        symbol: t.symbol,
      })),
  ]

  // Fetch prices in parallel
  process.stdout.write(`  Fetching prices (${assets.length} assets)...`)
  const prices = await Promise.all(
    assets.map(async (a) => {
      try {
        const p = await kit.getPrice(a.mint)
        return p.price
      } catch {
        return 0
      }
    }),
  )
  process.stdout.write(' done\n\n')

  // Build portfolio rows
  const rows = assets.map((a, i) => ({
    ...a,
    priceUSD: prices[i],
    valueUSD: a.amount * prices[i],
  }))

  const totalUSD = rows.reduce((s, r) => s + r.valueUSD, 0)

  // Print table
  console.log(divider())
  console.log(
    '  Asset'.padEnd(12) +
    'Amount'.padStart(16) +
    'Price (USD)'.padStart(14) +
    'Value (USD)'.padStart(14) +
    '  Allocation',
  )
  console.log(divider())

  for (const row of rows.sort((a, b) => b.valueUSD - a.valueUSD)) {
    const pct = totalUSD > 0 ? row.valueUSD / totalUSD : 0
    const alloc = totalUSD > 0 ? `${bar(pct, 10)} ${(pct * 100).toFixed(1)}%` : '—'
    console.log(
      `  ${row.label.padEnd(10)}` +
      `${fmt(row.amount, 4).padStart(16)}` +
      `${row.priceUSD > 0 ? '$' + fmt(row.priceUSD, 2) : '—'.padStart(13)}`.padStart(14) +
      `${row.valueUSD > 0 ? '$' + fmt(row.valueUSD, 2) : '—'.padStart(13)}`.padStart(14) +
      `  ${alloc}`,
    )
  }

  console.log(divider())
  if (totalUSD > 0) {
    console.log(`  Total Portfolio Value: $${fmt(totalUSD, 2)}`)
  } else {
    console.log(`  (prices unavailable on ${NETWORK} — use mainnet-beta for USD values)`)
  }
  console.log(divider())
  console.log()
  console.log('✅ Powered by ChainKit + @solana/web3.js + Jupiter')
  console.log()
}

main().catch((err) => {
  console.error('\n❌ Error:', err.message ?? err)
  if (err.code) console.error('   Code:', err.code)
  process.exit(1)
})
