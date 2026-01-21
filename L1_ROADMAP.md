# Bitcoin L1 Development Roadmap

## 1. Executive Summary

This document outlines a strategic roadmap for the development of the Bitcoin Layer 1 (L1) functionality within the multi-layer wallet. Our objective is to build a secure, robust, and feature-complete L1 wallet that serves as a solid foundation for all other layers. The current implementation, while architecturally sound, is in an early, non-functional state. This roadmap prioritizes the features required to achieve a Minimum Viable Product (MVP) for the L1 wallet.

## 2. Current State

Our gap analysis revealed that the existing L1 implementation lacks the following critical components:

*   **Transaction Lifecycle:** No services for creating, signing, or broadcasting transactions.
*   **Address Type Support:** Hardcoded for native SegWit (P2WPKH) addresses only.
*   **Transaction History:** Inability to retrieve a user's transaction history.

Our dependency evaluation confirmed that our core libraries (`bitcoinjs-lib`, `bip32`, `axios`) are modern, well-maintained, and suitable for our needs. Therefore, this roadmap focuses on implementation rather than tooling changes.

## 3. L1 Roadmap: Path to MVP

The following is a prioritized list of features required to build out the L1 wallet.

### 3.1. **Priority 1: Implement the Transaction Lifecycle**

This is the most critical missing piece and should be the immediate focus of development.

*   **Implement `TransactionService`:**
    *   **UTXO Management:** Fetch and manage UTXOs for an address.
    *   **Coin Selection:** Implement a basic coin selection algorithm to choose UTXOs for a transaction.
    *   **Transaction Construction:** Build a transaction with inputs, outputs, and a change address.
    *   **Fee Calculation:** Integrate with the `BlockstreamClient` to calculate transaction fees.
    *   **Transaction Signing:** Sign the transaction using the account's private key.
    *   **Transaction Broadcasting:** Broadcast the signed transaction using the `BlockstreamClient`.

### 3.2. **Priority 2: Add Comprehensive Address Support**

To ensure full compatibility with the Bitcoin ecosystem, we must support multiple address types.

*   **Extend `AccountService`:**
    *   Add support for generating Legacy (P2PKH) and Taproot (P2TR) addresses, in addition to the existing native SegWit (P2WPKH) support.
    *   Modify the derivation paths and address generation logic to accommodate these new address types.

### 3.3. **Priority 3: Implement Transaction History**

A user-facing wallet must be able to display a user's transaction history.

*   **Enhance `BlockstreamClient`:**
    *   Add a method to fetch the full transaction history for a given address.
    *   Implement robust error handling and pagination to manage large transaction histories.

## 4. Next Steps

The immediate next step is to begin the implementation of the `TransactionService` as outlined in Priority 1 of this roadmap. This will be a significant undertaking, but it is the most critical step toward building a functional L1 wallet.