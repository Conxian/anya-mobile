# Bitcoin Development Environment Review: Full Stack Manifest

This document provides a comprehensive review of the development environment and defines the "Best-in-Class" stack for building a full-featured, multi-layer Bitcoin wallet.

## 1. Vision: The Best Full Bitcoin Wallet

To achieve the goal of being the best full Bitcoin wallet, we support:
- **All Layers**: L1, Lightning (L2), Sidechains (Liquid, Stacks), and State Chains.
- **Advanced Protocols**: Taproot, Miniscript, Musig2, Silent Payments.
- **Self-Sovereignty**: Non-custodial by default, optional self-hosting of backends (Electrum, Lightning nodes).

## 2. Best-in-Class Tool Selection

### 2.1. Layer 1 (Base Layer)
*   **Primary Tool:** `bitcoinjs-lib` (v7)
*   **Integration:** Full support for P2PKH, P2WPKH, and P2TR (Taproot).
*   **Status:** Production-ready.

### 2.2. Layer 2 (Lightning Network)
*   **Primary Tool:** **lightningdevkit (LDK)**
*   **Integration:** Mock clients implemented; LDK integration in progress.
*   **Status:** Active Development.

### 2.3. Sidechains (Liquid Network)
*   **Primary Tool:** **liquidjs-lib**
*   **Integration:** `LiquidBlockchainClient` adapter implemented for balance and transaction history.
*   **Status:** Beta.

### 2.4. State Chains & Swaps
*   **Tools:** **Mercury Layer SDK** & **boltz-core**
*   **Integration:** `StateChainService` port defined with mock adapter; Boltz integration planned for Phase 4.
*   **Status:** Planning/Mock.

### 2.5. Stacks & Smart Contracts
*   **Tool:** **@stacks/transactions**
*   **Integration:** Core support for STX balances and basic transaction signing.
*   **Status:** Beta.

## 3. Infrastructure & Performance
*   **Backends:** Multi-backend support for Blockstream Esplora and Electrum (`@mempool/electrum-client`).
*   **Parallelism:** `UnifiedBalanceService` parallelizes requests across layers to minimize latency.
*   **Crypto Offloading:** Web Workers (`CryptoWorkerClient`) ensure UI responsiveness during heavy tasks like BIP39 derivation.
*   **Caching:** Multi-level caching for mnemonics, seeds, and BIP32 nodes to reduce derivation time.

## 4. Architectural Roadmap Progress

### Phase 1 & 2: Foundation & Multi-Layer (COMPLETED)
- [x] Hexagonal Architecture (Ports & Adapters)
- [x] Secure Key Management (Encrypted Mnemonic & AES-GCM)
- [x] Full L1 Support (Legacy, SegWit, Taproot)
- [x] Multi-layer Adapters (Liquid, Stacks, Lightning - Mock/Initial)
- [x] Unified Balance Service

### Phase 3: Lightning & State Chains (CURRENT)
- [ ] Integrate LDK-WASM for functional Lightning channels.
- [ ] Transition from mock to real Mercury Layer implementation.
- [ ] Unified multi-layer transaction history.

### Phase 4: Advanced UX & Privacy (PLANNED)
- [ ] Silent Payments (BIP 352).
- [ ] In-wallet trustless swaps (Boltz).
- [ ] Hardware wallet integration (Ledger/Trezor).

By adhering to this manifest, the wallet remains at the cutting edge of Bitcoin technology, providing users with the most powerful and secure tools available.
