import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  VersionedTransaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js'
import { ChainKitError } from './core/errors.js'
import { SolanaClient } from './chains/solana/client.js'
import { getAccount, getBalances } from './chains/solana/accounts.js'
import { getTransaction, getTransactions } from './chains/solana/transactions.js'
import { getToken, getTokenAccounts } from './chains/solana/tokens.js'
import * as WalletModule from './wallet/index.js'
import type {
  AccountResult,
  AirdropResult,
  BalanceResult,
  ChainKitConfig,
  PriceResult,
  SwapQuote,
  SwapQuoteOptions,
  TokenAccountResult,
  TokenResult,
  TokenTransferOptions,
  TransferOptions,
  TxQueryOptions,
  TxResult,
  WalletResult,
} from './types.js'

export { ChainKitError } from './core/errors.js'
export type {
  AccountResult,
  AirdropResult,
  BalanceResult,
  ChainKitConfig,
  KeyfileExport,
  PriceResult,
  SwapQuote,
  SwapQuoteOptions,
  TokenAccountResult,
  TokenBalance,
  TokenResult,
  TokenTransferOptions,
  TransferOptions,
  TxQueryOptions,
  TxResult,
  WalletResult,
} from './types.js'

const JUPITER_QUOTE_URL = 'https://quote-api.jup.ag/v6/quote'
const JUPITER_SWAP_URL = 'https://quote-api.jup.ag/v6/swap'
const JUPITER_PRICE_URL = 'https://price.jup.ag/v4/price'

const SPL_TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJe8bRR')

function findAta(wallet: PublicKey, mint: PublicKey): PublicKey {
  const [ata] = PublicKey.findProgramAddressSync(
    [wallet.toBuffer(), SPL_TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  )
  return ata
}

function createAtaInstruction(
  payer: PublicKey,
  ata: PublicKey,
  owner: PublicKey,
  mint: PublicKey,
): TransactionInstruction {
  return new TransactionInstruction({
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: ata, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: false, isWritable: false },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: SPL_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    data: Buffer.alloc(0),
  })
}

function createSplTransferInstruction(
  source: PublicKey,
  destination: PublicKey,
  owner: PublicKey,
  amount: number,
): TransactionInstruction {
  const data = Buffer.alloc(9)
  data.writeUInt8(3, 0) // Transfer instruction discriminator
  data.writeBigUInt64LE(BigInt(amount), 1)
  return new TransactionInstruction({
    keys: [
      { pubkey: source, isSigner: false, isWritable: true },
      { pubkey: destination, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: true, isWritable: false },
    ],
    programId: SPL_TOKEN_PROGRAM_ID,
    data,
  })
}

export class ChainKit {
  private readonly client: SolanaClient
  readonly wallet: typeof WalletModule

  constructor(config: ChainKitConfig) {
    if (config.chain !== 'solana') {
      throw new ChainKitError('UNSUPPORTED_CHAIN', `Unsupported chain: ${config.chain}`)
    }
    if (!config.rpcUrl && !config.network) {
      throw new ChainKitError('INVALID_NETWORK', 'Provide rpcUrl or network in ChainKitConfig')
    }
    this.client = new SolanaClient(config.rpcUrl, config.network)
    this.wallet = WalletModule
  }

  // ─── Accounts ────────────────────────────────────────────────────────────

  getBalances(address: string): Promise<BalanceResult> {
    return getBalances(this.client, address)
  }

  getAccount(address: string): Promise<AccountResult> {
    return getAccount(this.client, address)
  }

  // ─── Transactions ─────────────────────────────────────────────────────────

  getTransactions(address: string, opts?: TxQueryOptions): Promise<TxResult[]> {
    return getTransactions(this.client, address, opts)
  }

  getTransaction(signature: string): Promise<TxResult> {
    return getTransaction(this.client, signature)
  }

  // ─── Tokens ───────────────────────────────────────────────────────────────

  getToken(mint: string): Promise<TokenResult> {
    return getToken(this.client, mint)
  }

  getTokenAccounts(address: string): Promise<TokenAccountResult[]> {
    return getTokenAccounts(this.client, address)
  }

  // ─── Wallet shortcuts ─────────────────────────────────────────────────────

  createWallet(): WalletResult {
    return WalletModule.create()
  }

  restoreWallet(mnemonic: string): WalletResult {
    return WalletModule.restore(mnemonic)
  }

  // ─── Transfer ─────────────────────────────────────────────────────────────

  async transfer(opts: TransferOptions): Promise<string> {
    const from = Keypair.fromSecretKey(opts.from.secretKey)
    const to = new PublicKey(opts.to)
    const lamports = Math.round(opts.amount * 1e9)

    const tx = new Transaction().add(
      SystemProgram.transfer({ fromPubkey: from.publicKey, toPubkey: to, lamports }),
    )
    const sig = await sendAndConfirmTransaction(this.client.connection, tx, [from])
    return sig
  }

  async transferToken(opts: TokenTransferOptions): Promise<string> {
    const from = Keypair.fromSecretKey(opts.from.secretKey)
    const mintPubkey = new PublicKey(opts.mint)
    const toPubkey = new PublicKey(opts.to)

    const fromAta = findAta(from.publicKey, mintPubkey)
    const toAta = findAta(toPubkey, mintPubkey)

    const tx = new Transaction()

    // Create destination ATA if it doesn't exist
    const toAtaInfo = await this.client.connection.getAccountInfo(toAta)
    if (!toAtaInfo) {
      tx.add(createAtaInstruction(from.publicKey, toAta, toPubkey, mintPubkey))
    }

    tx.add(createSplTransferInstruction(fromAta, toAta, from.publicKey, opts.amount))

    const sig = await sendAndConfirmTransaction(this.client.connection, tx, [from])
    return sig
  }

  // ─── Airdrop ──────────────────────────────────────────────────────────────

  async airdrop(address: string, amountSol: number): Promise<AirdropResult> {
    if (this.client.network === 'mainnet-beta' || this.client.isMainnet()) {
      throw new ChainKitError(
        'MAINNET_AIRDROP',
        'Airdrop is not available on mainnet. Use devnet or testnet.',
      )
    }
    const pubkey = new PublicKey(address)
    const lamports = Math.round(amountSol * 1e9)
    const sig = await this.client.connection.requestAirdrop(pubkey, lamports)
    return { signature: sig, amount: amountSol }
  }

  // ─── Jupiter: Price ───────────────────────────────────────────────────────

  async getPrice(mint: string): Promise<PriceResult> {
    const url = `${JUPITER_PRICE_URL}?ids=${encodeURIComponent(mint)}`
    let res: Response
    try {
      res = await fetch(url)
    } catch (err) {
      throw new ChainKitError('JUPITER_ERROR', `Failed to fetch price for ${mint}`, err)
    }
    if (!res.ok) {
      throw new ChainKitError('JUPITER_ERROR', `Jupiter price API error: ${res.status}`)
    }
    const json = (await res.json()) as { data: Record<string, { price: number }> }
    const entry = json.data?.[mint]
    if (!entry) {
      throw new ChainKitError('NOT_FOUND', `No price data for mint: ${mint}`)
    }
    return { mint, price: entry.price, currency: 'USD' }
  }

  // ─── Jupiter: Swap Quote ──────────────────────────────────────────────────

  async getSwapQuote(opts: SwapQuoteOptions): Promise<SwapQuote> {
    const params = new URLSearchParams({
      inputMint: opts.inputMint,
      outputMint: opts.outputMint,
      amount: String(opts.amount),
      slippageBps: String(opts.slippageBps ?? 50),
    })
    let res: Response
    try {
      res = await fetch(`${JUPITER_QUOTE_URL}?${params}`)
    } catch (err) {
      throw new ChainKitError('JUPITER_ERROR', 'Failed to fetch Jupiter swap quote', err)
    }
    if (!res.ok) {
      throw new ChainKitError('JUPITER_ERROR', `Jupiter quote API error: ${res.status}`)
    }
    const raw = (await res.json()) as {
      inputMint: string
      outputMint: string
      inAmount: string
      outAmount: string
      priceImpactPct: number
      slippageBps: number
    }
    return {
      inputMint: raw.inputMint,
      outputMint: raw.outputMint,
      inAmount: Number(raw.inAmount),
      outAmount: Number(raw.outAmount),
      priceImpactPct: raw.priceImpactPct,
      slippageBps: raw.slippageBps,
      raw,
    }
  }

  // ─── Jupiter: Swap ────────────────────────────────────────────────────────

  async swap(quote: SwapQuote, wallet: WalletResult): Promise<string> {
    let res: Response
    try {
      res = await fetch(JUPITER_SWAP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteResponse: quote.raw,
          userPublicKey: wallet.publicKey,
          wrapAndUnwrapSol: true,
        }),
      })
    } catch (err) {
      throw new ChainKitError('JUPITER_ERROR', 'Failed to get Jupiter swap transaction', err)
    }
    if (!res.ok) {
      throw new ChainKitError('JUPITER_ERROR', `Jupiter swap API error: ${res.status}`)
    }
    const { swapTransaction } = (await res.json()) as { swapTransaction: string }

    const txBytes = Buffer.from(swapTransaction, 'base64')
    const vTx = VersionedTransaction.deserialize(txBytes)
    const keypair = Keypair.fromSecretKey(wallet.secretKey)
    vTx.sign([keypair])
    const sig = await this.client.connection.sendTransaction(vTx)
    return sig
  }
}
