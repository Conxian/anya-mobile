# Bitcoin Development Environment Review: Full Stack Manifest

This document provides a comprehensive review of the development environment and defines the "Best-in-Class" stack for building a full-featured, multi-layer Bitcoin wallet.

## 1. Vision: The Best Full Bitcoin Wallet

To achieve the goal of being the best full Bitcoin wallet, we support:
- **All Layers**: L1, Lightning (L2), Sidechains (Liquid, Stacks), and State Chains (Mercury, Ark).
- **Advanced Protocols**: Taproot, Miniscript, Musig2, Silent Payments, Ecash.
- **Self-Sovereignty**: Non-custodial by default, optional self-hosting of backends (Electrum, Lightning nodes).

## 2. Best-in-Class Tool Selection

### 2.1. Layer 1 (Base Layer) & Advanced Scripting
*   **Primary Tool:** `bitcoinjs-lib` (v7)
*   **Integration:** Full support for P2PKH, P2WPKH, and P2TR (Taproot).
*   **Advanced Features:**
    *   **Miniscript:** For complex spending conditions and multi-sig policies.
    *   **Musig2:** For efficient n-of-n multi-signature schemes (BIP 327).
    *   **Silent Payments:** For reusable, privacy-preserving payment addresses (BIP 352).
*   **Status:** Production-ready (Miniscript/Musig2/Silent Payments in integration).

### 2.2. Layer 2 (Lightning Network)
*   **Primary Tool:** **lightningdevkit (LDK)**
*   **Integration:** Enhanced `LightningService` port with channel management; mock implementation updated.
*   **Status:** Functional Skeleton (LDK WASM upgrade in progress).

### 2.3. Layer 3 & Privacy (Silent Payments & Ecash)
*   **Tools:** **@bitcoinerlab/silent-payments** & **Cashu (SDK placeholder)**
*   **Integration:** New `SilentPaymentService` and `EcashService` ports defined with initial mock adapters.
*   **Status:** Newly Integrated (Phase 3 acceleration).

### 2.4. Sidechains (Liquid Network)
*   **Primary Tool:** **liquidjs-lib**
*   **Integration:** `LiquidBlockchainClient` adapter implemented for balance and transaction history.
*   **Status:** Beta.

### 2.5. State Chains & Swaps
*   **Tools:** **mercury-layer-sdk**, **Ark**, & **boltz-core**
*   **Integration:** `StateChainService` port defined; initial Mercury SDK configuration added to `package.json`.
*   **Protocols:**
    *   **Mercury Layer:** Instant off-chain UTXO transfers.
    *   **Ark:** Trustless off-chain payments via virtual UTXOs.
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
