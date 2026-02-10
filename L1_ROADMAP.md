# Bitcoin L1 Development Roadmap

## 1. Executive Summary

This document outlines the strategic roadmap for the development of Bitcoin Layer 1 (L1) functionality. Our goal is to provide a robust, secure, and performant base layer that powers all multi-layer features.

## 2. Current State

The L1 implementation is mature and supports:
*   **Transaction Lifecycle:** Full lifecycle support in `TransactionServiceImpl` for creating, signing, and broadcasting.
*   **Address Types:** Comprehensive support for Legacy (P2PKH), Native SegWit (P2WPKH), and Taproot (P2TR).
*   **Backends:** Production-ready adapters for both Blockstream Esplora and Electrum protocols.
*   **Optimization:** Parallelized raw transaction fetching for Legacy inputs and efficient BIP32 node caching.

## 3. L1 Roadmap: Status & Milestones

### 3.1. **Phase 1: Foundation (COMPLETED)**

*   [x] **Hexagonal Architecture:** Implementation of `BlockchainClient` port and initial adapters.
*   [x] **Native SegWit Support:** Full P2WPKH transaction support.
*   [x] **Secure Key Management:** BIP39 mnemonics and BIP32 derivation in a secure Web Worker.

### 3.2. **Phase 2: Advanced Scripting & Protocols (COMPLETED)**

*   [x] **Taproot (P2TR) Signing:** Support for Schnorr-based Key-path spending using tweaked BIP32 nodes.
*   [x] **Legacy (P2PKH) Optimization:** Optimized signing flow with parallelized pre-fetching of non-witness UTXOs.
*   [x] **Electrum Integration:** Robust `ElectrumBlockchainClient` using `@mempool/electrum-client`.

### 3.3. **Phase 3: Robustness & Scaling (CURRENT)**

*   [x] **Improved Coin Selection:** Transition to accumulative selection for better fee management.
*   [x] **RBF Support (BIP 125):** Core support for transaction replacement by fee.
*   [ ] **Descriptor-Based Wallets:** Transition to output descriptors (BIP 380+) using `@bitcoinerlab/descriptors` for better backup and multi-sig support.
*   [x] **Silent Payments (BIP 352):** Core integration of `@bitcoinerlab/silent-payments` into the ecosystem.
*   [ ] **BIP 322 Support:** Port defined, initial mock implemented for all address types.
*   [ ] **Advanced Coin Selection:** Implementation of Branch and Bound or Knapsack algorithms for fee optimization.

## 4. Next Steps

The immediate focus is transitioning to **Descriptor-based wallets** to simplify account management and prepare for multi-signature support. Additionally, we are working on **Miniscript** integration for complex spending conditions.
