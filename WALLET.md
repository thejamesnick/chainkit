# ChainKit — Wallet Module

Everything for creating, restoring, managing, and exporting Solana wallets.
All powered by `@solana/web3.js` + `bip39` under the hood — wrapped into one clean interface.

---

## Create a Wallet

```ts
const wallet = kit.wallet.create()
```

Returns:
```ts
{
  publicKey: string        // base58 address — share this freely
  secretKey: Uint8Array    // raw private key bytes — keep secret
  mnemonic: string         // 12-word seed phrase — keep secret
}
```

---

## Restore a Wallet

### From seed phrase (mnemonic)
```ts
const wallet = kit.wallet.restore(mnemonic)
// "word1 word2 word3 ... word12"
```

### From secret key (raw bytes)
```ts
const wallet = kit.wallet.fromSecretKey(secretKeyBytes)
```

### From base58 private key string
```ts
const wallet = kit.wallet.fromBase58(base58PrivateKey)
```

---

## Validate

```ts
// Check if an address is valid
kit.wallet.isValid('SomeBase58Address')  // true | false

// Validate a mnemonic
kit.wallet.isMnemonic('word1 word2 ...')  // true | false
```

---

## Export

### Export as Keyfile (encrypted JSON)
Standard Solana CLI-compatible keyfile format. Password-protected.

```ts
const keyfile = kit.wallet.exportKeyfile(wallet, 'your-password')
// Returns JSON string — save to file

// Save directly to disk
await kit.wallet.saveKeyfile(wallet, 'my-wallet.json', 'your-password')
```

### Export as Base58 Private Key
```ts
const base58Key = kit.wallet.exportBase58(wallet)
// Importable into Phantom, Backpack, Solflare
```

### Export as Raw Secret Key Array
```ts
const keyArray = kit.wallet.exportArray(wallet)
// [12, 34, 56, ...] — standard Solana CLI format
```

### Export as QR Code
```ts
// Public key QR — safe to share (for receiving funds)
const qr = await kit.wallet.exportQR(wallet.publicKey)
// Returns base64 PNG string

// Save QR to file
await kit.wallet.saveQR(wallet.publicKey, 'my-wallet-qr.png')
```

### Export Mnemonic as QR Code
```ts
// WARNING: contains private key info — never share
const qr = await kit.wallet.exportMnemonicQR(wallet.mnemonic)
```

---

## Import

### Import from Keyfile
```ts
const wallet = await kit.wallet.importKeyfile('my-wallet.json', 'your-password')
```

### Import from Phantom / Backpack (base58 private key)
```ts
const wallet = kit.wallet.fromBase58(base58PrivateKey)
```

---

## Sign & Send

### Sign a transaction
```ts
const signed = await kit.wallet.sign(transaction, wallet)
```

### Send SOL
```ts
const signature = await kit.transfer({
  from: wallet,
  to: recipientAddress,
  amount: 0.5,  // in SOL
})
```

### Send SPL Token
```ts
const signature = await kit.transferToken({
  from: wallet,
  to: recipientAddress,
  mint: tokenMintAddress,
  amount: 100,  // in token units
})
```

### Airdrop (devnet / testnet only)
```ts
await kit.airdrop(wallet.publicKey, 2)  // 2 SOL
```

---

## Keypair Utilities

```ts
// Generate a vanity address (starts with specific prefix)
const wallet = await kit.wallet.vanity('HACK')  // slow — brute force
// { publicKey: 'HACKxyz...', ... }

// Derive a child keypair from mnemonic + path
const wallet = kit.wallet.derive(mnemonic, "m/44'/501'/0'/0'")
```

---

## Security Notes

- `secretKey` and `mnemonic` never leave your machine — ChainKit has no server, no telemetry
- Keyfile exports are AES-256 encrypted with your password
- QR exports of public key are safe to share — QR exports of mnemonic are not
- Vanity address generation is local brute force — no external calls

---

## Full Wallet Lifecycle Example

```ts
import { ChainKit } from 'chainkit'

const kit = new ChainKit({ chain: 'solana', rpcUrl: process.env.RPC_URL })

// 1. Create
const wallet = kit.wallet.create()
console.log('Address:', wallet.publicKey)
console.log('Mnemonic:', wallet.mnemonic)  // back this up!

// 2. Fund on devnet
await kit.airdrop(wallet.publicKey, 2)

// 3. Check balance
const balances = await kit.getBalances(wallet.publicKey)
console.log('SOL:', balances.sol)

// 4. Send SOL
await kit.transfer({ from: wallet, to: 'RecipientAddress', amount: 0.5 })

// 5. Export for backup
await kit.wallet.saveKeyfile(wallet, './my-wallet.json', 'strong-password')
const qr = await kit.wallet.exportQR(wallet.publicKey)

// 6. Restore later
const restored = await kit.wallet.importKeyfile('./my-wallet.json', 'strong-password')
```
