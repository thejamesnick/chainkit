# ChainKit Stack

> HACK #3 — thejamesnick HACK Series

---

## Runtime & Language

| Layer | Choice | Why |
|---|---|---|
| Runtime | Node.js (ESM) | Server-side first — browser support Phase 2 |
| Language | TypeScript | Type safety, full intellisense on chain responses |
| Build | `tsc` | Straight compile to `dist/` |

---

## Dependencies

Minimal by design. One runtime dep for Phase 1:

| Package | Role |
|---|---|
| `@solana/web3.js` | Solana RPC client — official SDK, handles connection + serialization |

Everything else uses Node built-ins (`fetch`, `crypto`).

---

## Entry Points

| Import | What's exposed |
|---|---|
| `chainkit` | `ChainKit` class — full API |
| `chainkit/solana` | Solana chain module directly |

---

## Chains (Phase 1)

| Chain | Provider | Notes |
|---|---|---|
| Solana | `@solana/web3.js` | Direct RPC — bring your own endpoint |

---

## Dev Commands

```bash
npm install       # install deps
npm run build     # tsc → dist/
npm run test      # vitest --run
```

---

## Distribution

```bash
npm install chainkit
```

Sub-path exports declared in `package.json` — bundlers and Node resolve the right file automatically.

---

**Solana-first. Chain-agnostic by design.** ⛓️
