import { PublicKey } from '@solana/web3.js'
import { ChainKitError } from '../../core/errors.js'
import { normalizeAccount, normalizeBalances } from '../../core/normalize.js'
import type { AccountResult, BalanceResult } from '../../types.js'
import type { SolanaClient } from './client.js'

function validateAddress(address: string): PublicKey {
  try {
    return new PublicKey(address)
  } catch {
    throw new ChainKitError('INVALID_ADDRESS', `Invalid Solana address: ${address}`)
  }
}

export async function getBalances(
  client: SolanaClient,
  address: string,
): Promise<BalanceResult> {
  const pubkey = validateAddress(address)
  try {
    const [solLamports, tokenAccounts] = await Promise.all([
      client.connection.getBalance(pubkey),
      client.connection.getParsedTokenAccountsByOwner(pubkey, {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      }),
    ])
    return normalizeBalances(solLamports, tokenAccounts)
  } catch (err) {
    if (err instanceof ChainKitError) throw err
    throw new ChainKitError('RPC_ERROR', `Failed to fetch balances for ${address}`, err)
  }
}

export async function getAccount(
  client: SolanaClient,
  address: string,
): Promise<AccountResult> {
  const pubkey = validateAddress(address)
  try {
    const info = await client.connection.getAccountInfo(pubkey)
    return normalizeAccount(address, info)
  } catch (err) {
    if (err instanceof ChainKitError) throw err
    throw new ChainKitError('RPC_ERROR', `Failed to fetch account info for ${address}`, err)
  }
}
