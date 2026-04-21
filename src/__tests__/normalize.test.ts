import { describe, expect, it } from 'vitest'
import {
  normalizeAccount,
  normalizeBalances,
  normalizeToken,
  normalizeTokenAccount,
  normalizeTx,
} from '../core/normalize.js'
import { PublicKey } from '@solana/web3.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeTokenAccountsResponse(accounts: unknown[]) {
  return {
    value: accounts,
    context: { slot: 1 },
  } as any
}

// ─── normalizeBalances ────────────────────────────────────────────────────────

describe('normalizeBalances', () => {
  it('converts lamports to SOL', () => {
    const result = normalizeBalances(2_000_000_000, makeTokenAccountsResponse([]))
    expect(result.sol).toBe(2)
  })

  it('returns empty tokens array when no token accounts', () => {
    const result = normalizeBalances(0, makeTokenAccountsResponse([]))
    expect(result.tokens).toEqual([])
  })

  it('normalizes token accounts', () => {
    const fakeTokenAccount = {
      pubkey: { toBase58: () => 'ataAddress' },
      account: {
        data: {
          parsed: {
            info: {
              mint: 'MintXxx',
              tokenAmount: { amount: '1000', decimals: 6, uiAmount: 0.001 },
            },
          },
        },
      },
    }
    const result = normalizeBalances(1_000_000_000, makeTokenAccountsResponse([fakeTokenAccount]))
    expect(result.sol).toBe(1)
    expect(result.tokens).toHaveLength(1)
    expect(result.tokens[0].mint).toBe('MintXxx')
    expect(result.tokens[0].amount).toBe(1000)
    expect(result.tokens[0].decimals).toBe(6)
    expect(result.tokens[0].uiAmount).toBe(0.001)
  })

  it('preserves raw', () => {
    const result = normalizeBalances(0, makeTokenAccountsResponse([]))
    expect(result.raw).toBeDefined()
  })
})

// ─── normalizeAccount ─────────────────────────────────────────────────────────

describe('normalizeAccount', () => {
  it('returns zero-filled result when info is null', () => {
    const result = normalizeAccount('addr123', null)
    expect(result.address).toBe('addr123')
    expect(result.lamports).toBe(0)
    expect(result.owner).toBe('')
    expect(result.executable).toBe(false)
    expect(result.raw).toBeNull()
  })

  it('normalizes real account info', () => {
    const fakeInfo = {
      lamports: 5_000_000,
      owner: { toBase58: () => 'ownerPubkey' },
      executable: false,
      rentEpoch: 361,
      data: Buffer.alloc(0),
    }
    const result = normalizeAccount('someAddr', fakeInfo as any)
    expect(result.lamports).toBe(5_000_000)
    expect(result.owner).toBe('ownerPubkey')
    expect(result.executable).toBe(false)
    expect(result.rentEpoch).toBe(361)
    expect(result.raw).toBe(fakeInfo)
  })
})

// ─── normalizeTx ──────────────────────────────────────────────────────────────

describe('normalizeTx', () => {
  it('returns failed tx when tx is null', () => {
    const result = normalizeTx('sig123', null)
    expect(result.signature).toBe('sig123')
    expect(result.status).toBe('failed')
    expect(result.fee).toBe(0)
    expect(result.slot).toBe(0)
    expect(result.timestamp).toBeNull()
  })

  it('marks successful tx when meta.err is null', () => {
    const fakeTx = {
      slot: 100,
      blockTime: 1700000000,
      meta: { err: null, fee: 5000 },
    }
    const result = normalizeTx('sigABC', fakeTx as any)
    expect(result.status).toBe('success')
    expect(result.fee).toBe(5000)
    expect(result.slot).toBe(100)
    expect(result.timestamp).toBe(1700000000)
  })

  it('marks failed tx when meta.err is set', () => {
    const fakeTx = {
      slot: 101,
      blockTime: null,
      meta: { err: { InstructionError: [0, 'Custom'] }, fee: 5000 },
    }
    const result = normalizeTx('sigDEF', fakeTx as any)
    expect(result.status).toBe('failed')
  })
})

// ─── normalizeToken ───────────────────────────────────────────────────────────

describe('normalizeToken', () => {
  it('normalizes token with metadata', () => {
    const supply = { amount: '1000000000000', decimals: 6, uiAmount: 1000000 }
    const metadata = { name: 'USD Coin', symbol: 'USDC', uri: 'https://example.com/usdc.json' }
    const result = normalizeToken('MintAddr', supply as any, metadata)
    expect(result.mint).toBe('MintAddr')
    expect(result.name).toBe('USD Coin')
    expect(result.symbol).toBe('USDC')
    expect(result.decimals).toBe(6)
    expect(result.supply).toBe(1000000000000)
    expect(result.uri).toBe('https://example.com/usdc.json')
  })

  it('handles null metadata', () => {
    const supply = { amount: '500', decimals: 0, uiAmount: 500 }
    const result = normalizeToken('MintAddr', supply as any, null)
    expect(result.name).toBe('')
    expect(result.symbol).toBe('')
    expect(result.uri).toBeUndefined()
  })
})

// ─── normalizeTokenAccount ────────────────────────────────────────────────────

describe('normalizeTokenAccount', () => {
  it('normalizes token account', () => {
    const fakeAccount = {
      data: {
        parsed: {
          info: {
            mint: 'MintAAA',
            owner: 'OwnerBBB',
            tokenAmount: { amount: '250000', decimals: 6, uiAmount: 0.25 },
          },
        },
      },
    }
    const result = normalizeTokenAccount('ataAddr', fakeAccount as any)
    expect(result.address).toBe('ataAddr')
    expect(result.mint).toBe('MintAAA')
    expect(result.owner).toBe('OwnerBBB')
    expect(result.amount).toBe(250000)
    expect(result.decimals).toBe(6)
    expect(result.uiAmount).toBe(0.25)
  })
})
