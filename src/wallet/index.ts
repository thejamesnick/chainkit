import * as bip39 from 'bip39'
import { derivePath } from 'ed25519-hd-key'
import { Keypair, PublicKey, Transaction } from '@solana/web3.js'
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import * as QRCode from 'qrcode'
import bs58 from 'bs58'
import { ChainKitError } from '../core/errors.js'
import type { KeyfileExport, WalletResult } from '../types.js'

const DERIVATION_PATH = "m/44'/501'/0'/0'"
const SCRYPT_N = 16384
const SCRYPT_R = 8
const SCRYPT_P = 1
const KEY_LEN = 32

function deriveKeypairFromMnemonic(mnemonic: string, path = DERIVATION_PATH): Keypair {
  const seed = bip39.mnemonicToSeedSync(mnemonic)
  const { key } = derivePath(path, seed.toString('hex'))
  return Keypair.fromSeed(key)
}

// ─── Create ──────────────────────────────────────────────────────────────────

export function create(): WalletResult {
  const mnemonic = bip39.generateMnemonic()
  const keypair = deriveKeypairFromMnemonic(mnemonic)
  return {
    publicKey: keypair.publicKey.toBase58(),
    secretKey: keypair.secretKey,
    mnemonic,
  }
}

// ─── Restore ─────────────────────────────────────────────────────────────────

export function restore(mnemonic: string): WalletResult {
  if (!bip39.validateMnemonic(mnemonic)) {
    throw new ChainKitError('INVALID_MNEMONIC', 'Invalid BIP39 mnemonic phrase')
  }
  const keypair = deriveKeypairFromMnemonic(mnemonic)
  return {
    publicKey: keypair.publicKey.toBase58(),
    secretKey: keypair.secretKey,
    mnemonic,
  }
}

export function fromSecretKey(secretKey: Uint8Array): WalletResult {
  const keypair = Keypair.fromSecretKey(secretKey)
  return {
    publicKey: keypair.publicKey.toBase58(),
    secretKey: keypair.secretKey,
    mnemonic: '',
  }
}

export function fromBase58(base58PrivateKey: string): WalletResult {
  const bytes = bs58.decode(base58PrivateKey)
  return fromSecretKey(bytes)
}

// ─── Validate ────────────────────────────────────────────────────────────────

export function isValid(address: string): boolean {
  try {
    new PublicKey(address)
    return true
  } catch {
    return false
  }
}

export function isMnemonic(phrase: string): boolean {
  return bip39.validateMnemonic(phrase)
}

// ─── Export ──────────────────────────────────────────────────────────────────

export function exportBase58(wallet: WalletResult): string {
  return bs58.encode(wallet.secretKey)
}

export function exportArray(wallet: WalletResult): number[] {
  return Array.from(wallet.secretKey)
}

export function exportKeyfile(wallet: WalletResult, password: string): string {
  const salt = randomBytes(32)
  const iv = randomBytes(12)
  const key = scryptSync(password, salt, KEY_LEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P })
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const secretKeyBuffer = Buffer.from(wallet.secretKey)
  const encrypted = Buffer.concat([cipher.update(secretKeyBuffer), cipher.final()])
  const authTag = cipher.getAuthTag()

  const payload: KeyfileExport = {
    version: 1,
    address: wallet.publicKey,
    encrypted: Buffer.concat([encrypted, authTag]).toString('hex'),
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
  }
  return JSON.stringify(payload, null, 2)
}

export async function saveKeyfile(
  wallet: WalletResult,
  filePath: string,
  password: string,
): Promise<void> {
  const json = exportKeyfile(wallet, password)
  await writeFile(filePath, json, 'utf8')
}

export async function importKeyfile(filePath: string, password: string): Promise<WalletResult> {
  const raw = await readFile(filePath, 'utf8')
  const payload: KeyfileExport = JSON.parse(raw)

  const salt = Buffer.from(payload.salt, 'hex')
  const iv = Buffer.from(payload.iv, 'hex')
  const encryptedWithTag = Buffer.from(payload.encrypted, 'hex')
  const authTag = encryptedWithTag.subarray(encryptedWithTag.length - 16)
  const encrypted = encryptedWithTag.subarray(0, encryptedWithTag.length - 16)

  const key = scryptSync(password, salt, KEY_LEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P })
  try {
    const decipher = createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(authTag)
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
    return fromSecretKey(new Uint8Array(decrypted))
  } catch (err) {
    throw new ChainKitError('DECRYPTION_FAILED', 'Keyfile decryption failed — wrong password?', err)
  }
}

// ─── QR ──────────────────────────────────────────────────────────────────────

export async function exportQR(publicKey: string): Promise<string> {
  return QRCode.toDataURL(publicKey)
}

export async function saveQR(publicKey: string, filePath: string): Promise<void> {
  await QRCode.toFile(filePath, publicKey)
}

export async function exportMnemonicQR(mnemonic: string): Promise<string> {
  // WARNING: contains private key material — never share
  return QRCode.toDataURL(mnemonic)
}

// ─── Sign ─────────────────────────────────────────────────────────────────────

export function sign(transaction: Transaction, wallet: WalletResult): Transaction {
  const keypair = Keypair.fromSecretKey(wallet.secretKey)
  transaction.sign(keypair)
  return transaction
}

// ─── Derive ───────────────────────────────────────────────────────────────────

export function derive(mnemonic: string, path: string): WalletResult {
  if (!bip39.validateMnemonic(mnemonic)) {
    throw new ChainKitError('INVALID_MNEMONIC', 'Invalid BIP39 mnemonic phrase')
  }
  const keypair = deriveKeypairFromMnemonic(mnemonic, path)
  return {
    publicKey: keypair.publicKey.toBase58(),
    secretKey: keypair.secretKey,
    mnemonic,
  }
}

// ─── Vanity ───────────────────────────────────────────────────────────────────

export async function vanity(prefix: string): Promise<WalletResult> {
  const upperPrefix = prefix.toUpperCase()
  let attempts = 0
  while (true) {
    const mnemonic = bip39.generateMnemonic()
    const keypair = deriveKeypairFromMnemonic(mnemonic)
    const address = keypair.publicKey.toBase58()
    attempts++
    if (address.toUpperCase().startsWith(upperPrefix)) {
      return {
        publicKey: address,
        secretKey: keypair.secretKey,
        mnemonic,
      }
    }
    // Yield to event loop every 1000 attempts
    if (attempts % 1000 === 0) {
      await new Promise((r) => setTimeout(r, 0))
    }
  }
}
