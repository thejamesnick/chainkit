/**
 * ChainKit Examples — Swap Quote
 *
 * Gets the best SOL → USDC swap quote via Jupiter.
 *
 * Usage:
 *   node --loader ts-node/esm examples/swap-quote.ts
 */

import { ChainKit } from '../src/index.js'

const kit = new ChainKit({ chain: 'solana', network: 'mainnet-beta' })

const SOL_MINT = 'So11111111111111111111111111111111111111112'
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'

console.log('\nFetching SOL → USDC swap quote for 1 SOL...')

const quote = await kit.getSwapQuote({
  inputMint: SOL_MINT,
  outputMint: USDC_MINT,
  amount: 1_000_000_000, // 1 SOL in lamports
})

const outUsdc = (quote.outAmount / 1e6).toFixed(2)
console.log(`\nSwap quote: 1 SOL → ${outUsdc} USDC`)
console.log(`Price impact: ${quote.priceImpactPct.toFixed(4)}%`)
console.log(`Slippage: ${quote.slippageBps / 100}%`)
