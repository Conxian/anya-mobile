# Bitcoin L1 Development Roadmap

## 1. Executive Summary

This document outlines a strategic roadmap for the development of the Bitcoin Layer 1 (L1) functionality within the multi-layer wallet. Our objective is to build a secure, robust, and feature-complete L1 wallet that serves as a solid foundation for all other layers.

## 2. Current State

The L1 implementation has progressed significantly:
*   **Transaction Lifecycle:** `TransactionService` is implemented with support for P2WPKH transaction creation, signing, and broadcasting via the `BlockstreamClient`.
*   **Address Type Support:** The `Account` model supports Legacy (P2PKH), Native SegWit (P2WPKH), and Taproot (P2TR) address generation.
*   **Transaction History:** Basic transaction history retrieval is implemented in the `BlockstreamClient`.

## 3. L1 Roadmap: Path to Excellence

The following is a prioritized list of features required to move from an MVP to a best-in-class L1 wallet.

### 3.1. **Priority 1: Multi-Address Type Signing Support**

While we can generate various address types, the `TransactionService` needs to be updated to sign them correctly.

*   **Implement Taproot (P2TR) Signing:** Add support for signing Schnorr-based Taproot inputs.
*   **Implement Legacy (P2PKH) Signing:** Ensure full backward compatibility.

### 3.2. **Priority 2: Robust Infrastructure (Electrum)**

Move away from centralized APIs to improve privacy and reliability.

*   **Implement `ElectrumClient`:** A new adapter for the Electrum protocol.
*   **User-Configurable Nodes:** Allow users to specify their own Electrum server.

### 3.3. **Priority 3: Advanced Logic (BDK Integration)**

*   **Descriptor-Based Wallets:** Move to descriptors for better backup and multi-sig support.
*   **Improved Coin Selection:** Implement more sophisticated algorithms (e.g., Branch and Bound) to optimize for fees and privacy.

## 4. Next Steps

The immediate next step is to implement Taproot signing support in the `TransactionService` and expand the architecture to support L2 and Sidechains.
