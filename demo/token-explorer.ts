#!/usr/bin/env node
/**
 * ChainKit Demo — Token Explorer
 *
 * Full token profile: name, symbol, supply, price, decimals.
 * Shows how ChainKit combines @solana/web3.js + Metaplex + Jupiter in one call.
 *
 * Providers used:
 *   @solana/web3.js    — getTokenSupply
 *   Metaplex on-chain  — name, symbol, URI (PDA deserialization)
 *   Jupiter price API  — live USD price
 *
 * Usage:
 *   npx tsx demo/token-explorer.ts <mint>
 *   npx tsx demo/token-explorer.ts EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
 */

import { ChainKit } from '../src/index.js'

const RPC_URL = process.env.SOLANA_RPC_URL
const NETWORK = (process.env.SOLANA_NETWORK as 'mainnet-beta' | 'devnet' | 'testnet') ?? 'mainnet-beta'

// Default to USDC if no arg provided
const DEFAULT_MINTS = [
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',  // JUP
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
]

const MINTS = process.argv.slice(2).length > 0 ? process.argv.slice(2) : DEFAULT_MINTS

function divider(char = '─', width = 60): string {
  return char.repeat(width)
}

function fmt(n: number, d = 2): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
}

async function main() {
  console.log()
  console.log('⛓️  ChainKit — Token Explorer')
  console.log(divider())

  const kit = new ChainKit(
    RPC_URL
      ? { chain: 'solana', rpcUrl: RPC_URL }
      : { chain: 'solana', network: NETWORK },
  )

  for (const mint of MINTS) {
    console.log(`\nMint: ${mint}`)
    console.log(divider('─', 50))

    try {
      // Get token info (web3.js + Metaplex)
      const token = await kit.getToken(mint)

      console.log(`  Name:      ${token.name || '(no on-chain metadata)'}`)
      console.log(`  Symbol:    ${token.symbol || '—'}`)
      console.log(`  Decimals:  ${token.decimals}`)
      console.log(`  Supply:    ${fmt(token.supply / Math.pow(10, token.decimals), 0)}`)
      if (token.uri) {
        console.log(`  URI:       ${token.uri}`)
      }

      // Get live price (Jupiter)
      try {
        const price = await kit.getPrice(mint)
        const marketCap = (token.supply / Math.pow(10, token.decimals)) * price.price
        console.log(`  Price:     $${fmt(price.price, price.price < 0.001 ? 8 : 4)} USD`)
        if (marketCap > 0) {
          console.log(`  Market Cap: $${fmt(marketCap, 0)} USD`)
        }
      } catch {
        console.log(`  Price:     (unavailable on ${NETWORK})`)
      }
    } catch (err: any) {
      console.log(`  ❌ ${err.message}`)
      if (err.code) console.log(`     Code: ${err.code}`)
    }
  }

  console.log()
  console.log(divider())
  console.log('✅ Powered by ChainKit + @solana/web3.js + Metaplex + Jupiter')
  console.log()
}

main().catch((err) => {
  console.error('\n❌ Error:', err.message ?? err)
  process.exit(1)
})
