# Research: Full Inter-Bitcoin Support & Turnkey SDK Solutions

This document outlines the findings for achieving "best-in-class" full Bitcoin functionality across all layers and states, utilizing the most robust turnkey SDKs available.

## 1. Lightning Network (Layer 2)

### 1.1. LDK (Lightning Development Kit)
- **Status:** Strategic choice for Anya-Core.
- **WASM Support:** High. Ideal for browser-based, non-custodial wallets.
- **Turnkey Level:** Medium-Low. Requires handling channel state and networking, but provides total flexibility.
- **Key Advantage:** Industry-standard for custom Lightning implementations.

### 1.2. Breez SDK (Greenlight)
- **Status:** Evaluation for turnkey alternative.
- **Model:** Nodes-as-a-Service (Greenlight). Users hold keys, Breez handles infrastructure.
- **Turnkey Level:** High. Simplifies LSP (Liquidity Service Provider) management, channel opening, and swapping.
- **Recommendation:** Best for rapid scaling if the infrastructure overhead of LDK is too high.

### 1.3. Phoenix SDK
- **Model:** Eclair-based, focuses on simplicity and trustless swaps.
- **Recommendation:** Great reference for UX, but Breez SDK offers better cross-platform support for web/mobile integration.

## 2. Sidechains & Smart Contracts

### 2.1. Liquid Network (`liquidjs-lib`)
- **Status:** Implemented in Anya-Core.
- **Functionality:** Confidential transactions, issued assets (L-BTC, USDT).
- **Key Benefit:** Fast finality (1 min) and privacy.

### 2.2. Rootstock (RSK)
- **Tooling:** `rsk-ethers` or standard Web3 tools.
- **Functionality:** EVM-compatible smart contracts secured by Bitcoin merge-mining.
- **Recommendation:** Use for DeFi-heavy features requiring Solidity support.

### 2.3. Stacks (sBTC)
- **Tooling:** `@stacks/transactions`.
- **Functionality:** Trustless BTC bridge to a smart contract layer.
- **Status:** Strategic adoption for Bitcoin-native smart contracts without merge-mining dependencies.

## 3. State Chains (Privacy & Efficiency)

### 3.1. Mercury Layer SDK
- **Status:** Formal adoption.
- **Concept:** Instant transfer of UTXO ownership without on-chain transactions.
- **Turnkey Level:** Low. New technology requiring specialized SDK integration.
- **Benefit:** Offers a middle ground between L1 and Lightning for high-value private transfers.

## 4. Cross-Layer Interoperability (The "Glue")

### 4.1. Boltz SDK
- **Service:** Trustless Submarine Swaps (L1 <-> Lightning) and Cross-Chain Swaps.
- **Turnkey Level:** High. Provides simple API for swapping between layers.
- **Strategic Importance:** Critical for unified balance UX (e.g., spending L1 balance at a Lightning merchant).

### 4.2. Deezy / Peer-to-Peer Swaps
- **Service:** Fast channel opening and L1-to-Lightning liquidity.

## 5. Summary Table: Turnkey SDK Rankings

| Feature | Primary SDK | Alternative | Anya-Core Status |
| :--- | :--- | :--- | :--- |
| **L1 Core** | `bitcoinjs-lib` | BDK (WASM) | ✅ Implemented (w/ Taproot) |
| **Lightning** | `lightningdevkit` (LDK) | Breez SDK | ✅ Installed / Ready |
| **Liquid** | `liquidjs-lib` | Vulpem Tools | ✅ Installed / Ready |
| **State Chains** | Mercury Layer | - | 📅 Planned (Phase 3) |
| **Smart Contracts** | `@stacks/transactions` | Rootstock | ✅ Installed / Ready |
| **Swaps** | `boltz-core` | Deezy | ✅ Installed / Ready |

## 6. Strategic Recommendations for Next Steps

1.  **Unified Balance Engine:** Create a core module that aggregates balances from L1, Lightning (channels + Greenlight), Liquid, and Mercury Layer.
2.  **Turnkey Lightning:** Start with **Breez SDK** for an MVP "one-click" Lightning experience, then expand to **LDK** for advanced power-user features.
3.  **Boltz Integration:** Implement Boltz swaps early to ensure users never feel "stuck" in a specific layer.
