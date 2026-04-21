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
| `rpcUrl` | `string` | ✅ | Your RPC endpoint |
| `apiKey` | `string` | — | API key for enhanced providers (Helius, etc.) |

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
