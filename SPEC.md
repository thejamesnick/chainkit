# ChainKit Spec

> HACK #3 — thejamesnick HACK Series
> Phase 1: Solana. Universal SDK wrapper — one interface, all the chain APIs. Ship fast. 🔥

---

## Problem Statement

Building on Solana is fragmented by default.

You need `@solana/web3.js` for raw RPC calls, Helius or Triton for enhanced indexing, a separate fetch wrapper for token metadata, and something else again for NFTs. None of these APIs speak the same language — different response shapes, different error formats, different conventions.

Every Solana project ends up writing the same glue code. You copy it from your last project, patch it, and move on. It's not hard — it's just noise that gets in the way of building the actual thing.

**ChainKit removes that noise.**

---

## What It Solves

| Without ChainKit | With ChainKit |
|---|---|
| 3–5 different imports for basic data | One import, one pattern |
| Raw RPC responses full of noise | Clean normalized shapes |
| Rewriting boilerplate every project | `kit.getBalances()` and you're done |
| Locked into one provider's API shape | Swap RPC endpoints freely |
| No TypeScript types on responses | Full intellisense out of the box |

---

## What We're Building

A unified SDK that abstracts over fragmented blockchain APIs. Solana first.

ChainKit sits on top of whatever RPC or indexing provider you choose — `@solana/web3.js`, Helius, Triton, your own node — and gives you one consistent interface regardless. One call in, clean data out. No extra network hops, no hidden calls, no overhead worth measuring.

It's not a platform. It's not a service. It's a thin, smart wrapper that makes the fragmented stuff feel like one thing.

---

## Who Uses This

- Solana app devs who want to move fast without infra headaches
- Hackathon builders who need data fast and don't want to read 5 docs
- Backend devs new to Solana who don't know which API to use for what
- Anyone who's copy-pasted the same RPC boilerplate more than twice

---

## Stack

| Layer | Choice | Why |
|---|---|---|
| Language | TypeScript | Type safety, full intellisense on chain responses |
| Runtime | Node.js (ESM) | Server-side first, browser support Phase 2 |
| Solana | `@solana/web3.js` | Official SDK — used as the base layer |
| Build | `tsc` | Straight compile to `dist/` |
| Distribution | `npm publish` | Drop-in for any project |

---

## File Structure

```
chainkit/
├── src/
│   ├── index.ts                  # Main ChainKit class + re-exports
│   ├── types.ts                  # Shared types: ChainKitConfig, BalanceResult, TxResult, etc.
│   ├── chains/
│   │   └── solana/
│   │       ├── index.ts          # Solana chain entry point
│   │       ├── client.ts         # Solana RPC client wrapper
│   │       ├── accounts.ts       # getBalances(), getAccount()
│   │       ├── transactions.ts   # getTransactions(), getTransaction()
│   │       └── tokens.ts         # getToken(), getTokenAccounts()
│   └── core/
│       ├── normalize.ts          # Response normalizers — raw → clean shape
│       └── errors.ts             # ChainKit error types
├── dist/                         # compiled output (gitignored)
├── SPEC.md                       # this file
├── STACK.md                      # stack breakdown
├── README.md                     # user-facing docs
├── HACKLEARN.md                  # lessons learned
├── package.json
└── tsconfig.json
```

---

## API Design

### Init

```ts
import { ChainKit } from 'chainkit'

const kit = new ChainKit({
  chain: 'solana',
  rpcUrl: process.env.SOLANA_RPC_URL!,
  apiKey: process.env.HELIUS_API_KEY,  // optional — unlocks enhanced endpoints
})
```

### Accounts

```ts
await kit.getBalances(address: string): Promise<BalanceResult>
await kit.getAccount(address: string): Promise<AccountResult>
```

### Transactions

```ts
await kit.getTransactions(address: string, opts?: TxQueryOptions): Promise<TxResult[]>
await kit.getTransaction(signature: string): Promise<TxResult>
```

### Tokens

```ts
await kit.getToken(mint: string): Promise<TokenResult>
await kit.getTokenAccounts(address: string): Promise<TokenAccountResult[]>
```

---

## Normalized Return Shapes

```ts
interface BalanceResult {
  sol: number
  tokens: TokenBalance[]
  raw: unknown
}

interface TokenBalance {
  mint: string
  symbol: string
  amount: number
  decimals: number
  uiAmount: number
}

interface TxResult {
  signature: string
  timestamp: number
  status: 'success' | 'failed'
  fee: number
  raw: unknown
}

interface TokenResult {
  mint: string
  name: string
  symbol: string
  decimals: number
  supply: number
  raw: unknown
}
```

---

## Provider System (Phase 2)

Phase 1 uses `@solana/web3.js` directly. Phase 2 introduces a provider abstraction so you can swap Helius, Triton, or any RPC without changing app code:

```ts
// Phase 2 concept
const kit = new ChainKit({
  chain: 'solana',
  provider: heliusProvider({ apiKey: '...' }),
})
```

---

## Phase 1 Scope

- [x] `ChainKit` class with Solana support
- [x] `getBalances()` — SOL + SPL token balances
- [x] `getAccount()` — account info
- [x] `getTransactions()` — transaction history with pagination
- [x] `getTransaction()` — single tx by signature
- [x] `getToken()` — token metadata by mint
- [x] `getTokenAccounts()` — all token accounts for a wallet
- [x] Normalized return shapes with `raw` escape hatch
- [x] TypeScript types exported
- [x] `chainkit/solana` sub-path export

## Out of Scope (Phase 1)

- No browser/client-side entry point (Phase 2)
- No provider abstraction layer (Phase 2)
- No EVM / Ethereum support (Phase 2)
- No WebSocket / subscription support (Phase 2)
- No NFT-specific methods (Phase 2)
- No React hooks (Phase 3)

---

## Phase 2+

- Browser-safe entry point (`chainkit/client`)
- Provider abstraction (Helius, Triton, custom RPC)
- Ethereum / EVM chain support
- WebSocket subscriptions
- NFT methods
- React hooks package (`chainkit/react`)
