import { PublicKey } from '@solana/web3.js'
import { ChainKitError } from '../../core/errors.js'
import { normalizeToken, normalizeTokenAccount } from '../../core/normalize.js'
import type { TokenAccountResult, TokenResult } from '../../types.js'
import type { SolanaClient } from './client.js'

// Token Metadata Program ID (Metaplex)
const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
)

// SPL Token Program ID
const SPL_TOKEN_PROGRAM_ID = new PublicKey(
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
)

async function fetchTokenMetadata(
  client: SolanaClient,
  mint: string,
): Promise<{ name: string; symbol: string; uri: string } | null> {
  try {
    const mintPubkey = new PublicKey(mint)
    const [metadataPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mintPubkey.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID,
    )

    const accountInfo = await client.connection.getAccountInfo(metadataPda)
    if (!accountInfo) return null

    // Parse Metaplex metadata layout (simplified — name at offset 69, symbol at offset 105)
    const data = accountInfo.data
    // Layout: 1 (key) + 32 (update_auth) + 32 (mint) + 4 (name_len) + name + 4 (symbol_len) + symbol + 4 (uri_len) + uri
    let offset = 1 + 32 + 32
    const nameLen = data.readUInt32LE(offset)
    offset += 4
    const name = data.subarray(offset, offset + nameLen).toString('utf8').replace(/\0/g, '').trim()
    offset += nameLen
    const symbolLen = data.readUInt32LE(offset)
    offset += 4
    const symbol = data.subarray(offset, offset + symbolLen).toString('utf8').replace(/\0/g, '').trim()
    offset += symbolLen
    const uriLen = data.readUInt32LE(offset)
    offset += 4
    const uri = data.subarray(offset, offset + uriLen).toString('utf8').replace(/\0/g, '').trim()

    return { name, symbol, uri }
  } catch {
    return null
  }
}

export async function getToken(
  client: SolanaClient,
  mint: string,
): Promise<TokenResult> {
  let mintPubkey: PublicKey
  try {
    mintPubkey = new PublicKey(mint)
  } catch {
    throw new ChainKitError('INVALID_ADDRESS', `Invalid mint address: ${mint}`)
  }

  try {
    const [supply, metadata] = await Promise.all([
      client.connection.getTokenSupply(mintPubkey),
      fetchTokenMetadata(client, mint),
    ])
    return normalizeToken(mint, supply.value, metadata)
  } catch (err) {
    if (err instanceof ChainKitError) throw err
    throw new ChainKitError('RPC_ERROR', `Failed to fetch token info for ${mint}`, err)
  }
}

export async function getTokenAccounts(
  client: SolanaClient,
  address: string,
): Promise<TokenAccountResult[]> {
  let pubkey: PublicKey
  try {
    pubkey = new PublicKey(address)
  } catch {
    throw new ChainKitError('INVALID_ADDRESS', `Invalid Solana address: ${address}`)
  }

  try {
    const result = await client.connection.getParsedTokenAccountsByOwner(pubkey, {
      programId: SPL_TOKEN_PROGRAM_ID,
    })
    return result.value.map((ta) =>
      normalizeTokenAccount(ta.pubkey.toBase58(), ta.account),
    )
  } catch (err) {
    if (err instanceof ChainKitError) throw err
    throw new ChainKitError('RPC_ERROR', `Failed to fetch token accounts for ${address}`, err)
  }
}
