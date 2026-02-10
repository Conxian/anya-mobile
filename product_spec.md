# Product Specification: Multi-Layer Bitcoin Wallet

## 1. Introduction

This document outlines the product specifications for a high-performance, multi-layer Bitcoin wallet. The wallet is designed to be a comprehensive and user-friendly platform for interacting with the entire Bitcoin ecosystem, from the base layer to the various Layer 2, sidechain, and state chain solutions.

## 2. Vision

To create a modular, high-performance, and secure Bitcoin wallet that provides native support for all major Bitcoin layers, cross-chain communication, and staking-like functionalities. The wallet utilizes a "Ports and Adapters" architecture to ensure flexibility and avoid a monolithic codebase.

## 3. Core Features

### 3.1. Multi-Layer Support

The wallet provides native support (or planned integration) for:

*   **Bitcoin Layer 1 (L1):** Standard on-chain transactions, secure key management (Legacy, SegWit, Taproot). [COMPLETED]
*   **Lightning Network:** Opening, managing, and closing channels; sending and receiving Lightning payments. [IN PROGRESS]
*   **Liquid Network:** Support for Liquid Bitcoin (L-BTC) and other issued assets; confidential transactions. [ADAPTER IMPLEMENTED]
*   **Stacks:** Support for Stacks (STX) and interaction with Clarity smart contracts. [ADAPTER IMPLEMENTED]

### 3.2. Cross-Chain Functionality

*   **Wormhole Integration:** Seamlessly transfer assets between Bitcoin layers and other blockchains.
*   **Boltz Swaps:** Trustless swaps between L1, Lightning, and Liquid. [PLANNED]

### 3.3. Staking & Unified Balance

*   **Unified Balance:** A consolidated view of Bitcoin wealth across all layers. [COMPLETED]
*   **Stacks "Stacking":** User-friendly interface for locking STX and earning BTC rewards.

### 3.4. Performance & Security

*   **Web Workers:** Cryptographic operations are offloaded to background threads. [COMPLETED]
*   **Parallel Fetching:** Optimized network requests for faster UI updates. [COMPLETED]

## 4. Technical Roadmap

### 4.1. Phase 1 & 2: Foundation (COMPLETED)
*   **Architecture:** Hexagonal architecture with defined ports for all layers.
*   **Security:** AES-GCM encrypted storage and secure BIP32/BIP39 implementation.
*   **L1 Excellence:** Full support for P2WPKH and P2TR.
*   **Unified Balance:** Core logic for consolidating balances across layers.

### 4.2. Phase 3: Lightning, State Chains & Ecash (CURRENT)
*   **LDK Integration:** Transition from mock clients to a functional Lightning Dev Kit (LDK) node (upgraded to v0.122+).
*   **Mercury Layer & Ark:** Implement State Chain and VTXO support.
*   **Ecash & Silent Payments:** Initial implementation of Cashu and BIP 352 protocols.
*   **Message Signing:** Initial port for BIP 322 support.
*   **Unified History:** A consolidated view of all transaction activities across layers.

### 4.3. Phase 4: Advanced Privacy & Swaps
*   **Silent Payments:** Implementation of BIP 352 for improved privacy.
*   **Trustless Swaps:** Integrated Boltz swaps for layer interoperability.
*   **Taproot Assets:** Support for assets issued on the Taproot Assets Protocol.

## 5. User Experience Principles

*   **Keyboard First:** All primary actions accessible via keyboard (Enter key listeners, autofocus).
*   **Clutter-Free:** Hiding empty result containers to maintain a clean UI.
- **Accessibility:** High contrast, explicit focus states, and aria-labels for all interactive elements.
