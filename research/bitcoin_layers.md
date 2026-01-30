# Bitcoin Layers Research

This document summarizes the research on different Bitcoin layers to inform the development of a multi-layer Bitcoin wallet.

## Key Bitcoin Layers

### 1. Bitcoin Layer 1 (L1)

*   **Description:** The core Bitcoin blockchain, also known as the mainchain or base layer. It's responsible for validating and finalizing all on-chain transactions.
*   **Strengths:** Security, decentralization, and stability.
*   **Wallet Requirements:**
    *   Standard on-chain transaction capabilities (sending and receiving BTC).
    *   Secure key management.

### 2. Lightning Network

*   **Description:** A Layer 2 solution for fast and cheap micropayments. It uses smart contracts to create off-chain payment channels.
*   **Native Asset:** Lightning Bitcoin (BTC)
*   **Use Cases:** Micropayments, gaming.
*   **Wallet Requirements:**
    *   Ability to open, manage, and close Lightning channels.
    *   Generate and pay Lightning invoices.

### 3. Liquid Network

*   **Description:** A sidechain focused on asset issuance, enabling the creation and transaction of stablecoins, security tokens, and NFTs. It offers faster and more confidential transactions.
*   **Native Asset:** Liquid Bitcoin (L-BTC)
*   **Use Cases:** Asset issuance, private transactions.
*   **Wallet Requirements:**
    *   Support for Liquid assets (L-BTC and other issued assets).
    *   Ability to perform confidential transactions.

### 4. Rootstock (RSK)

*   **Description:** A sidechain that brings EVM-compatible smart contracts to Bitcoin. It uses a process called "merged mining" to leverage Bitcoin's security.
*   **Native Asset:** Smart Bitcoin (RBTC)
*   **Use Cases:** DeFi, data insights.
*   **Wallet Requirements:**
    *   Support for RBTC.
    *   Ability to interact with EVM-compatible smart contracts on the RSK network.

### 5. Stacks

*   **Description:** A programming layer that brings fully-expressive smart contracts to Bitcoin. It has its own consensus mechanism called Proof-of-Transfer.
*   **Native Asset:** Stacks Token (STX)
*   **Use Cases:** DeFi, NFTs, Blockchain Naming Systems.
*   **Wallet Requirements:**
    *   Support for STX.
    *   Ability to interact with Stacks smart contracts written in Clarity.
    *   Ability to read Bitcoin state.

### 6. State Chains (Mercury Layer)

*   **Description:** A Layer 2 solution that allows for the off-chain transfer of UTXO ownership.
*   **Native Asset:** Bitcoin (BTC)
*   **Use Cases:** Instant, private, and low-fee transfers of whole UTXOs.
*   **Wallet Requirements:**
    *   Integration with Mercury Layer SDK.
    *   Management of backup transactions for non-custodial security.

## Summary

A multi-layer Bitcoin wallet needs to support a variety of assets and transaction types across these different layers. The architecture must be modular to accommodate the unique requirements of each layer.
