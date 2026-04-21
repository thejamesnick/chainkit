import { describe, expect, it } from 'vitest'
import { readFile, unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  create,
  derive,
  exportArray,
  exportBase58,
  exportKeyfile,
  fromBase58,
  fromSecretKey,
  importKeyfile,
  isMnemonic,
  isValid,
  restore,
  saveKeyfile,
} from '../wallet/index.js'

describe('create', () => {
  it('returns publicKey, secretKey, mnemonic', () => {
    const wallet = create()
    expect(wallet.publicKey).toBeTruthy()
    expect(wallet.secretKey).toBeInstanceOf(Uint8Array)
    expect(wallet.mnemonic.split(' ')).toHaveLength(12)
  })

  it('produces unique wallets', () => {
    const a = create()
    const b = create()
    expect(a.publicKey).not.toBe(b.publicKey)
    expect(a.mnemonic).not.toBe(b.mnemonic)
  })

  it('returns a valid Solana address', () => {
    const wallet = create()
    expect(isValid(wallet.publicKey)).toBe(true)
  })
})

describe('restore', () => {
  it('restores same keypair from same mnemonic', () => {
    const original = create()
    const restored = restore(original.mnemonic)
    expect(restored.publicKey).toBe(original.publicKey)
  })

  it('throws INVALID_MNEMONIC for garbage input', () => {
    expect(() => restore('not valid words here at all twelve count')).toThrow()
  })
})

describe('fromSecretKey', () => {
  it('reconstructs wallet from secret key bytes', () => {
    const original = create()
    const from = fromSecretKey(original.secretKey)
    expect(from.publicKey).toBe(original.publicKey)
  })
})

describe('fromBase58', () => {
  it('roundtrips with exportBase58', () => {
    const original = create()
    const b58 = exportBase58(original)
    const restored = fromBase58(b58)
    expect(restored.publicKey).toBe(original.publicKey)
  })
})

describe('isValid', () => {
  it('returns true for valid Solana address', () => {
    const wallet = create()
    expect(isValid(wallet.publicKey)).toBe(true)
  })

  it('returns false for invalid address', () => {
    expect(isValid('not-a-valid-address')).toBe(false)
    expect(isValid('')).toBe(false)
  })
})

describe('isMnemonic', () => {
  it('returns true for valid 12-word mnemonic', () => {
    const wallet = create()
    expect(isMnemonic(wallet.mnemonic)).toBe(true)
  })

  it('returns false for invalid phrase', () => {
    expect(isMnemonic('foo bar baz')).toBe(false)
  })
})

describe('exportKeyfile / importKeyfile roundtrip', () => {
  it('encrypts and decrypts secret key correctly', async () => {
    const original = create()
    const password = 'my-secret-password-123'
    const filePath = join(tmpdir(), `chainkit-test-${Date.now()}.json`)

    await saveKeyfile(original, filePath, password)
    const restored = await importKeyfile(filePath, password)

    expect(restored.publicKey).toBe(original.publicKey)

    // cleanup
    await unlink(filePath).catch(() => {})
  })

  it('throws DECRYPTION_FAILED with wrong password', async () => {
    const original = create()
    const filePath = join(tmpdir(), `chainkit-test-wrong-${Date.now()}.json`)
    await saveKeyfile(original, filePath, 'correct-password')

    await expect(importKeyfile(filePath, 'wrong-password')).rejects.toMatchObject({
      code: 'DECRYPTION_FAILED',
    })

    await unlink(filePath).catch(() => {})
  })

  it('exportKeyfile produces valid JSON', () => {
    const wallet = create()
    const json = exportKeyfile(wallet, 'test')
    const parsed = JSON.parse(json)
    expect(parsed.version).toBe(1)
    expect(parsed.address).toBe(wallet.publicKey)
    expect(typeof parsed.encrypted).toBe('string')
    expect(typeof parsed.salt).toBe('string')
    expect(typeof parsed.iv).toBe('string')
  })
})

describe('exportArray', () => {
  it('returns array of numbers', () => {
    const wallet = create()
    const arr = exportArray(wallet)
    expect(Array.isArray(arr)).toBe(true)
    expect(arr).toHaveLength(64)
    arr.forEach((n) => {
      expect(typeof n).toBe('number')
      expect(n).toBeGreaterThanOrEqual(0)
      expect(n).toBeLessThanOrEqual(255)
    })
  })
})

describe('derive', () => {
  it('derives consistent keypair from same mnemonic + path', () => {
    const wallet = create()
    const a = derive(wallet.mnemonic, "m/44'/501'/0'/0'")
    const b = derive(wallet.mnemonic, "m/44'/501'/0'/0'")
    expect(a.publicKey).toBe(b.publicKey)
  })

  it('produces different keypairs for different paths', () => {
    const wallet = create()
    const a = derive(wallet.mnemonic, "m/44'/501'/0'/0'")
    const b = derive(wallet.mnemonic, "m/44'/501'/1'/0'")
    expect(a.publicKey).not.toBe(b.publicKey)
  })

  it('throws INVALID_MNEMONIC for invalid mnemonic', () => {
    expect(() => derive('invalid mnemonic words here foo bar baz qux quux', "m/44'/501'/0'/0'")).toThrow()
  })
})
