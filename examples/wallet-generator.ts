/**
 * ChainKit Examples — Wallet Generator
 *
 * Creates a new Solana wallet, saves an encrypted keyfile, and exports QR.
 *
 * Usage:
 *   node --loader ts-node/esm examples/wallet-generator.ts
 */

import { ChainKit } from '../src/index.js'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const kit = new ChainKit({ chain: 'solana', network: 'devnet' })

// 1. Create wallet
const wallet = kit.createWallet()
console.log('\n✅ Wallet created!')
console.log('Address:', wallet.publicKey)
console.log('Mnemonic:', wallet.mnemonic)
console.log('\n⚠️  Back up your mnemonic — it cannot be recovered!')

// 2. Save encrypted keyfile
const keyfilePath = join(tmpdir(), `wallet-${Date.now()}.json`)
await kit.wallet.saveKeyfile(wallet, keyfilePath, 'my-strong-password')
console.log(`\n🔑 Keyfile saved to: ${keyfilePath}`)

// 3. Export QR code (public address only — safe to share)
const qr = await kit.wallet.exportQR(wallet.publicKey)
console.log('\n📱 QR (data URL):', qr.slice(0, 60) + '...')

// 4. Verify restore works
const restored = await kit.wallet.importKeyfile(keyfilePath, 'my-strong-password')
console.log('\n✅ Keyfile restore verified. Address matches:', restored.publicKey === wallet.publicKey)
