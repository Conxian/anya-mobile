# Bitcoin Development Environment Review: Full Stack Manifest

This document provides a comprehensive review of the development environment and defines the "Best-in-Class" stack for building a full-featured, multi-layer Bitcoin wallet.

## 1. Vision: The Best Full Bitcoin Wallet

To achieve the goal of being the best full Bitcoin wallet, we must support:
- **All Layers**: L1, Lightning (L2), Sidechains (Liquid, Rootstock), and State Chains.
- **Advanced Protocols**: Taproot, Miniscript, Musig2, Silent Payments.
- **Self-Sovereignty**: Non-custodial by default, optional self-hosting of backends (Electrum, Lightning nodes).

## 2. Best-in-Class Tool Selection

### 2.1. Layer 1 (Base Layer)
*   **Current Tool:** `bitcoinjs-lib`
*   **Status:** Excellent for JS-based environments. Mature, stable, and widely used.
*   **Recommendation:** Continue using `bitcoinjs-lib` for core transaction construction and signing. For more advanced features like Descriptor-based wallets and robust UTXO management, consider integrating **BDK (Bitcoin Development Kit)** via WASM.
*   **Reasoning:** `bitcoinjs-lib` provides the flexibility needed for custom script construction, while BDK offers a higher-level API for complex wallet logic.

### 2.2. Layer 2 (Lightning Network)
*   **Tool:** **LDK (Lightning Development Kit)**
*   **Recommendation:** Use LDK-WASM for a non-custodial Lightning implementation in the browser.
*   **Reasoning:** LDK is designed to be integrated into wallets, providing full control over the Lightning node's behavior while abstracting the complexity of the protocol.

### 2.3. Sidechains (Liquid Network)
*   **Tool:** **liquidjs-lib**
*   **Recommendation:** Integrate `liquidjs-lib` for native Liquid support.
*   **Reasoning:** It is the official JS library for Liquid, supporting confidential transactions and issued assets (L-BTC, USDT, etc.).

### 2.4. State Chains
*   **Tool:** **Mercury Layer SDK**
*   **Recommendation:** Integrate the Mercury Layer protocol for instant, private, and low-fee transfers of UTXOs.
*   **Reasoning:** Mercury Layer is the leading implementation of State Chains, offering a unique middle ground between L1 and Lightning.

### 2.5. Stacks & Smart Contracts
*   **Tool:** **@stacks/transactions**
*   **Recommendation:** Use `@stacks/transactions` for interacting with the Stacks layer and sBTC.
*   **Reasoning:** It provides the necessary tools for Clarity smart contract interaction and Stacks-specific transaction signing.

## 3. Infrastructure & Privacy
*   **Electrum Protocol:** Replace centralized APIs (like Blockstream.info) with an Electrum client. This allows users to connect to their own nodes (e.g., Electrs, Fulcrum), significantly improving privacy and reliability.
*   **Web Workers:** Use Web Workers for all cryptographic operations to keep the UI responsive (implemented via `CryptoWorkerClient`).
*   **Secure Storage:** Use Web Crypto API (AES-GCM) for encrypting sensitive data with a user-defined PIN (implemented via `SecureStorageService`).

## 4. Architectural Roadmap

### Phase 1: Foundation (Current)
- [x] Hexagonal Architecture (Ports & Adapters)
- [x] Secure Key Management (Encrypted Mnemonic)
- [x] Basic L1 Support (P2WPKH)

### Phase 2: Multi-Layer Expansion
- [ ] Implement `LightningService` and `SidechainService` ports.
- [ ] Add Taproot (P2TR) support to L1.
- [ ] Integrate `liquidjs-lib`.

### Phase 3: Lightning & State Chains
- [ ] Integrate LDK-WASM for Lightning channels.
- [ ] Integrate Mercury Layer for State Chain coins.

### Phase 4: Advanced UX & Privacy
- [ ] Implement Silent Payments.
- [ ] Unified multi-layer balance view.
- [ ] In-wallet swaps between layers.

By adhering to this manifest, we ensure that the wallet remains at the cutting edge of Bitcoin technology, providing users with the most powerful and secure tools available.
