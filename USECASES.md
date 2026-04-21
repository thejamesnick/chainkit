# ChainKit — Use Cases

Who builds with ChainKit and what they build.

---

## Who Uses ChainKit

### Solana App Developers
Building dApps and need wallet data, token balances, transaction history without wiring up 5 different APIs.

### Hackathon Builders
Need to move fast. ChainKit removes the setup tax — one import and you're querying the chain.

### Trading Bot Developers
Fetch prices, monitor wallets, execute swaps via Jupiter — all from one consistent interface.

### Backend Developers New to Solana
Don't know which API does what. ChainKit gives them one thing to learn instead of five.

### Portfolio / Analytics Tools
Aggregate wallet data, transaction history, PnL across tokens — exactly what `heliushack` was doing manually.

### Wallet App Developers
Create wallets, manage keypairs, sign and send transactions — full wallet lifecycle in one SDK.

### NFT App Developers
Browse collections, check floor prices, verify ownership, fetch metadata — Magic Eden + DAS wrapped cleanly.

### Game / Reward System Developers
Token transfers, balance checks, airdrop mechanics — all the on-chain primitives needed for in-game economies.

### Telegram / Discord Bot Developers
Wallet lookups, price alerts, swap execution, balance checks — all callable from a bot handler.

---

## Use Case Examples

### 1. Portfolio Tracker
```ts
const kit = new ChainKit({ chain: 'solana', rpcUrl: process.env.RPC_URL })

const balances = await kit.getBalances(walletAddress)
const txns = await kit.getTransactions(walletAddress, { limit: 50 })
const prices = await Promise.all(
  balances.tokens.map(t => kit.getPrice(t.mint))
)
```

### 2. Swap Integration
```ts
const quote = await kit.getSwapQuote({
  inputMint: 'So11111111111111111111111111111111111111112',  // SOL
  outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  amount: 1_000_000_000, // 1 SOL in lamports
})

const tx = await kit.swap(quote, wallet)
```

### 3. Wallet Creation
```ts
const wallet = kit.createWallet()
console.log(wallet.publicKey)   // base58 address
console.log(wallet.mnemonic)    // 12-word seed phrase

// Export it
const keyfile = kit.wallet.exportKeyfile(wallet, 'my-password')
const qr = await kit.wallet.exportQR(wallet.publicKey)
```

### 4. NFT Floor Price Bot
```ts
const stats = await kit.getCollectionStats('degods')
console.log(`DeGods floor: ${stats.floorPrice} SOL`)
```

### 5. Token Transfer
```ts
await kit.transfer({
  from: wallet,
  to: recipientAddress,
  amount: 0.5, // SOL
})
```

### 6. Devnet Testing
```ts
const wallet = kit.createWallet()
await kit.airdrop(wallet.publicKey, 2) // 2 SOL on devnet
```

---

## Projects That Would Use ChainKit

| Project Type | ChainKit Features Used |
|---|---|
| DeFi dashboard | `getBalances`, `getTransactions`, `getPrice`, `getSwapQuote` |
| Trading bot | `getPrice`, `swap`, `getTransactions`, `watch` |
| NFT marketplace | `getNFT`, `getCollection`, `getFloorPrice`, `getListings` |
| Portfolio tracker | `getBalances`, `getTransactions`, `getToken`, `getPrice` |
| Wallet app | `createWallet`, `restoreWallet`, `transfer`, `sign`, `exportKeyfile` |
| Hackathon project | Everything — one import, zero setup headache |
| Analytics tool | `getTransactions`, `getAccount`, `getToken` |
| Telegram/Discord bot | `getBalances`, `getPrice`, `getFloorPrice` |
| Game / rewards | `transfer`, `getBalances`, `airdrop` |
