/**
 * ChainKit Examples — Portfolio Tracker
 *
 * Shows all token balances and SOL for a wallet.
 *
 * Usage:
 *   SOLANA_RPC_URL=https://... node --loader ts-node/esm examples/portfolio.ts
 *
 * Or against devnet (no RPC URL needed):
 *   node --loader ts-node/esm examples/portfolio.ts
 */

import { ChainKit } from '../src/index.js'

const WALLET = process.env.WALLET_ADDRESS ?? 'GsbwXfJraMomNxBcjYLcG3mxkBUiyWXAB8fck9eiHaWB'

const kit = new ChainKit({
  chain: 'solana',
  rpcUrl: process.env.SOLANA_RPC_URL,
  network: process.env.SOLANA_RPC_URL ? undefined : 'mainnet-beta',
})

const balances = await kit.getBalances(WALLET)

console.log(`\nWallet: ${WALLET}`)
console.log(`SOL: ${balances.sol}`)
console.log(`\nTokens (${balances.tokens.length}):`)
for (const token of balances.tokens) {
  console.log(`  ${token.mint}: ${token.uiAmount} (${token.decimals} decimals)`)
}
