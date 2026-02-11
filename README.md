# Multi-Layer Bitcoin Wallet

This project is a high-performance, multi-layer Bitcoin wallet designed to provide a comprehensive and user-friendly platform for interacting with the entire Bitcoin ecosystem. It supports everything from the Bitcoin base layer (L1) to various Layer 2, sidechain, and state chain solutions.

## 🏗️ Architecture

The wallet follows a **Ports and Adapters (Hexagonal)** architecture. This design decouples core business logic from external services (blockchains, oracles, persistence), ensuring the system is:
- **Testable:** Core logic can be tested in isolation with mocks.
- **Maintainable:** Clear separation of concerns.
- **Extensible:** New layers or service providers can be added by implementing new adapters.

## 🚀 Key Features

- **Multi-Layer Support:** Native integration for L1 (Legacy, SegWit, Taproot), Lightning Network, Liquid, and Stacks.
- **Unified Balance:** A consolidated view of assets across all layers.
- **Secure by Design:** AES-GCM encryption for sensitive data, pure-JS ECC engine, and Web Worker-based cryptography.
- **Performance Optimized:** Parallelized network requests and efficient address derivation.
- **Advanced Privacy:** Built-in support for Silent Payments (BIP 352) and Ecash (Cashu).
- **Decentralized Frontend:** Proof-of-concept for hosting on IPFS and Fleek.

## 🛠️ Technologies & Stack ("Don't Recreate the Wheel")

- **Core:** TypeScript, `bitcoinjs-lib` (v7), `liquidjs-lib`, `@stacks/transactions`.
- **L2/State Chains:** `lightningdevkit` (LDK), Boltz, Mercury Layer.
- **Privacy:** `@bitcoinerlab/silent-payments`, `@cashu/cashu-ts`.
- **Networking:** Electrum protocol (`@mempool/electrum-client`), Blockstream Esplora.
- **Cryptography:** Hybrid ECC engine (`elliptic`, `@noble/curves`), Web Crypto API.
- **Frontend:** Pure HTML5/CSS3/TypeScript, no heavy framework overhead.
- **Build/Test:** `esbuild`, `Jest`, `pnpm`.

## 📈 Current Status

The project is now in **Phase 3**:
- [x] **Core Infrastructure:** Hexagonal architecture and secure key management.
- [x] **L1 Excellence:** Full support for P2WPKH and P2TR (Taproot) with Electrum/Esplora backends.
- [x] **Advanced Privacy:** Native integration for Silent Payments (BIP 352).
- [x] **Unified Balance:** Consolidated view of assets across L1, L2, Liquid, Ecash, State Chains, and Ark.
- [ ] **Lightning Integration:** Transitioning to full LDK-WASM (^0.122.0) implementation.
- [ ] **State Chains:** Transitioning to real Mercury Layer and Ark SDKs.

## 🚦 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/multi-layer-bitcoin-wallet.git
   cd multi-layer-bitcoin-wallet
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Build the application:
   ```bash
   node build.js
   ```

4. Run tests:
   ```bash
   pnpm test
   ```

## 🧪 Testing

We maintain high test coverage across core logic and adapters:
```bash
pnpm test          # Run all tests
pnpm test:watch    # Run tests in watch mode
```

## 🌐 Decentralized Web App

The application is configured for a fully decentralized stack:
- **Storage:** IPFS
- **Hosting:** Fleek
- **Domain:** Handshake (configured)
