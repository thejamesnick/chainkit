#!/usr/bin/env node
/**
 * ChainKit Demo — Swap Quote Widget
 *
 * Best swap price across all Solana DEXs via Jupiter.
 * Shows the full quote flow: inputMint → outputMint → best route + price impact.
 *
 * Providers used:
 *   Jupiter quote API — https://quote-api.jup.ag/v6/quote
 *   Jupiter price API — https://price.jup.ag/v4/price
 *
 * Usage:
 *   npx tsx demo/swap-quote.ts [inputMint] [outputMint] [amount-in-lamports]
 *
 *   # Default: 1 SOL → USDC
 *   npx tsx demo/swap-quote.ts
 *
 *   # Custom: 0.5 SOL → USDC
 *   npx tsx demo/swap-quote.ts \
 *     So11111111111111111111111111111111111111112 \
 *     EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
 *     500000000
 */

import { ChainKit } from '../src/index.js'

// Defaults: 1 SOL → USDC
const SOL_MINT = 'So11111111111111111111111111111111111111112'
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const JUP_MINT = 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN'
const BONK_MINT = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'

const INPUT_MINT = process.argv[2] ?? SOL_MINT
const OUTPUT_MINT = process.argv[3] ?? USDC_MINT
const AMOUNT = Number(process.argv[4] ?? 1_000_000_000) // default 1 SOL

function divider(char = '─', width = 60): string {
  return char.repeat(width)
}

function fmt(n: number, d = 2): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
}

const KNOWN_TOKENS: Record<string, { symbol: string; decimals: number }> = {
  [SOL_MINT]: { symbol: 'SOL', decimals: 9 },
  [USDC_MINT]: { symbol: 'USDC', decimals: 6 },
  [JUP_MINT]: { symbol: 'JUP', decimals: 6 },
  [BONK_MINT]: { symbol: 'BONK', decimals: 5 },
}

function tokenLabel(mint: string): string {
  return KNOWN_TOKENS[mint]?.symbol ?? mint.slice(0, 8) + '...'
}

function toUi(amount: number, mint: string): number {
  const decimals = KNOWN_TOKENS[mint]?.decimals ?? 9
  return amount / Math.pow(10, decimals)
}

async function main() {
  console.log()
  console.log('⛓️  ChainKit — Swap Quote Widget')
  console.log(divider())
  console.log(`  Pair:   ${tokenLabel(INPUT_MINT)} → ${tokenLabel(OUTPUT_MINT)}`)
  console.log(`  Amount: ${fmt(toUi(AMOUNT, INPUT_MINT), 4)} ${tokenLabel(INPUT_MINT)}`)
  console.log()

  const kit = new ChainKit({ chain: 'solana', network: 'mainnet-beta' })

  // ─── Multiple quotes side by side ────────────────────────────────────────
  const PAIRS = [
    { input: SOL_MINT, output: USDC_MINT, amount: AMOUNT, label: 'SOL → USDC' },
    { input: SOL_MINT, output: JUP_MINT, amount: AMOUNT, label: 'SOL → JUP ' },
    { input: SOL_MINT, output: BONK_MINT, amount: AMOUNT, label: 'SOL → BONK' },
  ]

  // Only run the requested pair if custom args provided, otherwise show all 3
  const pairsToShow =
    process.argv[2]
      ? [{ input: INPUT_MINT, output: OUTPUT_MINT, amount: AMOUNT, label: `${tokenLabel(INPUT_MINT)} → ${tokenLabel(OUTPUT_MINT)}` }]
      : PAIRS

  console.log(divider('─', 40))
  console.log(
    '  Pair'.padEnd(16) +
    'In'.padStart(14) +
    'Out'.padStart(16) +
    'Impact'.padStart(10) +
    'Slippage'.padStart(10),
  )
  console.log(divider('─', 40))

  for (const pair of pairsToShow) {
    try {
      const quote = await kit.getSwapQuote({
        inputMint: pair.input,
        outputMint: pair.output,
        amount: pair.amount,
        slippageBps: 50,
      })
      const inUi = toUi(quote.inAmount, pair.input)
      const outUi = toUi(quote.outAmount, pair.output)
      const outLabel = tokenLabel(pair.output)
      console.log(
        `  ${pair.label.padEnd(14)}` +
        `${fmt(inUi, 4).padStart(14)}` +
        `${fmt(outUi, 4).padStart(14)} ${outLabel.padEnd(5)}` +
        `${(quote.priceImpactPct * 100).toFixed(4).padStart(8)}%` +
        `${(quote.slippageBps / 100).toFixed(2).padStart(8)}%`,
      )
    } catch (err: any) {
      console.log(`  ${pair.label.padEnd(14)}  ❌ ${err.message}`)
    }
  }

  console.log(divider('─', 40))

  // ─── Live prices ──────────────────────────────────────────────────────────
  console.log('\n💵 Live prices (Jupiter)')
  console.log(divider('─', 40))
  const priceMints = [SOL_MINT, USDC_MINT, JUP_MINT, BONK_MINT]
  for (const mint of priceMints) {
    try {
      const p = await kit.getPrice(mint)
      const label = tokenLabel(mint).padEnd(8)
      console.log(`  ${label}  $${fmt(p.price, p.price < 0.01 ? 8 : 4)}`)
    } catch {
      console.log(`  ${tokenLabel(mint).padEnd(8)}  (unavailable)`)
    }
  }

  console.log()
  console.log(divider())
  console.log('✅ Powered by ChainKit + Jupiter')
  console.log()
}

main().catch((err) => {
  console.error('\n❌ Error:', err.message ?? err)
  if (err.code) console.error('   Code:', err.code)
  process.exit(1)
})
