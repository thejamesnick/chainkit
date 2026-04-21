import type {
  AccountInfo,
  ParsedAccountData,
  ParsedTransactionWithMeta,
  RpcResponseAndContext,
  TokenAmount,
} from '@solana/web3.js'
import type {
  AccountResult,
  BalanceResult,
  TokenAccountResult,
  TokenBalance,
  TokenResult,
  TxResult,
} from '../types.js'

// ─── Balances ────────────────────────────────────────────────────────────────

export function normalizeBalances(
  solLamports: number,
  tokenAccounts: RpcResponseAndContext<
    Array<{ pubkey: { toBase58(): string }; account: AccountInfo<ParsedAccountData> }>
  >,
): BalanceResult {
  const tokens: TokenBalance[] = tokenAccounts.value.map((ta) => {
    const info = ta.account.data.parsed?.info ?? {}
    const tokenAmount: TokenAmount = info.tokenAmount ?? { amount: '0', decimals: 0, uiAmount: 0 }
    return {
      mint: info.mint ?? '',
      symbol: '',   // on-chain metadata not available from raw RPC; filled by tokens module when possible
      name: '',
      amount: Number(tokenAmount.amount),
      decimals: tokenAmount.decimals,
      uiAmount: tokenAmount.uiAmount ?? 0,
    }
  })

  return {
    sol: solLamports / 1e9,
    tokens,
    raw: { solLamports, tokenAccounts: tokenAccounts.value },
  }
}

// ─── Account ─────────────────────────────────────────────────────────────────

export function normalizeAccount(
  address: string,
  info: AccountInfo<Buffer | ParsedAccountData> | null,
): AccountResult {
  if (!info) {
    return {
      address,
      lamports: 0,
      owner: '',
      executable: false,
      rentEpoch: 0,
      raw: null,
    }
  }
  return {
    address,
    lamports: info.lamports,
    owner: info.owner.toBase58(),
    executable: info.executable,
    rentEpoch: info.rentEpoch ?? 0,
    raw: info,
  }
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export function normalizeTx(
  signature: string,
  tx: ParsedTransactionWithMeta | null,
): TxResult {
  if (!tx) {
    return {
      signature,
      timestamp: null,
      status: 'failed',
      fee: 0,
      slot: 0,
      raw: null,
    }
  }

  const status = tx.meta?.err == null ? 'success' : 'failed'

  return {
    signature,
    timestamp: tx.blockTime ?? null,
    status,
    fee: tx.meta?.fee ?? 0,
    slot: tx.slot,
    raw: tx,
  }
}

// ─── Token ───────────────────────────────────────────────────────────────────

export function normalizeToken(
  mint: string,
  supply: TokenAmount,
  metadata: { name?: string; symbol?: string; uri?: string } | null,
): TokenResult {
  return {
    mint,
    name: metadata?.name ?? '',
    symbol: metadata?.symbol ?? '',
    decimals: supply.decimals,
    supply: Number(supply.amount),
    uri: metadata?.uri,
    raw: { supply, metadata },
  }
}

// ─── Token Accounts ───────────────────────────────────────────────────────────

export function normalizeTokenAccount(
  pubkey: string,
  account: AccountInfo<ParsedAccountData>,
): TokenAccountResult {
  const info = account.data.parsed?.info ?? {}
  const tokenAmount: TokenAmount = info.tokenAmount ?? { amount: '0', decimals: 0, uiAmount: 0 }
  return {
    address: pubkey,
    mint: info.mint ?? '',
    owner: info.owner ?? '',
    amount: Number(tokenAmount.amount),
    decimals: tokenAmount.decimals,
    uiAmount: tokenAmount.uiAmount ?? 0,
  }
}
