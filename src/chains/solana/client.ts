import { Connection, clusterApiUrl } from '@solana/web3.js'
import type { Cluster } from '@solana/web3.js'
import { ChainKitError } from '../../core/errors.js'

export type SolanaNetwork = 'mainnet-beta' | 'devnet' | 'testnet'

export class SolanaClient {
  readonly connection: Connection
  readonly network: SolanaNetwork | undefined

  constructor(rpcUrl?: string, network?: SolanaNetwork) {
    if (!rpcUrl && !network) {
      throw new ChainKitError(
        'INVALID_NETWORK',
        'Provide rpcUrl or network for SolanaClient',
      )
    }

    this.network = network

    const url = rpcUrl ?? clusterApiUrl(network as Cluster)
    this.connection = new Connection(url, 'confirmed')
  }

  isMainnet(): boolean {
    return this.network === 'mainnet-beta'
  }
}
