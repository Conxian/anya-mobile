# Implementation Plan: Multi-Layer Bitcoin Wallet

This document outlines the implementation plan for the multi-layer Bitcoin wallet.

## Overall Progress

- [X] **Phase 1: Core Logic & Infrastructure**
- [X] **Phase 1.5: Decentralized Web App PoC**
- [X] **Phase 2: Bitcoin L1 Excellence**
- [/] **Phase 3: Lightning & State Chains (IN PROGRESS)**
- [ ] **Phase 4: Advanced Privacy & Swaps**

---

## Phase 1: Core Logic and Basic Infrastructure [COMPLETED]

*   **Goal:** To implement the core logic of the wallet and set up basic infrastructure.
*   **Tasks:**
    *   [X] Project Setup: Initialize structure, build system, and dependencies.
    *   [X] Core Data Structures: `Wallet`, `Account`, `Transaction`, `Asset`.
    *   [X] Driving Ports: `WalletService`, `AccountService`, `TransactionService`.
    *   [X] Driven Ports: `BlockchainClient`, `OracleClient`, `Persistence`.
    *   [X] Basic Adapters: `FilePersistence`, `MockBlockchainClient`.
    *   [X] Unit Testing: Comprehensive coverage for core logic.

## Phase 2: Bitcoin L1 Excellence & UI [COMPLETED]

*   **Goal:** Add robust support for Bitcoin L1 and create the SPA frontend.
*   **Tasks:**
    *   [X] Bitcoin L1 Adapters: `BlockstreamClient` (Esplora) and `ElectrumBlockchainClient`.
    *   [X] Taproot Support: P2TR signing and address generation.
    *   [X] GUI Setup: TypeScript SPA in `public/` with `esbuild`.
    *   [X] Crypto Offloading: `CryptoWorkerClient` for responsive UI.
    *   [X] Unified Balance: Consolidated view of all layers via `UnifiedBalanceService`.

## Phase 3: Lightning & State Chains [IN PROGRESS]

*   **Goal:** Add functional support for Lightning Network and Mercury Layer State Chains.
*   **Tasks:**
    *   [X] Define Ports: `LightningService`, `StateChainService`, `EcashService`.
    *   [X] Unified Balance: Support for all 5 layers in `UnifiedBalanceService`.
    *   [/] Lightning Integration: Transition from `MockLightningClient` to functional LDK-WASM node.
    *   [ ] State Chain Integration: Implement functional Mercury Layer client.
    *   [ ] Multi-Layer History: Consolidate transaction history from all adapters.

## Phase 4: Advanced Privacy & Swaps [PLANNED]

*   **Goal:** Enhance privacy and interoperability.
*   **Tasks:**
    *   [ ] Silent Payments: BIP 352 implementation.
    *   [ ] Boltz Swaps: Trustless L1/L2/Sidechain swaps.
    *   [ ] Hardware Wallet Support: Ledger and Trezor integration.
    *   [ ] Miniscript: Support for complex spending conditions.
