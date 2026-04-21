import { describe, expect, it, vi } from 'vitest'
import { getToken, getTokenAccounts } from '../chains/solana/tokens.js'

const VALID_ADDRESS = 'GsbwXfJraMomNxBcjYLcG3mxkBUiyWXAB8fck9eiHaWB'
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const INVALID = 'not-valid'

function makeClient(connectionOverrides: Record<string, unknown> = {}) {
  return {
    network: 'devnet',
    connection: {
      getTokenSupply: vi.fn().mockResolvedValue({
        value: { amount: '10000000000', decimals: 6, uiAmount: 10000 },
      }),
      getAccountInfo: vi.fn().mockResolvedValue(null), // no metadata
      getParsedTokenAccountsByOwner: vi.fn().mockResolvedValue({
        context: { slot: 1 },
        value: [
          {
            pubkey: { toBase58: () => 'ataAddr1' },
            account: {
              data: {
                parsed: {
                  info: {
                    mint: USDC_MINT,
                    owner: VALID_ADDRESS,
                    tokenAmount: { amount: '500000', decimals: 6, uiAmount: 0.5 },
                  },
                },
              },
            },
          },
        ],
      }),
      ...connectionOverrides,
    },
    isMainnet: vi.fn().mockReturnValue(false),
  } as any
}

describe('getToken', () => {
  it('returns token info with supply', async () => {
    const client = makeClient()
    const result = await getToken(client, USDC_MINT)
    expect(result.mint).toBe(USDC_MINT)
    expect(result.decimals).toBe(6)
    expect(result.supply).toBe(10000000000)
  })

  it('returns empty name/symbol when no metadata', async () => {
    const client = makeClient()
    const result = await getToken(client, USDC_MINT)
    expect(result.name).toBe('')
    expect(result.symbol).toBe('')
  })

  it('throws INVALID_ADDRESS for bad mint', async () => {
    const client = makeClient()
    await expect(getToken(client, INVALID)).rejects.toMatchObject({
      code: 'INVALID_ADDRESS',
    })
  })

  it('wraps RPC errors', async () => {
    const client = makeClient({
      getTokenSupply: vi.fn().mockRejectedValue(new Error('rpc error')),
    })
    await expect(getToken(client, USDC_MINT)).rejects.toMatchObject({
      code: 'RPC_ERROR',
    })
  })
})

describe('getTokenAccounts', () => {
  it('returns list of token accounts', async () => {
    const client = makeClient()
    const result = await getTokenAccounts(client, VALID_ADDRESS)
    expect(result).toHaveLength(1)
    expect(result[0].address).toBe('ataAddr1')
    expect(result[0].mint).toBe(USDC_MINT)
    expect(result[0].amount).toBe(500000)
    expect(result[0].uiAmount).toBe(0.5)
  })

  it('returns empty array when no token accounts', async () => {
    const client = makeClient({
      getParsedTokenAccountsByOwner: vi.fn().mockResolvedValue({ value: [] }),
    })
    const result = await getTokenAccounts(client, VALID_ADDRESS)
    expect(result).toEqual([])
  })

  it('throws INVALID_ADDRESS for bad address', async () => {
    const client = makeClient()
    await expect(getTokenAccounts(client, INVALID)).rejects.toMatchObject({
      code: 'INVALID_ADDRESS',
    })
  })

  it('wraps RPC errors', async () => {
    const client = makeClient({
      getParsedTokenAccountsByOwner: vi.fn().mockRejectedValue(new Error('down')),
    })
    await expect(getTokenAccounts(client, VALID_ADDRESS)).rejects.toMatchObject({
      code: 'RPC_ERROR',
    })
  })
})
