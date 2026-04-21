#!/usr/bin/env node
/**
 * ChainKit Demo — Transaction Feed
 *
 * Live transaction stream for any wallet — status, fee, timestamp, type.
 * Demonstrates pagination with before/until cursors.
 *
 * Providers used:
 *   @solana/web3.js  — getSignaturesForAddress + getParsedTransaction
 *
 * Usage:
 *   npx tsx demo/transaction-feed.ts <address> [--limit <n>]
 */

import { ChainKit } from '../src/index.js'

const RPC_URL = process.env.SOLANA_RPC_URL
const NETWORK = (process.env.SOLANA_NETWORK as 'mainnet-beta' | 'devnet' | 'testnet') ?? 'mainnet-beta'
const ADDRESS = process.argv[2]
const limitIdx = process.argv.indexOf('--limit')
const LIMIT = limitIdx !== -1 ? Number(process.argv[limitIdx + 1]) : 20

if (!ADDRESS) {
  console.error('Usage: npx tsx demo/transaction-feed.ts <wallet-address> [--limit <n>]')
  process.exit(1)
}

function divider(char = '─', width = 70): string {
  return char.repeat(width)
}

function ago(ts: number | null): string {
  if (!ts) return 'unknown'
  const diff = Math.floor(Date.now() / 1000) - ts
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

async function main() {
  console.log()
  console.log('⛓️  ChainKit — Transaction Feed')
  console.log(divider())
  console.log(`Wallet: ${ADDRESS}`)
  console.log(`Limit:  ${LIMIT}`)
  console.log()

  const kit = new ChainKit(
    RPC_URL
      ? { chain: 'solana', rpcUrl: RPC_URL }
      : { chain: 'solana', network: NETWORK },
  )

  console.log(divider('─', 70))
  console.log(
    '  Status  Signature'.padEnd(30) +
    'Slot'.padStart(12) +
    'Fee (SOL)'.padStart(12) +
    'Time'.padStart(14),
  )
  console.log(divider('─', 70))

  // ─── Page 1 ───────────────────────────────────────────────────────────────
  const page1 = await kit.getTransactions(ADDRESS, { limit: Math.min(LIMIT, 10) })

  if (page1.length === 0) {
    console.log('  (no transactions found)')
  } else {
    for (const tx of page1) {
      const icon = tx.status === 'success' ? '✅' : '❌'
      const sig = `${tx.signature.slice(0, 12)}...${tx.signature.slice(-8)}`
      const fee = (tx.fee / 1e9).toFixed(6)
      console.log(
        `  ${icon}  ${sig.padEnd(24)}` +
        `${String(tx.slot).padStart(12)}` +
        `${fee.padStart(12)}` +
        `${ago(tx.timestamp).padStart(14)}`,
      )
    }

    // ─── Page 2 (pagination demo) ─────────────────────────────────────────
    if (LIMIT > 10 && page1.length === 10) {
      const lastSig = page1[page1.length - 1].signature
      console.log(divider('─', 70))
      console.log(`  [paginating before ${lastSig.slice(0, 12)}...]`)
      console.log(divider('─', 70))

      const page2 = await kit.getTransactions(ADDRESS, {
        limit: Math.min(LIMIT - 10, 10),
        before: lastSig,
      })

      for (const tx of page2) {
        const icon = tx.status === 'success' ? '✅' : '❌'
        const sig = `${tx.signature.slice(0, 12)}...${tx.signature.slice(-8)}`
        const fee = (tx.fee / 1e9).toFixed(6)
        console.log(
          `  ${icon}  ${sig.padEnd(24)}` +
          `${String(tx.slot).padStart(12)}` +
          `${fee.padStart(12)}` +
          `${ago(tx.timestamp).padStart(14)}`,
        )
      }
    }
  }

  console.log(divider('─', 70))

  // ─── Single tx detail ─────────────────────────────────────────────────────
  if (page1.length > 0) {
    const sig = page1[0].signature
    console.log(`\n🔍 Detail: ${sig}`)
    console.log(divider('─', 50))
    const detail = await kit.getTransaction(sig)
    console.log(`  Status:    ${detail.status}`)
    console.log(`  Slot:      ${detail.slot}`)
    console.log(`  Fee:       ${detail.fee} lamports (${detail.fee / 1e9} SOL)`)
    console.log(`  Timestamp: ${detail.timestamp ? new Date(detail.timestamp * 1000).toISOString() : 'N/A'}`)
  }

  console.log()
  console.log(divider())
  console.log('✅ Powered by ChainKit + @solana/web3.js')
  console.log()
}

main().catch((err) => {
  console.error('\n❌ Error:', err.message ?? err)
  if (err.code) console.error('   Code:', err.code)
  process.exit(1)
})
