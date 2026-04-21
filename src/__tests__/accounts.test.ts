import { describe, expect, it, vi, beforeEach } from 'vitest'
import { getAccount, getBalances } from '../chains/solana/accounts.js'
import { ChainKitError } from '../core/errors.js'

// Minimal SolanaClient mock
function makeClient(overrides: Record<string, unknown> = {}) {
  return {
    network: 'devnet',
    connection: {
      getBalance: vi.fn().mockResolvedValue(2_000_000_000),
      getParsedTokenAccountsByOwner: vi.fn().mockResolvedValue({
        context: { slot: 1 },
        value: [],
      }),
      getAccountInfo: vi.fn().mockResolvedValue({
        lamports: 2_000_000_000,
        owner: { toBase58: () => '11111111111111111111111111111111' },
        executable: false,
        rentEpoch: 361,
        data: Buffer.alloc(0),
      }),
      ...overrides,
    },
    isMainnet: vi.fn().mockReturnValue(false),
  } as any
}

const VALID_ADDRESS = 'GsbwXfJraMomNxBcjYLcG3mxkBUiyWXAB8fck9eiHaWB'
const INVALID_ADDRESS = 'not-a-real-address'

describe('getBalances', () => {
  it('returns SOL balance in SOL units', async () => {
    const client = makeClient()
    const result = await getBalances(client, VALID_ADDRESS)
    expect(result.sol).toBe(2)
  })

  it('returns empty tokens array when no token accounts', async () => {
    const client = makeClient()
    const result = await getBalances(client, VALID_ADDRESS)
    expect(result.tokens).toEqual([])
  })

  it('normalizes token accounts', async () => {
    const client = makeClient({
      getParsedTokenAccountsByOwner: vi.fn().mockResolvedValue({
        context: { slot: 1 },
        value: [
          {
            pubkey: { toBase58: () => 'ataAddr' },
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
          },
        ],
      }),
    })
    const result = await getBalances(client, VALID_ADDRESS)
    expect(result.tokens).toHaveLength(1)
    expect(result.tokens[0].mint).toBe('MintXxx')
  })

  it('throws INVALID_ADDRESS for bad address', async () => {
    const client = makeClient()
    await expect(getBalances(client, INVALID_ADDRESS)).rejects.toMatchObject({
      code: 'INVALID_ADDRESS',
    })
  })

  it('wraps RPC errors in ChainKitError', async () => {
    const client = makeClient({
      getBalance: vi.fn().mockRejectedValue(new Error('network error')),
    })
    await expect(getBalances(client, VALID_ADDRESS)).rejects.toMatchObject({
      code: 'RPC_ERROR',
    })
  })
})

describe('getAccount', () => {
  it('returns account info', async () => {
    const client = makeClient()
    const result = await getAccount(client, VALID_ADDRESS)
    expect(result.address).toBe(VALID_ADDRESS)
    expect(result.lamports).toBe(2_000_000_000)
    expect(result.executable).toBe(false)
  })

  it('returns zeroed result for non-existent account', async () => {
    const client = makeClient({
      getAccountInfo: vi.fn().mockResolvedValue(null),
    })
    const result = await getAccount(client, VALID_ADDRESS)
    expect(result.lamports).toBe(0)
    expect(result.owner).toBe('')
  })

  it('throws INVALID_ADDRESS for bad address', async () => {
    const client = makeClient()
    await expect(getAccount(client, INVALID_ADDRESS)).rejects.toMatchObject({
      code: 'INVALID_ADDRESS',
    })
  })

  it('wraps RPC errors in ChainKitError', async () => {
    const client = makeClient({
      getAccountInfo: vi.fn().mockRejectedValue(new Error('timeout')),
    })
    await expect(getAccount(client, VALID_ADDRESS)).rejects.toMatchObject({
      code: 'RPC_ERROR',
    })
  })
})
