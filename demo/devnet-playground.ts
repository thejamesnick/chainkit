#!/usr/bin/env node
/**
 * ChainKit Demo — Devnet Playground
 *
 * Full devnet lifecycle in one script:
 *   1. Create wallet
 *   2. Airdrop 1 SOL (devnet only — throws on mainnet)
 *   3. Check balance
 *   4. Create a second wallet
 *   5. Transfer 0.1 SOL
 *   6. Verify both balances updated
 *   7. Fetch transaction history
 *
 * Providers used:
 *   @solana/web3.js  — all RPC calls, signed send
 *   Devnet public RPC — no API key needed
 *
 * Usage:
 *   npx tsx demo/devnet-playground.ts
 *   SOLANA_RPC_URL=https://api.devnet.solana.com npx tsx demo/devnet-playground.ts
 */

import { ChainKit } from '../src/index.js'

const RPC_URL = process.env.SOLANA_RPC_URL

function divider(char = '─', width = 60): string {
  return char.repeat(width)
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  console.log()
  console.log('⛓️  ChainKit — Devnet Playground')
  console.log(divider())
  console.log('This demo uses the Solana devnet. No real SOL needed.')
  console.log(divider())

  const kit = new ChainKit(
    RPC_URL
      ? { chain: 'solana', rpcUrl: RPC_URL }
      : { chain: 'solana', network: 'devnet' },
  )

  // ─── 1. Create two wallets ────────────────────────────────────────────────
  console.log('\n🔑 Step 1: Create two wallets')
  console.log(divider('─', 40))
  const sender = kit.createWallet()
  const receiver = kit.createWallet()
  console.log(`  Sender:   ${sender.publicKey}`)
  console.log(`  Receiver: ${receiver.publicKey}`)

  // ─── 2. Airdrop to sender ─────────────────────────────────────────────────
  console.log('\n🪂 Step 2: Airdrop 1 SOL to sender (devnet only)')
  console.log(divider('─', 40))
  console.log('  Requesting airdrop...')
  const airdrop = await kit.airdrop(sender.publicKey, 1)
  console.log(`  Signature: ${airdrop.signature}`)
  console.log(`  Amount:    ${airdrop.amount} SOL`)
  console.log('  Waiting for confirmation...')
  await sleep(5000)

  // ─── 3. Check sender balance ──────────────────────────────────────────────
  console.log('\n💰 Step 3: Check sender balance')
  console.log(divider('─', 40))
  const senderBefore = await kit.getBalances(sender.publicKey)
  console.log(`  Sender SOL: ${senderBefore.sol} SOL`)

  // ─── 4. Transfer to receiver ──────────────────────────────────────────────
  console.log('\n📤 Step 4: Transfer 0.1 SOL to receiver')
  console.log(divider('─', 40))
  console.log('  Sending transaction...')
  const txSig = await kit.transfer({
    from: sender,
    to: receiver.publicKey,
    amount: 0.1,
  })
  console.log(`  Signature: ${txSig}`)
  console.log('  Waiting for confirmation...')
  await sleep(5000)

  // ─── 5. Verify both balances ──────────────────────────────────────────────
  console.log('\n✅ Step 5: Verify balances updated')
  console.log(divider('─', 40))
  const [senderAfter, receiverAfter] = await Promise.all([
    kit.getBalances(sender.publicKey),
    kit.getBalances(receiver.publicKey),
  ])
  console.log(`  Sender before:   ${senderBefore.sol.toFixed(4)} SOL`)
  console.log(`  Sender after:    ${senderAfter.sol.toFixed(4)} SOL  (sent 0.1 + fee)`)
  console.log(`  Receiver after:  ${receiverAfter.sol.toFixed(4)} SOL  (received 0.1)`)

  // ─── 6. Account info ──────────────────────────────────────────────────────
  console.log('\n🔍 Step 6: Account info')
  console.log(divider('─', 40))
  const account = await kit.getAccount(sender.publicKey)
  console.log(`  Lamports: ${account.lamports.toLocaleString()}`)
  console.log(`  Owner:    ${account.owner || '11111111111111111111111111111111 (System Program)'}`)

  // ─── 7. Transaction history ───────────────────────────────────────────────
  console.log('\n📜 Step 7: Transaction history')
  console.log(divider('─', 40))
  const txns = await kit.getTransactions(sender.publicKey, { limit: 5 })
  for (const tx of txns) {
    const icon = tx.status === 'success' ? '✅' : '❌'
    console.log(`  ${icon}  ${tx.signature.slice(0, 16)}...  slot: ${tx.slot}  fee: ${tx.fee / 1e9} SOL`)
  }

  // ─── 8. Fetch single tx ───────────────────────────────────────────────────
  if (txns.length > 0) {
    console.log('\n🔎 Step 8: Single transaction detail')
    console.log(divider('─', 40))
    const detail = await kit.getTransaction(txns[0].signature)
    console.log(`  Signature:  ${detail.signature}`)
    console.log(`  Status:     ${detail.status}`)
    console.log(`  Slot:       ${detail.slot}`)
    console.log(`  Fee:        ${detail.fee / 1e9} SOL`)
    console.log(`  Timestamp:  ${detail.timestamp ? new Date(detail.timestamp * 1000).toISOString() : 'N/A'}`)
  }

  console.log()
  console.log(divider())
  console.log('✅ Devnet lifecycle complete. Powered by ChainKit.')
  console.log()
}

main().catch((err) => {
  console.error('\n❌ Error:', err.message ?? err)
  if (err.code) console.error('   Code:', err.code)
  if (err.code === 'MAINNET_AIRDROP') {
    console.error('   → Airdrop only works on devnet/testnet, not mainnet.')
    console.error('   → Use: npx tsx demo/devnet-playground.ts (no SOLANA_RPC_URL set)')
  }
  process.exit(1)
})
