import { PublicKey } from '@solana/web3.js'
import { ChainKitError } from '../../core/errors.js'
import { normalizeTx } from '../../core/normalize.js'
import type { TxQueryOptions, TxResult } from '../../types.js'
import type { SolanaClient } from './client.js'

export async function getTransactions(
  client: SolanaClient,
  address: string,
  opts: TxQueryOptions = {},
): Promise<TxResult[]> {
  let pubkey: PublicKey
  try {
    pubkey = new PublicKey(address)
  } catch {
    throw new ChainKitError('INVALID_ADDRESS', `Invalid Solana address: ${address}`)
  }

  try {
    const signatures = await client.connection.getSignaturesForAddress(pubkey, {
      limit: opts.limit ?? 10,
      before: opts.before,
      until: opts.until,
    })

    const txs = await Promise.all(
      signatures.map((sig) =>
        client.connection
          .getParsedTransaction(sig.signature, { maxSupportedTransactionVersion: 0 })
          .then((tx) => normalizeTx(sig.signature, tx)),
      ),
    )

    return txs
  } catch (err) {
    if (err instanceof ChainKitError) throw err
    throw new ChainKitError('RPC_ERROR', `Failed to fetch transactions for ${address}`, err)
  }
}

export async function getTransaction(
  client: SolanaClient,
  signature: string,
): Promise<TxResult> {
  try {
    const tx = await client.connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    })
    if (!tx) {
      throw new ChainKitError('NOT_FOUND', `Transaction not found: ${signature}`)
    }
    return normalizeTx(signature, tx)
  } catch (err) {
    if (err instanceof ChainKitError) throw err
    throw new ChainKitError('RPC_ERROR', `Failed to fetch transaction ${signature}`, err)
  }
}
