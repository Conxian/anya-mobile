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
*   **Integration:** Integrated `bitcoinjs-lib` for core transaction construction and signing, including full Taproot Key-path spending support.
*   **Recommendation:** For more advanced features like Descriptor-based wallets and robust UTXO management, consider integrating **BDK (Bitcoin Development Kit)** via WASM.

### 2.2. Layer 2 (Lightning Network)
*   **Tool:** **lightningdevkit (LDK)**
*   **Status:** Installed and ready for integration.
*   **Recommendation:** Use LDK for a non-custodial Lightning implementation. It is designed to be integrated into wallets, providing full control over the Lightning node's behavior.

### 2.3. Sidechains (Liquid Network)
*   **Tool:** **liquidjs-lib**
*   **Status:** Installed.
*   **Reasoning:** Official JS library for Liquid, supporting confidential transactions and issued assets.

### 2.4. State Chains & Swaps
*   **Tools:** **Mercury Layer SDK** & **boltz-core**
*   **Status:** `boltz-core` installed for trustless swaps between layers.
*   **Reasoning:** Boltz enables seamless interoperability between L1, Lightning, and Liquid.

### 2.5. Stacks & Smart Contracts
*   **Tool:** **@stacks/transactions**
*   **Status:** Installed.
*   **Reasoning:** Essential for interacting with the Stacks layer and sBTC, providing tools for Clarity smart contract interaction.

## 3. Infrastructure & Privacy
*   **Electrum Protocol:** Integrated `@mempool/electrum-client` in `src/adapters/electrum-client.ts`. This allows the wallet to connect to any Electrum server, enhancing privacy and decentralization.
*   **Web Workers:** Use Web Workers for all cryptographic operations to keep the UI responsive (implemented via `CryptoWorkerClient`).
*   **Secure Storage:** Use Web Crypto API (AES-GCM) for encrypting sensitive data with a user-defined PIN (implemented via `SecureStorageService`).

## 4. Architectural Roadmap

### Phase 1: Foundation (Current)
- [x] Hexagonal Architecture (Ports & Adapters)
- [x] Secure Key Management (Encrypted Mnemonic)
- [x] Basic L1 Support (P2WPKH)

### Phase 2: Multi-Layer Expansion
- [x] Implement `LightningService` and `SidechainService` ports.
- [x] Add Taproot (P2TR) support to L1 (Key-path spending).
- [x] Integrate `liquidjs-lib` (via `LiquidBlockchainClient`).
- [x] Robust pure-JS ECC engine (replacement for WASM-based tiny-secp256k1).

### Phase 3: Lightning & State Chains (Next Session)
- [ ] Integrate LDK-WASM for Lightning channels.
- [ ] Integrate Mercury Layer for State Chain coins.
- [ ] Implement multi-layer transaction history.

### Phase 4: Advanced UX & Privacy
- [ ] Implement Silent Payments (BIP 352).
- [x] Unified multi-layer balance view (via `UnifiedBalanceService`).
- [ ] In-wallet swaps between layers (Boltz).

By adhering to this manifest, we ensure that the wallet remains at the cutting edge of Bitcoin technology, providing users with the most powerful and secure tools available.
