import { describe, expect, it, vi, afterEach } from 'vitest'
import { ChainKit } from '../index.js'
import { ChainKitError } from '../core/errors.js'

// We mock the SolanaClient to avoid real network calls
vi.mock('../chains/solana/client.js', () => {
  return {
    SolanaClient: class {
      network: string
      connection: Record<string, unknown>
      constructor(_rpcUrl: string | undefined, network: string | undefined) {
        this.network = network ?? 'devnet'
        this.connection = {}
      }
      isMainnet() {
        return this.network === 'mainnet-beta'
      }
    },
  }
})

describe('ChainKit constructor', () => {
  it('throws UNSUPPORTED_CHAIN for non-solana chain', () => {
    expect(
      () => new ChainKit({ chain: 'ethereum' as 'solana', rpcUrl: 'http://localhost' }),
    ).toThrow(ChainKitError)
  })

  it('throws INVALID_NETWORK when neither rpcUrl nor network is provided', () => {
    expect(() => new ChainKit({ chain: 'solana' } as any)).toThrow(ChainKitError)
  })

  it('constructs with rpcUrl', () => {
    expect(() => new ChainKit({ chain: 'solana', rpcUrl: 'https://api.mainnet-beta.solana.com' })).not.toThrow()
  })

  it('constructs with network shorthand', () => {
    expect(() => new ChainKit({ chain: 'solana', network: 'devnet' })).not.toThrow()
  })

  it('constructs with mainnet-beta network', () => {
    expect(() => new ChainKit({ chain: 'solana', network: 'mainnet-beta' })).not.toThrow()
  })
})

describe('ChainKit.wallet', () => {
  it('exposes wallet module', () => {
    const kit = new ChainKit({ chain: 'solana', network: 'devnet' })
    expect(typeof kit.wallet.create).toBe('function')
    expect(typeof kit.wallet.restore).toBe('function')
    expect(typeof kit.wallet.isValid).toBe('function')
  })
})

describe('ChainKit.createWallet / restoreWallet', () => {
  it('createWallet returns a wallet', () => {
    const kit = new ChainKit({ chain: 'solana', network: 'devnet' })
    const wallet = kit.createWallet()
    expect(wallet.publicKey).toBeTruthy()
    expect(wallet.mnemonic.split(' ')).toHaveLength(12)
  })

  it('restoreWallet returns same wallet from mnemonic', () => {
    const kit = new ChainKit({ chain: 'solana', network: 'devnet' })
    const original = kit.createWallet()
    const restored = kit.restoreWallet(original.mnemonic)
    expect(restored.publicKey).toBe(original.publicKey)
  })
})

describe('ChainKit.airdrop (mainnet guard)', () => {
  const VALID_ADDRESS = 'GsbwXfJraMomNxBcjYLcG3mxkBUiyWXAB8fck9eiHaWB'

  it('throws MAINNET_AIRDROP on mainnet-beta network', async () => {
    const kit = new ChainKit({ chain: 'solana', network: 'mainnet-beta' })
    await expect(kit.airdrop(VALID_ADDRESS, 1)).rejects.toMatchObject({
      code: 'MAINNET_AIRDROP',
    })
  })

  it('does NOT throw MAINNET_AIRDROP on devnet', async () => {
    const kit = new ChainKit({ chain: 'solana', network: 'devnet' })
    // connection.requestAirdrop is not set on mock — it will throw a generic error
    // but NOT a MAINNET_AIRDROP error
    const err = await kit.airdrop(VALID_ADDRESS, 1).catch((e) => e)
    expect(err?.code).not.toBe('MAINNET_AIRDROP')
  })
})
