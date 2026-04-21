# ChainKit — Providers & APIs

Every API, SDK, and service that ChainKit wraps into one place.
This is the full ecosystem we're abstracting — so devs never have to juggle all of this themselves.

---

## 1. @solana/web3.js

**What it is:** The official Solana JavaScript SDK. Low-level RPC client.
**The pain:** Verbose, raw responses full of noise. No normalization, no DX sugar.

| Method | ChainKit exposes as |
|---|---|
| `connection.getBalance()` | `kit.getBalances()` — SOL portion |
| `connection.getParsedTokenAccountsByOwner()` | `kit.getBalances()` — tokens portion |
| `connection.getAccountInfo()` | `kit.getAccount()` |
| `connection.getTransaction()` | `kit.getTransaction()` |
| `connection.getSignaturesForAddress()` | `kit.getTransactions()` |
| `connection.getTokenSupply()` | `kit.getToken()` — supply field |
| `connection.getSignatureStatuses()` | `kit.getTransaction()` — status field |

Docs: https://solana-labs.github.io/solana-web3.js

---

## 2. Helius

**What it is:** Enhanced Solana RPC + indexing. Parsed transactions, webhooks, token metadata, NFT data, DAS API.
**The pain:** Separate API key, separate base URL, different response shape from everything else.

| Helius Endpoint | ChainKit exposes as |
|---|---|
| `GET /v0/transactions` | `kit.getTransactions()` — enriched mode |
| `POST /v0/token-metadata` | `kit.getToken()` — name, symbol, image |
| `getAsset` (DAS) | `kit.getNFT()` — Phase 2 |
| `getAssetsByOwner` (DAS) | `kit.getNFTs()` — Phase 2 |
| Webhooks | `kit.watch()` — Phase 2 |

Activate: pass your Helius RPC URL as `rpcUrl` — ChainKit detects and unlocks enhanced endpoints.

Docs: https://docs.helius.dev

---

## 3. Jupiter (Swap + Price)

**What it is:** The dominant Solana swap aggregator. Routes trades across every DEX on Solana for best price. Also provides token prices.
**The pain:** Separate API entirely, quote → order → execute flow, different from everything else in your app.

| Jupiter Endpoint | ChainKit exposes as |
|---|---|
| `GET /quote` | `kit.getSwapQuote(inputMint, outputMint, amount)` |
| `POST /swap` | `kit.swap(quote, wallet)` |
| `GET /price` | `kit.getPrice(mint)` |
| `GET /tokens` | `kit.getTokenList()` — Jupiter verified token list |

Docs: https://dev.jup.ag

---

## 4. Metaplex / Token Metadata Program

**What it is:** The standard for NFT and token metadata on Solana. On-chain program storing name, symbol, URI, image.
**The pain:** Requires deserializing on-chain account data or pulling in the heavy `@metaplex-foundation/js` SDK.

| Data | ChainKit exposes as |
|---|---|
| Token name, symbol, decimals | `kit.getToken()` |
| Token URI / image | `kit.getToken()` — uri field |
| NFT metadata | `kit.getNFT()` — Phase 2 |
| Collection info | `kit.getCollection()` — Phase 2 |

Docs: https://docs.metaplex.com/programs/token-metadata

---

## 5. Metaplex DAS API (Digital Asset Standard)

**What it is:** Unified API for querying all digital assets on Solana — tokens, NFTs, compressed NFTs — via a single interface.
**The pain:** Only available through enhanced RPC providers (Helius, QuickNode), different method names per provider.

| DAS Method | ChainKit exposes as |
|---|---|
| `getAsset` | `kit.getAsset(id)` — Phase 2 |
| `getAssetsByOwner` | `kit.getAssets(owner)` — Phase 2 |
| `getAssetsByCollection` | `kit.getCollection(id)` — Phase 2 |
| `searchAssets` | `kit.searchAssets(query)` — Phase 2 |

Docs: https://github.com/metaplex-foundation/digital-asset-standard-api

---

## 6. Raydium

**What it is:** Solana's largest AMM and liquidity protocol. Pools, farming, swaps.
**The pain:** Separate SDK (`@raydium-io/raydium-sdk`), complex pool math, different from Jupiter's API.

| Raydium Feature | ChainKit exposes as |
|---|---|
| Pool info | `kit.getPool(poolId)` — Phase 2 |
| Liquidity positions | `kit.getLiquidity(wallet)` — Phase 2 |
| Farm rewards | `kit.getFarmRewards(wallet)` — Phase 2 |

Docs: https://docs.raydium.io

---

## 7. Orca (Whirlpools)

**What it is:** Concentrated liquidity AMM on Solana. Whirlpool positions, tick-based liquidity.
**The pain:** Separate `@orca-so/whirlpools-sdk`, complex position math, different API from Raydium.

| Orca Feature | ChainKit exposes as |
|---|---|
| Whirlpool info | `kit.getPool(poolId)` — Phase 2 |
| Position details | `kit.getPosition(positionId)` — Phase 2 |

Docs: https://orca-so.gitbook.io/orca-developer-portal

---

## 8. Magic Eden

**What it is:** Largest Solana NFT marketplace. Listings, sales, collection stats, floor prices.
**The pain:** Separate REST API, API key required, completely different from on-chain data sources.

| Magic Eden Endpoint | ChainKit exposes as |
|---|---|
| Collection stats | `kit.getCollectionStats(symbol)` — Phase 2 |
| Floor price | `kit.getFloorPrice(symbol)` — Phase 2 |
| Listings | `kit.getListings(mint)` — Phase 2 |
| Activity / sales | `kit.getNFTActivity(mint)` — Phase 2 |

Docs: https://api.magiceden.dev

---

## 9. QuickNode

**What it is:** High-performance RPC infrastructure + add-ons (Priority Fees API, DAS, token data).
**The pain:** Just an RPC endpoint — all call logic still on you. Add-ons have their own method names.

ChainKit treats QuickNode as a drop-in RPC URL. Enhanced add-ons surface through the same ChainKit methods automatically.

```ts
const kit = new ChainKit({
  chain: 'solana',
  rpcUrl: 'https://your-endpoint.quiknode.pro/your-key',
})
```

Docs: https://www.quicknode.com/docs/solana

---

## 10. Triton One

**What it is:** Dedicated high-performance Solana RPC nodes. Enterprise-grade uptime and speed.
**The pain:** Just an RPC URL — all call logic still on you.

Drop-in `rpcUrl` replacement. No extra config needed.

Docs: https://triton.one

---

## 11. Jupiter Token Registry / Token List

**What it is:** Community-maintained registry of verified Solana tokens — name, symbol, logo, decimals.
**The pain:** Static JSON, needs fetching and caching, not always current for new tokens.

Used as a fast fallback in `kit.getToken()` for known tokens before hitting on-chain metadata.

Registry: https://token.jup.ag/all

---

## Summary

| Provider | Phase | Required | Activate |
|---|---|---|---|
| `@solana/web3.js` | 1 | ✅ Always | Built-in |
| Helius | 1 | Optional | Pass Helius URL as `rpcUrl` |
| Jupiter Swap + Price | 1 | Optional | Auto — no extra config |
| Metaplex Token Metadata | 1 | Optional | Auto-used when needed |
| Metaplex DAS API | 2 | Optional | Via Helius / QuickNode |
| Raydium | 2 | Optional | Pass `rpcUrl` |
| Orca Whirlpools | 2 | Optional | Pass `rpcUrl` |
| Magic Eden | 2 | Optional | Pass `apiKey` |
| QuickNode | 1 | Optional | Pass QuickNode URL as `rpcUrl` |
| Triton One | 1 | Optional | Pass Triton URL as `rpcUrl` |
| Jupiter Token Registry | 1 | Optional | Auto-used as fallback |

---

**The rule:** ChainKit never forces a provider. Bring your own RPC URL — core functionality always works.
Enhanced features unlock automatically when a capable provider is detected.
