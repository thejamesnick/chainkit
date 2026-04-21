import { describe, expect, it } from 'vitest'
import { ChainKit } from '../../index.js'

// Integration tests — only run when RUN_INTEGRATION=true
// Usage: RUN_INTEGRATION=true npm test
const RUN = process.env.RUN_INTEGRATION === 'true'
const maybeIt = RUN ? it : it.skip

describe('devnet integration', () => {
  maybeIt(
    'full wallet lifecycle: create → airdrop → getBalances → transfer',
    async () => {
      const kit = new ChainKit({ chain: 'solana', network: 'devnet' })

      // 1. Create two wallets
      const sender = kit.createWallet()
      const receiver = kit.createWallet()

      expect(kit.wallet.isValid(sender.publicKey)).toBe(true)
      expect(kit.wallet.isValid(receiver.publicKey)).toBe(true)

      // 2. Airdrop to sender
      const airdropResult = await kit.airdrop(sender.publicKey, 1)
      expect(airdropResult.signature).toBeTruthy()
      expect(airdropResult.amount).toBe(1)

      // 3. Wait for confirmation — Devnet can be slow
      await new Promise((r) => setTimeout(r, 5000))

      // 4. Check balance
      const balances = await kit.getBalances(sender.publicKey)
      expect(balances.sol).toBeGreaterThan(0)
      expect(balances.sol).toBeLessThanOrEqual(2) // 1 SOL airdropped, fee taken

      // 5. Transfer SOL to receiver
      const txSig = await kit.transfer({
        from: sender,
        to: receiver.publicKey,
        amount: 0.1,
      })
      expect(txSig).toBeTruthy()

      // 6. Wait and verify receiver got the funds
      await new Promise((r) => setTimeout(r, 5000))
      const receiverBalances = await kit.getBalances(receiver.publicKey)
      expect(receiverBalances.sol).toBeGreaterThan(0)

      // 7. Check transaction history
      const txns = await kit.getTransactions(sender.publicKey, { limit: 5 })
      expect(txns.length).toBeGreaterThan(0)
      expect(txns[0].status).toBe('success')
    },
    60_000, // 60 second timeout for devnet
  )
})
