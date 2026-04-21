# The Problem ChainKit Solves

---

## The Pain

Building on Solana is fragmented by default.

You want to fetch a wallet's token balances, get their transaction history, and look up a token's metadata. Simple stuff. But here's what you actually have to do:

- Import `@solana/web3.js` and set up a `Connection` for raw RPC calls
- Hit Helius or Triton for enhanced indexing and parsed transactions
- Call a separate token metadata API for symbol, name, decimals
- Write a custom fetch wrapper because the response shapes are all different
- Normalize everything yourself because nothing returns the same structure
- Repeat this in every project you build

None of these APIs speak the same language. Different response shapes, different error formats, different conventions, different docs. You're not building your app — you're building infrastructure to talk to infrastructure.

Every Solana dev writes this glue code. Most copy it from their last project. Some publish it as a gist. Nobody should have to write it at all.

---

## The Solution

**ChainKit is that glue — packaged, typed, and ready to go.**

One import. One consistent interface. Clean normalized data out. Whatever RPC or indexing provider you want underneath.

```ts
import { ChainKit } from 'chainkit'

const kit = new ChainKit({ chain: 'solana', rpcUrl: process.env.SOLANA_RPC_URL })

const balances = await kit.getBalances(wallet)
const txns    = await kit.getTransactions(wallet, { limit: 10 })
const token   = await kit.getToken(mint)
```

That's it. No boilerplate. No juggling. No noise.

---

## What's Inside the Kit

Everything below is wrapped behind a single consistent API:

### RPC Layer
| What | Wrapped From |
|---|---|
| Connection management | `@solana/web3.js` — `Connection` |
| Account info | `@solana/web3.js` — `getAccountInfo` |
| SOL balance | `@solana/web3.js` — `getBalance` |
| Raw transaction fetch | `@solana/web3.js` — `getTransaction` |
| Block / slot queries | `@solana/web3.js` — `getSlot`, `getBlock` |

### Token Layer
| What | Wrapped From |
|---|---|
| SPL token balances | `@solana/web3.js` — `getParsedTokenAccountsByOwner` |
| Token account info | `@solana/web3.js` — `getTokenAccountBalance` |
| Token metadata (name, symbol, decimals) | Token Metadata Program / Metaplex |
| Token supply | `@solana/web3.js` — `getTokenSupply` |

### Transaction Layer
| What | Wrapped From |
|---|---|
| Transaction history | Helius `getTransactions` API (enhanced) / native RPC fallback |
| Parsed transaction details | Helius parsed transactions / `@solana/web3.js` |
| Transaction status | `@solana/web3.js` — `getSignatureStatuses` |

### Enhanced Indexing (optional, via provider)
| What | Wrapped From |
|---|---|
| Enriched transaction history | Helius API |
| Webhook-ready event parsing | Helius API |
| High-performance RPC | Triton One / any custom RPC URL |

---

## What ChainKit Is Not

- Not a hosted service — no API keys of its own, no accounts
- Not a replacement for Helius or Triton — it wraps them
- Not opinionated about your framework — works anywhere Node runs
- Not adding extra network calls — one call in, one call out
- Not storing anything — no database, no telemetry, no cloud

---

## Before vs After

| Task | Without ChainKit | With ChainKit |
|---|---|---|
| Get SOL + token balances | 2 different RPC calls, manual normalization | `kit.getBalances(address)` |
| Get transaction history | Helius API call + custom fetch wrapper | `kit.getTransactions(address)` |
| Get token metadata | Metaplex SDK + separate fetch | `kit.getToken(mint)` |
| Swap RPC providers | Rewrite call sites across your app | Change one `rpcUrl` config value |
| TypeScript types on responses | Write your own or go without | Included, full intellisense |
