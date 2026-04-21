#!/usr/bin/env node
/**
 * ChainKit Demo — Wallet Generator
 *
 * Creates a new Solana wallet end-to-end:
 *   - BIP39 mnemonic generation
 *   - Keypair derivation
 *   - AES-256-GCM encrypted keyfile
 *   - QR code (saved as PNG)
 *   - Restore roundtrip to prove it works
 *
 * Providers used:
 *   @solana/web3.js  — Keypair
 *   bip39            — mnemonic
 *   ed25519-hd-key   — BIP44 derivation
 *   node:crypto      — AES-256-GCM keyfile encryption
 *   qrcode           — QR PNG export
 *
 * Usage:
 *   npx tsx demo/wallet-generator.ts [--password <pw>] [--output <dir>]
 */

import { ChainKit } from '../src/index.js'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { writeFile } from 'node:fs/promises'

// ─── Args ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const pwIdx = args.indexOf('--password')
const outIdx = args.indexOf('--output')
const PASSWORD = pwIdx !== -1 ? args[pwIdx + 1] : 'demo-password-change-me'
const OUTPUT_DIR = outIdx !== -1 ? args[outIdx + 1] : tmpdir()

function divider(char = '─', width = 60): string {
  return char.repeat(width)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log()
  console.log('⛓️  ChainKit — Wallet Generator')
  console.log(divider())

  const kit = new ChainKit({ chain: 'solana', network: 'mainnet-beta' })

  // ─── 1. Create wallet ─────────────────────────────────────────────────────
  console.log('\n🔑 Step 1: Generate new wallet')
  console.log(divider('─', 40))
  const wallet = kit.createWallet()
  console.log(`  Address:  ${wallet.publicKey}`)
  console.log(`  Mnemonic: ${wallet.mnemonic}`)
  console.log(`  ⚠️  Back up your mnemonic — it cannot be recovered!`)

  // ─── 2. Validate ──────────────────────────────────────────────────────────
  console.log('\n✅ Step 2: Validate')
  console.log(divider('─', 40))
  const addressValid = kit.wallet.isValid(wallet.publicKey)
  const mnemonicValid = kit.wallet.isMnemonic(wallet.mnemonic)
  console.log(`  Address valid:  ${addressValid ? '✅ yes' : '❌ no'}`)
  console.log(`  Mnemonic valid: ${mnemonicValid ? '✅ yes' : '❌ no'}`)

  // ─── 3. Export keyfile ────────────────────────────────────────────────────
  console.log('\n🔒 Step 3: Save encrypted keyfile')
  console.log(divider('─', 40))
  const keyfilePath = join(OUTPUT_DIR, `chainkit-wallet-${Date.now()}.json`)
  await kit.wallet.saveKeyfile(wallet, keyfilePath, PASSWORD)
  console.log(`  Keyfile: ${keyfilePath}`)
  console.log(`  Password: ${PASSWORD}`)
  console.log(`  Encryption: AES-256-GCM with scrypt key derivation`)

  // ─── 4. Export as base58 + array ──────────────────────────────────────────
  console.log('\n📤 Step 4: Key export formats')
  console.log(divider('─', 40))
  const base58Key = kit.wallet.exportBase58(wallet)
  const arrayKey = kit.wallet.exportArray(wallet)
  console.log(`  Base58:  ${base58Key.slice(0, 20)}...${base58Key.slice(-10)}  (${base58Key.length} chars)`)
  console.log(`  Array:   [${arrayKey.slice(0, 4).join(', ')}, ...] (${arrayKey.length} bytes)`)

  // ─── 5. QR code ───────────────────────────────────────────────────────────
  console.log('\n📱 Step 5: QR code')
  console.log(divider('─', 40))
  const qrPath = join(OUTPUT_DIR, `chainkit-wallet-${Date.now()}.png`)
  await kit.wallet.saveQR(wallet.publicKey, qrPath)
  const qrDataUrl = await kit.wallet.exportQR(wallet.publicKey)
  console.log(`  QR PNG saved: ${qrPath}`)
  console.log(`  Data URL: ${qrDataUrl.slice(0, 50)}...  (${qrDataUrl.length} chars)`)

  // ─── 6. Restore from mnemonic ─────────────────────────────────────────────
  console.log('\n🔄 Step 6: Restore from mnemonic')
  console.log(divider('─', 40))
  const restored = kit.restoreWallet(wallet.mnemonic)
  const match = restored.publicKey === wallet.publicKey
  console.log(`  Original:  ${wallet.publicKey}`)
  console.log(`  Restored:  ${restored.publicKey}`)
  console.log(`  Match: ${match ? '✅ identical' : '❌ MISMATCH'}`)

  // ─── 7. Restore from keyfile ──────────────────────────────────────────────
  console.log('\n🔓 Step 7: Decrypt keyfile')
  console.log(divider('─', 40))
  const fromFile = await kit.wallet.importKeyfile(keyfilePath, PASSWORD)
  const fileMatch = fromFile.publicKey === wallet.publicKey
  console.log(`  Decrypted: ${fromFile.publicKey}`)
  console.log(`  Match: ${fileMatch ? '✅ identical' : '❌ MISMATCH'}`)

  // ─── 8. BIP44 derivation ──────────────────────────────────────────────────
  console.log('\n🌱 Step 8: BIP44 derivation (different accounts, same seed)')
  console.log(divider('─', 40))
  const account0 = kit.wallet.derive(wallet.mnemonic, "m/44'/501'/0'/0'")
  const account1 = kit.wallet.derive(wallet.mnemonic, "m/44'/501'/1'/0'")
  const account2 = kit.wallet.derive(wallet.mnemonic, "m/44'/501'/2'/0'")
  console.log(`  Account 0: ${account0.publicKey}`)
  console.log(`  Account 1: ${account1.publicKey}`)
  console.log(`  Account 2: ${account2.publicKey}`)

  // ─── 9. fromBase58 roundtrip ──────────────────────────────────────────────
  console.log('\n🔁 Step 9: fromBase58 roundtrip')
  console.log(divider('─', 40))
  const fromB58 = kit.wallet.fromBase58(base58Key)
  const b58Match = fromB58.publicKey === wallet.publicKey
  console.log(`  Roundtrip: ${b58Match ? '✅ match' : '❌ MISMATCH'}`)

  console.log()
  console.log(divider())
  console.log(`✅ All wallet operations complete. Built with ChainKit.`)
  console.log()
}

main().catch((err) => {
  console.error('\n❌ Error:', err.message ?? err)
  if (err.code) console.error('   Code:', err.code)
  process.exit(1)
})
