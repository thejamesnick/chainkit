# ChainKit — Demo Ideas

Demos that show what ChainKit can do in the least amount of code.
Each one is a standalone proof that the kit works — and a project in its own right.

Two formats for every demo:
- **CLI** — fastest to build, great for devs
- **UI** — more shareable, better for showing off, better for Twitter/X

---

## 1. Wallet Inspector
**"Drop in any Solana address, get everything about it"**

**CLI:**
```bash
chainkit inspect GsbwXfJraMomNxBcjYLcG3mxkBUiyWXAB8fck9eiHaWB
```
```
Address:     GsbwXf...HaWB
SOL:         12.4 SOL ($1,860)
Tokens:      USDC 500.00 | JUP 1,200 | BONK 4,200,000
Last tx:     2 mins ago — success
Total txns:  1,847
```

**UI:**
Single page web app. Paste any wallet address → live dashboard:
- SOL balance + USD value
- Token holdings as cards with logos
- Recent transactions as a feed
- Total portfolio value at the top
- Shareable link per wallet (`/wallet/GsbwXf...`)

Stack: Next.js + ChainKit. Screenshot-worthy, great for Twitter/X.

---

## 2. Portfolio Tracker
**"Live portfolio value for any wallet"**

**CLI:**
```bash
chainkit portfolio GsbwXfJraMomNxBcjYLcG3mxkBUiyWXAB8fck9eiHaWB
```
```
SOL        12.40    $1,860.00
USDC       500.00   $500.00
JUP        1,200    $840.00
BONK       4.2M     $126.00
─────────────────────────────
Total:               $3,326.00
```

**UI:**
Full portfolio dashboard:
- Pie chart of token allocation
- Holdings table with live USD prices
- Total value in big numbers at the top
- 24h change indicator (green/red)
- Transaction history feed below

Stack: Next.js + ChainKit + recharts. This is `heliushack` rebuilt in a fraction of the code.

---

## 3. Wallet Generator
**"Create a fresh Solana wallet"**

**CLI:**
```bash
chainkit wallet create
# → address, mnemonic, saves keyfile + QR
```

**UI:**
Clean one-pager:
- "Generate Wallet" button → shows address + masked mnemonic
- "Reveal mnemonic" toggle
- Download encrypted keyfile button
- QR code of public address
- "Copy address" button
- Warning banner: back up your mnemonic

Stack: React + ChainKit. No backend — fully client-side.

---

## 4. Swap Quote Widget
**"Best swap price across all Solana DEXs"**

**CLI:**
```bash
chainkit quote 1 SOL USDC
```
```
Swapping 1 SOL → USDC via Jupiter
Best route:   Raydium → Orca (2 hops)
You get:      149.82 USDC
Price impact: 0.02%
```

**UI:**
Embeddable swap widget:
- Two token selectors with search + logos
- Amount input → live quote updates as you type
- Route breakdown (which DEXs it hops through)
- Price impact warning
- "Connect wallet + swap" button (Phase 2)

Stack: React + ChainKit. Embeddable in any Solana app.

---

## 5. Devnet Playground
**"Spin up a funded test wallet instantly"**

**CLI:**
```bash
chainkit devnet new
# → creates wallet, airdrops 2 SOL, saves keyfile
```

**UI:**
Devnet faucet + wallet tool:
- "Create devnet wallet" button → generates keypair + airdrops SOL
- Shows address, balance, QR code
- Download keyfile button
- "Inspect wallet" link → opens Wallet Inspector

Stack: React + ChainKit. Every Solana dev needs this daily.

---

## 6. Token Explorer
**"Everything about any token"**

**CLI:**
```bash
chainkit token USDC
```
```
USD Coin (USDC)
Mint:    EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
Price:   $1.00  |  Supply: 4,821,903,442
```

**UI:**
Search bar → token profile page:
- Logo, name, symbol, price
- Market cap + supply
- Price chart
- Top holders (Phase 2)

Stack: Next.js + ChainKit.

---

## 7. Transaction Feed
**"Live transaction stream for any wallet"**

**CLI:**
```bash
chainkit txns GsbwXf...HaWB --limit 5
```
```
✅  5KtPn...  2 mins ago    fee: 0.000005 SOL
✅  3mXqR...  14 mins ago   fee: 0.000005 SOL
❌  9pLwT...  1 hour ago    fee: 0.000005 SOL  (failed)
```

**UI:**
Live auto-refreshing feed:
- Each tx as a card — status, fee, timestamp, type
- Failed txs highlighted in red
- Click any tx → full detail view
- Filter by success / failed

Stack: React + ChainKit + polling.

---

## 8. NFT Floor Price Tracker
**"Live floor prices for Solana collections"**

**CLI:**
```bash
chainkit floor degods
# → DeGods — Floor: 18.5 SOL ($2,775) | 24h vol: 142 SOL
```

**UI:**
Collection dashboard:
- Search any collection
- Floor price + 24h change
- Volume + sales count
- Recent sales feed
- NFT grid

Stack: Next.js + ChainKit (Magic Eden). Phase 2.

---

## Priority Order

| # | Demo | Format | Why first |
|---|---|---|---|
| 1 | Wallet Inspector | UI + CLI | Covers most Phase 1 API, looks great, shareable |
| 2 | Portfolio Tracker | UI | Real use case, retrofits heliushack |
| 3 | Wallet Generator | UI | Shows wallet module end-to-end |
| 4 | Swap Quote Widget | UI | Shows Jupiter, embeddable |
| 5 | Devnet Playground | UI + CLI | Every dev needs this daily |
| 6 | Token Explorer | UI | Simple, fast to build |
| 7 | Transaction Feed | UI | Good for showing normalized data |
| 8 | NFT Floor Tracker | UI | Phase 2 — Magic Eden |

---

**The play:** build the Wallet Inspector UI first. One input box, full wallet dashboard. Screenshot it, post it — that's your ChainKit launch tweet.
