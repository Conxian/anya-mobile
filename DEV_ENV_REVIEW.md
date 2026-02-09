# Bitcoin Development Environment Review: Full Stack Manifest

This document provides a comprehensive review of the development environment and defines the "Best-in-Class" stack for building a full-featured, multi-layer Bitcoin wallet.

## 1. Vision: The Best Full Bitcoin Wallet

To achieve the goal of being the best full Bitcoin wallet, we support:
- **All Layers**: L1, Lightning (L2), Sidechains (Liquid, Stacks), and State Chains (Mercury, Ark).
- **Advanced Protocols**: Taproot, Miniscript, Musig2, Silent Payments, Ecash.
- **Self-Sovereignty**: Non-custodial by default, optional self-hosting of backends (Electrum, Lightning nodes).

## 2. Best-in-Class Tool Selection (The "Don't Recreate the Wheel" Stack)

We prioritize using the most robust, well-maintained, and performant libraries in the ecosystem.

### 2.1. Layer 1 (Base Layer) & Advanced Scripting
*   **Primary Tool:** `bitcoinjs-lib` (v7) - The industry standard for JavaScript Bitcoin development.
*   **Advanced Features:**
    *   **Miniscript:** Use `@bitcoinerlab/descriptors` for complex spending conditions.
    *   **Musig2:** BIP 327 implementation for efficient multi-sig.
    *   **Silent Payments:** `@bitcoinerlab/silent-payments` (BIP 352).
*   **Signer:** `bip32` for hierarchical deterministic keys.
*   **ECC Engine:** Hybrid engine (Noble Curves + Elliptic) optimized with `DataView` for high-performance BigInt operations.

### 2.2. Layer 2 (Lightning Network)
*   **Primary Tool:** **lightningdevkit (LDK)** via LDK-WASM.
*   **Why:** Provides a flexible, modular Lightning node implementation without the overhead of a full `lnd` or `cln` instance in the browser.
*   **Status:** Integrating LDK-WASM v0.122+.

### 2.3. Layer 3 & Privacy (Silent Payments & Ecash)
*   **Tools:** **@bitcoinerlab/silent-payments** & **@cashu/cashu-ts**
*   **Why:** Native JS implementations of the latest privacy protocols.
*   **Status:** Silent Payments (Production-ready integration); Ecash (Beta).

### 2.4. Sidechains (Liquid Network)
*   **Primary Tool:** **liquidjs-lib**
*   **Integration:** Full support for Confidential Transactions and Issued Assets.

### 2.5. State Chains & Swaps
*   **Tools:** **mercury-layer-sdk** & **boltz-core**
*   **Why:** Mercury for instant UTXO transfers; Boltz for trustless cross-layer swaps.

### 2.6. Stacks & Smart Contracts
*   **Tool:** **@stacks/transactions**
*   **Integration:** Native STX support and Clarity contract interaction.

## 3. Infrastructure & Performance Manifest

*   **Networking:** Hybrid Electrum (`@mempool/electrum-client`) + Esplora (REST) for maximum uptime and censorship resistance.
*   **Parallelism:** Sequential requests are prohibited for core flows (balances, history). All network calls must be parallelized.
*   **Crypto Security:** All heavy cryptographic operations (PBKDF2, BIP32 derivation) MUST happen in a Web Worker to keep the UI at 60fps.
*   **Precision:** Financial math MUST use `BigInt` (satoshis) to avoid floating-point errors.

## 4. Architectural Roadmap Progress

### Phase 1 & 2: Foundation & Multi-Layer (COMPLETED)
- [x] Hexagonal Architecture (Ports & Adapters)
- [x] Secure Key Management (Encrypted Mnemonic & AES-GCM)
- [x] Full L1 Support (Legacy, SegWit, Taproot)
- [x] Multi-layer Adapters (Liquid, Stacks, Lightning - Mock/Initial)
- [x] Unified Balance Service

### Phase 3: Lightning & State Chains (CURRENT)
- [x] Real Silent Payments integration (BIP 352).
- [x] Full Unified Balance across 5 layers (L1, L2, Sidechain, Ecash, State Chain).
- [ ] Transition LDK Mock to real LDK-WASM.
- [ ] Transition Mercury Mock to real `mercury-layer-sdk`.

### Phase 4: Advanced UX & Privacy (PLANNED)
- [ ] In-wallet trustless swaps (Boltz).
- [ ] Hardware wallet integration (Ledger/Trezor).
- [ ] Taproot Assets (TAP) support.
