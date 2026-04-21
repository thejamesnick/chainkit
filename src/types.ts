// ─── Config ───────────────────────────────────────────────────────────────────

export type SolanaNetwork = 'mainnet-beta' | 'devnet' | 'testnet'

export interface ChainKitConfig {
  chain: 'solana'
  rpcUrl?: string                // optional when network is provided
  network?: SolanaNetwork        // auto-resolves to public cluster URL
  apiKey?: string                // optional — for Helius enhanced endpoints
}

// ─── Wallet ───────────────────────────────────────────────────────────────────

export interface WalletResult {
  publicKey: string
  secretKey: Uint8Array
  mnemonic: string
}

export interface KeyfileExport {
  version: number
  address: string
  encrypted: string // AES-256-GCM encrypted secret key
  salt: string
  iv: string
}

// ─── Balances ─────────────────────────────────────────────────────────────────

export interface TokenBalance {
  mint: string
  symbol: string
  name: string
  amount: number
  decimals: number
  uiAmount: number
}

export interface BalanceResult {
  sol: number
  tokens: TokenBalance[]
  raw: unknown
}

// ─── Accounts ─────────────────────────────────────────────────────────────────

export interface AccountResult {
  address: string
  lamports: number
  owner: string
  executable: boolean
  rentEpoch: number
  raw: unknown
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export interface TxQueryOptions {
  limit?: number
  before?: string // signature to paginate before
  until?: string  // signature to paginate until
}

export interface TxResult {
  signature: string
  timestamp: number | null
  status: 'success' | 'failed'
  fee: number
  slot: number
  raw: unknown
}

// ─── Tokens ───────────────────────────────────────────────────────────────────

export interface TokenResult {
  mint: string
  name: string
  symbol: string
  decimals: number
  supply: number
  uri?: string
  raw: unknown
}

export interface TokenAccountResult {
  address: string
  mint: string
  owner: string
  amount: number
  decimals: number
  uiAmount: number
}

// ─── Swap ─────────────────────────────────────────────────────────────────────

export interface SwapQuoteOptions {
  inputMint: string
  outputMint: string
  amount: number       // in lamports / smallest unit
  slippageBps?: number // default 50 (0.5%)
}

export interface SwapQuote {
  inputMint: string
  outputMint: string
  inAmount: number
  outAmount: number
  priceImpactPct: number
  slippageBps: number
  raw: unknown
}

// ─── Price ────────────────────────────────────────────────────────────────────

export interface PriceResult {
  mint: string
  price: number   // in USD
  currency: 'USD'
}

// ─── Airdrop ─────────────────────────────────────────────────────────────────

export interface AirdropResult {
  signature: string
  amount: number // in SOL
}

// ─── Transfer ─────────────────────────────────────────────────────────────────

export interface TransferOptions {
  from: WalletResult
  to: string
  amount: number // in SOL
}

export interface TokenTransferOptions {
  from: WalletResult
  to: string
  mint: string
  amount: number // in token units
}
