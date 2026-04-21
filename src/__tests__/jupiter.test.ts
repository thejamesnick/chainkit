import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { ChainKit } from '../index.js'
import { ChainKitError } from '../core/errors.js'

// Mock SolanaClient
vi.mock('../chains/solana/client.js', () => ({
  SolanaClient: class {
    network = 'devnet'
    connection = {}
    isMainnet() { return false }
  },
}))

const VALID_INPUT_MINT = 'So11111111111111111111111111111111111111112'   // SOL
const VALID_OUTPUT_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' // USDC

const MOCK_QUOTE_RESPONSE = {
  inputMint: VALID_INPUT_MINT,
  outputMint: VALID_OUTPUT_MINT,
  inAmount: '1000000000',
  outAmount: '149820000',
  priceImpactPct: 0.02,
  slippageBps: 50,
}

const MOCK_PRICE_RESPONSE = {
  data: {
    [VALID_INPUT_MINT]: { price: 150.42 },
  },
}

function makeKit() {
  return new ChainKit({ chain: 'solana', network: 'devnet' })
}

describe('getSwapQuote', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(MOCK_QUOTE_RESPONSE),
      }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns a normalized SwapQuote', async () => {
    const kit = makeKit()
    const quote = await kit.getSwapQuote({
      inputMint: VALID_INPUT_MINT,
      outputMint: VALID_OUTPUT_MINT,
      amount: 1_000_000_000,
    })
    expect(quote.inputMint).toBe(VALID_INPUT_MINT)
    expect(quote.outputMint).toBe(VALID_OUTPUT_MINT)
    expect(quote.inAmount).toBe(1_000_000_000)
    expect(quote.outAmount).toBe(149_820_000)
    expect(quote.priceImpactPct).toBe(0.02)
    expect(quote.slippageBps).toBe(50)
  })

  it('uses default slippage of 50bps when not provided', async () => {
    const kit = makeKit()
    await kit.getSwapQuote({
      inputMint: VALID_INPUT_MINT,
      outputMint: VALID_OUTPUT_MINT,
      amount: 1_000_000_000,
    })
    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    expect(url).toContain('slippageBps=50')
  })

  it('uses custom slippage when provided', async () => {
    const kit = makeKit()
    await kit.getSwapQuote({
      inputMint: VALID_INPUT_MINT,
      outputMint: VALID_OUTPUT_MINT,
      amount: 1_000_000_000,
      slippageBps: 100,
    })
    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    expect(url).toContain('slippageBps=100')
  })

  it('throws JUPITER_ERROR when API returns non-ok status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 400 }))
    const kit = makeKit()
    await expect(
      kit.getSwapQuote({ inputMint: VALID_INPUT_MINT, outputMint: VALID_OUTPUT_MINT, amount: 1 }),
    ).rejects.toMatchObject({ code: 'JUPITER_ERROR' })
  })

  it('throws JUPITER_ERROR on network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))
    const kit = makeKit()
    await expect(
      kit.getSwapQuote({ inputMint: VALID_INPUT_MINT, outputMint: VALID_OUTPUT_MINT, amount: 1 }),
    ).rejects.toMatchObject({ code: 'JUPITER_ERROR' })
  })
})

describe('getPrice', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(MOCK_PRICE_RESPONSE),
      }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns price in USD', async () => {
    const kit = makeKit()
    const result = await kit.getPrice(VALID_INPUT_MINT)
    expect(result.mint).toBe(VALID_INPUT_MINT)
    expect(result.price).toBe(150.42)
    expect(result.currency).toBe('USD')
  })

  it('throws NOT_FOUND when mint not in response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: {} }),
      }),
    )
    const kit = makeKit()
    await expect(kit.getPrice('UnknownMint')).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })

  it('throws JUPITER_ERROR on API error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    const kit = makeKit()
    await expect(kit.getPrice(VALID_INPUT_MINT)).rejects.toMatchObject({ code: 'JUPITER_ERROR' })
  })
})
