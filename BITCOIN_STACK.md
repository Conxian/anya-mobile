# Bitcoin Best-in-Class Stack Manifest

This document defines the "Best-in-Class" technology stack for building a full-featured, multi-layer Bitcoin wallet. Each choice is justified by its adherence to standards, security, and developer ecosystem support.

## 1. Layer 1: Base Layer (Bitcoin)

*   **Primary Tool:** `bitcoinjs-lib` (v7.0.0+)
*   **Why:** The most mature and widely used Bitcoin library in the JavaScript ecosystem. v7 provides robust support for Taproot (P2TR), PSBT (v0 and v2), and Schnorr signatures.
*   **Advanced Alternative:** **BDK (Bitcoin Development Kit)**. While powerful for descriptors and multi-sig, its WASM integration in browser environments can be complex. We prioritize `bitcoinjs-lib` for its stability and lightweight nature while keeping BDK as a future migration target for advanced descriptor management.

## 2. Layer 2: Lightning Network

*   **Primary Tool:** **LDK (Lightning Development Kit)**
*   **Why:** Designed specifically for wallet integration. Unlike a standalone node (like LND or Core Lightning), LDK allows the wallet to manage its own networking and storage, making it ideal for non-custodial mobile and web applications.
*   **Strategic Choice:** Breez SDK (Greenlight) for a faster "Node-as-a-Service" path if full LDK channel management becomes too resource-intensive for the target platform.

## 3. Sidechains & Smart Contracts

### 3.1. Liquid Network
*   **Primary Tool:** `liquidjs-lib`
*   **Why:** The official JavaScript library for the Liquid Network. Essential for supporting Confidential Transactions, Issued Assets (L-BTC, USDT), and fast (1-minute) finality.

### 3.2. Stacks (sBTC)
*   **Primary Tool:** `@stacks/transactions`
*   **Why:** Provides the necessary tools for interacting with the Stacks blockchain, Clarity smart contracts, and the sBTC bridge, enabling Bitcoin-backed decentralized applications.

### 3.3. Rootstock (RSK)
*   **Primary Tool:** `ethers.js` or `viem` with Rootstock network configuration.
*   **Why:** RSK is EVM-compatible. Using standard Ethereum tooling is the "best-in-class" approach for smart contract interaction on Bitcoin's oldest sidechain.

## 4. State Chains (Privacy & Off-chain Transfer)

*   **Primary Tool:** **Mercury Layer SDK**
*   **Why:** Enables the transfer of UTXO ownership without on-chain transactions, providing high privacy and zero-fee transfers after the initial deposit.

## 5. Cross-Layer Interoperability (Swaps)

*   **Primary Tool:** **Boltz SDK (`boltz-core`)**
*   **Why:** The industry standard for trustless Submarine Swaps (L1 <-> Lightning) and cross-chain swaps. Critical for a "Unified Balance" experience.

## 6. Infrastructure & Privacy

*   **Node Communication:** `@mempool/electrum-client` for decentralized, privacy-preserving access to the Bitcoin network via Electrum servers.
*   **Oracles:** `@pythnetwork/hermes-client` for real-time, low-latency price feeds from the Pyth network.
*   **Security:** Web Crypto API for hardware-accelerated, secure cryptographic operations (AES-GCM for storage).
*   **Performance:** Offloading all heavy crypto (signing, derivation) to **Web Workers** via `CryptoWorkerClient`.

## 7. Unified Balance Engine (The Goal)

The ultimate "Best Full Bitcoin Wallet" must abstract these layers into a single, cohesive interface. The **Unified Balance Engine** aggregates balances from all the above sources to provide the user with their total Bitcoin net worth across the entire ecosystem.
