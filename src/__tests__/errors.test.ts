import { describe, expect, it } from 'vitest'
import { ChainKitError } from '../core/errors.js'
import type { ChainKitErrorCode } from '../core/errors.js'

describe('ChainKitError', () => {
  it('extends Error', () => {
    const err = new ChainKitError('RPC_ERROR', 'something went wrong')
    expect(err).toBeInstanceOf(Error)
    expect(err).toBeInstanceOf(ChainKitError)
  })

  it('sets name to ChainKitError', () => {
    const err = new ChainKitError('NOT_FOUND', 'not found')
    expect(err.name).toBe('ChainKitError')
  })

  it('stores code', () => {
    const codes: ChainKitErrorCode[] = [
      'INVALID_ADDRESS',
      'RPC_ERROR',
      'NOT_FOUND',
      'UNSUPPORTED_CHAIN',
      'INVALID_NETWORK',
      'MAINNET_AIRDROP',
      'INVALID_MNEMONIC',
      'DECRYPTION_FAILED',
      'JUPITER_ERROR',
    ]
    for (const code of codes) {
      const err = new ChainKitError(code, 'test')
      expect(err.code).toBe(code)
    }
  })

  it('stores message', () => {
    const err = new ChainKitError('RPC_ERROR', 'connection timeout')
    expect(err.message).toBe('connection timeout')
  })

  it('stores cause when provided', () => {
    const cause = new Error('underlying')
    const err = new ChainKitError('RPC_ERROR', 'wrapper', cause)
    expect(err.cause).toBe(cause)
  })

  it('cause is undefined when not provided', () => {
    const err = new ChainKitError('NOT_FOUND', 'nothing here')
    expect(err.cause).toBeUndefined()
  })
})
