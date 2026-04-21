#!/usr/bin/env node
/**
 * ChainKit Demo — Wallet Inspector
 *
 * Drop in any Solana address → see everything: SOL balance, all tokens, recent txns.
 * This is the #1 demo from DEMOS.md — the "show it works" showcase.
 *
 * Providers used:
 *   @solana/web3.js  — getBalance, getTokenAccounts, getTransactions
 *   Jupiter price    — live USD prices per token
 *   Metaplex         — token name/symbol from on-chain metadata
 *
 * Usage:
 *   npx tsx demo/wallet-inspector.ts <address>
 *   npx tsx demo/wallet-inspector.ts GsbwXfJraMomNxBcjYLcG3mxkBUiyWXAB8fck9eiHaWB
 */

import { ChainKit } from '../src/index.js'

// ─── Config ───────────────────────────────────────────────────────────────────

const RPC_URL = process.env.SOLANA_RPC_URL
const NETWORK = (process.env.SOLANA_NETWORK as 'mainnet-beta' | 'devnet' | 'testnet') ?? 'mainnet-beta'
const ADDRESS = process.argv[2]

if (!ADDRESS) {
  console.error('Usage: npx tsx demo/wallet-inspector.ts <wallet-address>')
  console.error('Example: npx tsx demo/wallet-inspector.ts GsbwXfJraMomNxBcjYLcG3mxkBUiyWXAB8fck9eiHaWB')
  process.exit(1)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number, decimals = 2): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function fmtUSD(n: number): string {
  return `$${fmt(n, 2)}`
}

function shortenSig(sig: string): string {
  return `${sig.slice(0, 8)}...${sig.slice(-8)}`
}

function ago(unixSeconds: number | null): string {
  if (!unixSeconds) return 'unknown'
  const diff = Math.floor(Date.now() / 1000) - unixSeconds
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function divider(char = '─', width = 60): string {
  return char.repeat(width)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log()
  console.log('⛓️  ChainKit — Wallet Inspector')
  console.log(divider())
  console.log(`Address: ${ADDRESS}`)
  console.log(`Network: ${NETWORK}${RPC_URL ? ` (${RPC_URL.slice(0, 40)}...)` : ' (public RPC)'}`)
  console.log(divider())

  // ─── Init ─────────────────────────────────────────────────────────────────
  const kit = new ChainKit(
    RPC_URL
      ? { chain: 'solana', rpcUrl: RPC_URL }
      : { chain: 'solana', network: NETWORK },
  )

  // ─── Balances ─────────────────────────────────────────────────────────────
  console.log('\n💰 Balances')
  console.log(divider('─', 40))

  let totalUSD = 0
  const balances = await kit.getBalances(ADDRESS)

  // Try to get SOL price
  let solPrice = 0
  try {
    const solMint = 'So11111111111111111111111111111111111111112'
    const priceResult = await kit.getPrice(solMint)
    solPrice = priceResult.price
  } catch {
    // Jupiter price unavailable on devnet — that's fine
  }

  const solUSD = balances.sol * solPrice
  totalUSD += solUSD
  console.log(
    `  SOL    ${fmt(balances.sol, 4).padStart(14)}` +
    (solPrice > 0 ? `   ${fmtUSD(solUSD).padStart(12)}` : ''),
  )

  if (balances.tokens.length > 0) {
    console.log()
    for (const token of balances.tokens) {
      if (token.uiAmount === 0) continue
      // Try to get token price
      let tokenUSD = 0
      try {
        const priceResult = await kit.getPrice(token.mint)
        tokenUSD = token.uiAmount * priceResult.price
        totalUSD += tokenUSD
      } catch {
        // Price not available for all tokens
      }

      const label = (token.symbol || token.mint.slice(0, 6) + '..').padEnd(8)
      console.log(
        `  ${label} ${fmt(token.uiAmount, token.decimals > 6 ? 2 : token.decimals).padStart(14)}` +
        (tokenUSD > 0 ? `   ${fmtUSD(tokenUSD).padStart(12)}` : ''),
      )
    }
  } else {
    console.log('  (no token accounts)')
  }

  if (totalUSD > 0) {
    console.log()
    console.log(divider('─', 40))
    console.log(`  Total                           ${fmtUSD(totalUSD).padStart(12)}`)
  }

  // ─── Account Info ─────────────────────────────────────────────────────────
  console.log('\n🔍 Account')
  console.log(divider('─', 40))
  const account = await kit.getAccount(ADDRESS)
  console.log(`  Lamports:   ${account.lamports.toLocaleString()}`)
  console.log(`  Owner:      ${account.owner || '(system)'}`)
  console.log(`  Executable: ${account.executable ? 'yes — this is a program' : 'no'}`)

  // ─── Transactions ─────────────────────────────────────────────────────────
  console.log('\n📜 Recent Transactions (last 10)')
  console.log(divider('─', 40))
  const txns = await kit.getTransactions(ADDRESS, { limit: 10 })

  if (txns.length === 0) {
    console.log('  (no transactions found)')
  } else {
    for (const tx of txns) {
      const status = tx.status === 'success' ? '✅' : '❌'
      const fee = `${tx.fee / 1e9} SOL fee`
      const ts = ago(tx.timestamp)
      console.log(`  ${status}  ${shortenSig(tx.signature)}   ${ts.padEnd(12)}  ${fee}`)
    }
  }

  console.log()
  console.log(divider())
  console.log(`✅ Done. Powered by ChainKit + @solana/web3.js + Jupiter`)
  console.log()
}

main().catch((err) => {
  console.error('\n❌ Error:', err.message ?? err)
  if (err.code) console.error('   Code:', err.code)
  process.exit(1)
})
