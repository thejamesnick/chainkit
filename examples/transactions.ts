/**
 * ChainKit Examples — Transaction History
 *
 * Fetches and displays recent transactions for a wallet.
 *
 * Usage:
 *   WALLET_ADDRESS=... node --loader ts-node/esm examples/transactions.ts
 */

import { ChainKit } from '../src/index.js'

const WALLET = process.env.WALLET_ADDRESS ?? 'GsbwXfJraMomNxBcjYLcG3mxkBUiyWXAB8fck9eiHaWB'

const kit = new ChainKit({
  chain: 'solana',
  rpcUrl: process.env.SOLANA_RPC_URL,
  network: process.env.SOLANA_RPC_URL ? undefined : 'mainnet-beta',
})

console.log(`\nFetching last 5 transactions for ${WALLET}...\n`)

const txns = await kit.getTransactions(WALLET, { limit: 5 })

for (const tx of txns) {
  const status = tx.status === 'success' ? '✅' : '❌'
  const ts = tx.timestamp ? new Date(tx.timestamp * 1000).toISOString() : 'unknown'
  console.log(`${status} ${tx.signature.slice(0, 16)}...  slot: ${tx.slot}  fee: ${tx.fee} lamports  ${ts}`)
}
