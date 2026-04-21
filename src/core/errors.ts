export type ChainKitErrorCode =
  | 'INVALID_ADDRESS'
  | 'RPC_ERROR'
  | 'NOT_FOUND'
  | 'UNSUPPORTED_CHAIN'
  | 'INVALID_NETWORK'
  | 'MAINNET_AIRDROP'
  | 'INVALID_MNEMONIC'
  | 'DECRYPTION_FAILED'
  | 'JUPITER_ERROR'

export class ChainKitError extends Error {
  readonly code: ChainKitErrorCode
  readonly cause: unknown

  constructor(code: ChainKitErrorCode, message: string, cause?: unknown) {
    super(message)
    this.name = 'ChainKitError'
    this.code = code
    this.cause = cause
  }
}
