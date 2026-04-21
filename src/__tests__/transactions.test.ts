import { describe, expect, it, vi } from 'vitest'
import { getTransaction, getTransactions } from '../chains/solana/transactions.js'

const VALID_ADDRESS = 'GsbwXfJraMomNxBcjYLcG3mxkBUiyWXAB8fck9eiHaWB'
const INVALID_ADDRESS = 'bad-address'
const SIG_1 = '5KtPnabcdefghijklmnopqrstuvwxyz1234567890ABCDE'
const SIG_2 = '3mXqRabcdefghijklmnopqrstuvwxyz1234567890FGHIJ'

function makeFakeTx(signature: string, err: unknown = null) {
  return {
    slot: 100,
    blockTime: 1700000000,
    meta: { err, fee: 5000 },
    transaction: {},
  }
}

function makeClient(overrides: Record<string, unknown> = {}) {
  return {
    network: 'devnet',
    connection: {
      getSignaturesForAddress: vi.fn().mockResolvedValue([
        { signature: SIG_1 },
        { signature: SIG_2 },
      ]),
      getParsedTransaction: vi.fn().mockImplementation((sig: string) =>
        Promise.resolve(makeFakeTx(sig)),
      ),
      ...overrides,
    },
    isMainnet: vi.fn().mockReturnValue(false),
  } as any
}

describe('getTransactions', () => {
  it('returns array of normalized transactions', async () => {
    const client = makeClient()
    const result = await getTransactions(client, VALID_ADDRESS)
    expect(result).toHaveLength(2)
    expect(result[0].signature).toBe(SIG_1)
    expect(result[0].status).toBe('success')
    expect(result[0].fee).toBe(5000)
  })

  it('respects limit option', async () => {
    const client = makeClient({
      getSignaturesForAddress: vi.fn().mockResolvedValue([{ signature: SIG_1 }]),
    })
    const result = await getTransactions(client, VALID_ADDRESS, { limit: 1 })
    expect(result).toHaveLength(1)
    expect(
      (client.connection.getSignaturesForAddress as ReturnType<typeof vi.fn>).mock.calls[0][1]
        .limit,
    ).toBe(1)
  })

  it('marks failed transactions correctly', async () => {
    const client = makeClient({
      getParsedTransaction: vi.fn().mockResolvedValue(
        makeFakeTx(SIG_1, { InstructionError: [0, 'Custom'] }),
      ),
    })
    const result = await getTransactions(client, VALID_ADDRESS, { limit: 1 })
    expect(result[0].status).toBe('failed')
  })

  it('throws INVALID_ADDRESS for bad address', async () => {
    const client = makeClient()
    await expect(getTransactions(client, INVALID_ADDRESS)).rejects.toMatchObject({
      code: 'INVALID_ADDRESS',
    })
  })

  it('wraps RPC errors', async () => {
    const client = makeClient({
      getSignaturesForAddress: vi.fn().mockRejectedValue(new Error('rpc down')),
    })
    await expect(getTransactions(client, VALID_ADDRESS)).rejects.toMatchObject({
      code: 'RPC_ERROR',
    })
  })
})

describe('getTransaction', () => {
  it('returns a single normalized transaction', async () => {
    const client = makeClient()
    const result = await getTransaction(client, SIG_1)
    expect(result.signature).toBe(SIG_1)
    expect(result.status).toBe('success')
  })

  it('throws NOT_FOUND when tx is null', async () => {
    const client = makeClient({
      getParsedTransaction: vi.fn().mockResolvedValue(null),
    })
    await expect(getTransaction(client, SIG_1)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
  })

  it('wraps RPC errors', async () => {
    const client = makeClient({
      getParsedTransaction: vi.fn().mockRejectedValue(new Error('timeout')),
    })
    await expect(getTransaction(client, SIG_1)).rejects.toMatchObject({
      code: 'RPC_ERROR',
    })
  })
})
