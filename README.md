# ChainKit

> HACK #3 — thejamesnick HACK Series

One SDK to rule all blockchain APIs. Solana-first. Chain-agnostic by design.

Stop juggling `@solana/web3.js`, Helius, custom RPC wrappers, and five different indexing APIs. ChainKit gives you a single, consistent interface for everything — balances, transactions, tokens, NFTs, and more.

```bash
npm install chainkit
```

---

## Why

Every Solana app ends up with the same mess:

- Raw `@solana/web3.js` calls for some things
- Helius API for others
- A custom fetch wrapper for the rest
- Zero consistency across any of it

ChainKit wraps it all. One import, one pattern, done.

---

## Install

```bash
npm install chainkit
```

---

## Quick Start

```ts
import { ChainKit } from 'chainkit'

const kit = new ChainKit({
  chain: 'solana',
  rpcUrl: process.env.SOLANA_RPC_URL,
})

// Or use the network shorthand (auto-resolves to public cluster URL):
const devKit = new ChainKit({ chain: 'solana', network: 'devnet' })

// Get token balances
const balances = await kit.getBalances('YourWalletAddressHere')

// Get transaction history
const txns = await kit.getTransactions('YourWalletAddressHere', { limit: 10 })

// Get token metadata
const token = await kit.getToken('TokenMintAddressHere')
```

---

## API

### `ChainKit`

```ts
const kit = new ChainKit(config: ChainKitConfig)
```

| Option | Type | Required | Description |
|---|---|---|---|
| `chain` | `'solana'` | ✅ | Chain to connect to |
| `rpcUrl` | `string` | ✅ (or `network`) | Your RPC endpoint |
| `network` | `'mainnet-beta' \| 'devnet' \| 'testnet'` | ✅ (or `rpcUrl`) | Auto-resolves to public cluster URL |
| `apiKey` | `string` | — | API key for enhanced providers (Helius, etc.) |

> **Tip:** `rpcUrl` and `network` can both be provided — `rpcUrl` wins. If only `network` is given, ChainKit resolves the public cluster URL for you.

---

### Accounts

```ts
// Native SOL balance + all token balances
await kit.getBalances(address: string)

// Account info
await kit.getAccount(address: string)
```

### Transactions

```ts
// Transaction history for a wallet
await kit.getTransactions(address: string, opts?: { limit?: number, before?: string })

// Single transaction by signature
await kit.getTransaction(signature: string)
```

### Tokens

```ts
// Token metadata by mint address
await kit.getToken(mint: string)

// All tokens held by a wallet
await kit.getTokenAccounts(address: string)
```

### Wallet

```ts
// Create a new wallet (keypair + 12-word mnemonic)
const wallet = kit.createWallet()

// Restore from mnemonic
const wallet = kit.restoreWallet('word1 word2 ... word12')

// Full wallet module
kit.wallet.create()
kit.wallet.restore(mnemonic)
kit.wallet.fromBase58(privateKey)
kit.wallet.exportKeyfile(wallet, password)
kit.wallet.importKeyfile(path, password)
kit.wallet.exportQR(publicKey)
kit.wallet.isValid(address)
kit.wallet.isMnemonic(phrase)
```

### Transfers

```ts
// Send SOL
await kit.transfer({ from: wallet, to: address, amount: 0.5 })

// Send SPL token
await kit.transferToken({ from: wallet, to: address, mint, amount: 100 })
```

### Devnet / Testnet

```ts
// network shorthand — no rpcUrl needed
const kit = new ChainKit({ chain: 'solana', network: 'devnet' })

// Airdrop SOL (devnet / testnet only — throws on mainnet)
await kit.airdrop(wallet.publicKey, 2) // 2 SOL
```

### Prices & Swaps (via Jupiter)

```ts
// Token price in USD
await kit.getPrice(mint: string)

// Best swap quote across all Solana DEXs
await kit.getSwapQuote({ inputMint, outputMint, amount })

// Execute swap
await kit.swap(quote, wallet)
```

---

## Status Matrix

| Method | Phase 1 | Notes |
|---|---|---|
| `getBalances(address)` | ✅ | SOL + SPL tokens |
| `getAccount(address)` | ✅ | |
| `getTransactions(address, opts?)` | ✅ | Pagination supported |
| `getTransaction(signature)` | ✅ | |
| `getToken(mint)` | ✅ | Supply + on-chain metadata |
| `getTokenAccounts(address)` | ✅ | |
| `createWallet()` | ✅ | |
| `restoreWallet(mnemonic)` | ✅ | |
| `wallet.create()` | ✅ | |
| `wallet.restore(mnemonic)` | ✅ | |
| `wallet.fromSecretKey(bytes)` | ✅ | |
| `wallet.fromBase58(str)` | ✅ | |
| `wallet.isValid(address)` | ✅ | |
| `wallet.isMnemonic(phrase)` | ✅ | |
| `wallet.exportKeyfile(wallet, pass)` | ✅ | AES-256-GCM |
| `wallet.importKeyfile(path, pass)` | ✅ | |
| `wallet.exportBase58(wallet)` | ✅ | |
| `wallet.exportArray(wallet)` | ✅ | |
| `wallet.exportQR(pubkey)` | ✅ | Base64 PNG |
| `wallet.saveQR(pubkey, path)` | ✅ | |
| `wallet.sign(tx, wallet)` | ✅ | |
| `wallet.derive(mnemonic, path)` | ✅ | BIP44 |
| `wallet.vanity(prefix)` | ✅ | Brute-force, async |
| `transfer(opts)` | ✅ | SOL transfer |
| `transferToken(opts)` | ✅ | SPL token transfer |
| `airdrop(address, amount)` | ✅ | devnet/testnet only |
| `getPrice(mint)` | ✅ | Jupiter price API |
| `getSwapQuote(opts)` | ✅ | Jupiter quote API |
| `swap(quote, wallet)` | ✅ | Jupiter swap + sign |
| NFT methods (`getNFT`, `getCollection`) | 🔜 Phase 2 | |
| `watch()` — WebSocket subscriptions | 🔜 Phase 2 | |
| Browser-safe entry point | 🔜 Phase 2 | |
| Provider abstraction (Helius, Triton) | 🔜 Phase 2 | |
| React hooks (`chainkit/react`) | 🔜 Phase 3 | |
| EVM / Ethereum support | 🔜 Phase 3 | |

---

## Result Shape

All methods return clean, normalized objects — no raw RPC noise:

```ts
// Balance result
{
  sol: number,
  tokens: [{ mint, symbol, amount, decimals, uiAmount }]
}

// Transaction result
{
  signature: string,
  timestamp: number,
  status: 'success' | 'failed',
  fee: number,
  raw: {...}  // full RPC payload if you need it
}
```

---

## Who's This For

- **Solana app developers** tired of wiring up multiple APIs
- **Hackathon builders** who need to move fast without infra headaches
- **Backend devs** new to Solana who don't want to learn 5 different SDKs
- **Anyone** who's copy-pasted the same RPC boilerplate more than twice

---

## Chains

| Chain | Status |
|---|---|
| Solana | ✅ Phase 1 |
| Ethereum / EVM | 🔜 Phase 2 |
| Sui | 🔜 Phase 3 |

---

## Stack

Node.js + TypeScript. `@solana/web3.js` under the hood. Zero extra runtime deps beyond what's needed per chain.

---

Built by [thejamesnick](https://github.com/thejamesnick) — HACK Series #3
