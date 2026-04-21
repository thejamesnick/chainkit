/**
 * ChainKit Examples — Devnet Playground
 *
 * Spins up a funded devnet wallet and checks balance.
 *
 * Usage:
 *   node --loader ts-node/esm examples/devnet-playground.ts
 */

import { ChainKit } from '../src/index.js'

const kit = new ChainKit({ chain: 'solana', network: 'devnet' })

// 1. Create wallet
const wallet = kit.createWallet()
console.log('\n🚀 Devnet wallet created:', wallet.publicKey)

// 2. Airdrop
console.log('Requesting 1 SOL airdrop on devnet...')
const airdrop = await kit.airdrop(wallet.publicKey, 1)
console.log('Airdrop signature:', airdrop.signature)

// 3. Wait for confirmation
console.log('Waiting for confirmation...')
await new Promise((r) => setTimeout(r, 5000))

// 4. Check balance
const balances = await kit.getBalances(wallet.publicKey)
console.log(`\nSOL balance: ${balances.sol} SOL`)
