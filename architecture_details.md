# Wallet Architecture: Ports and Adapters - Details

This document provides a detailed breakdown of the ports and adapters for the multi-layer Bitcoin wallet.

## 1. Driving Ports (API)

These interfaces allow the UI to drive the core logic.

### 1.1. `WalletService` [COMPLETED]
- `createWallet(passphrase: string)`, `loadWallet()`, `lock/unlock`.

### 1.2. `AccountService` [COMPLETED]
- `getAccounts()`, `createAccount()`, `getAccountBalance()`.

### 1.3. `TransactionService` [COMPLETED]
- `createTransaction()`, `signTransaction()`, `broadcastTransaction()`.
- Support for Legacy, SegWit, and Taproot.

### 1.4. `UnifiedBalanceService` [COMPLETED]
- Consolidated view of L1, L2, Sidechain, Ecash, and State Chain balances.

## 2. Driven Ports (SPI)

These interfaces are used by the core to communicate with external systems.

### 2.1. `BlockchainClient` (L1) [COMPLETED]
- `getBalance()`, `getUTXOs()`, `broadcast()`, `getTransactionHistory()`.

### 2.2. `LightningService` (L2) [INITIAL/MOCK]
- `getBalance()`, `createInvoice()`, `payInvoice()`.

### 2.3. `SidechainService` (Liquid/Stacks) [INITIAL/MOCK]
- `getBalance()`, `transferAsset()`.

### 2.4. `EcashService` (L3/Privacy) [INITIAL/MOCK]
- `getBalance()`, `mint()`, `melt()`, `send/receive`.

### 2.5. `StateChainService` [INITIAL/MOCK]
- `getBalance()`, `deposit()`, `transfer()`, `withdraw()`.

### 2.6. `Persistence` [COMPLETED]
- `saveWallet()`, `loadWallet()`. Implementation: `FilePersistence`.

## 3. Adapters (Implemented)

### 3.1. Driving Adapters
- **Web UI:** TypeScript-based SPA in `src/ui/app.ts`.

### 3.2. Driven Adapters
- **BlockstreamClient:** Esplora API integration.
- **ElectrumBlockchainClient:** Electrum protocol integration.
- **LiquidBlockchainClient:** `liquidjs-lib` based balance fetching.
- **FilePersistence:** Local storage with encryption.
- **CryptoWorkerClient:** Offloads crypto to Web Workers.

## 4. Implementation Status Table

| Port | Status | Primary Adapter |
| --- | --- | --- |
| L1 Blockchain | Done | `ElectrumBlockchainClient` / `BlockstreamClient` |
| Key Management| Done | `CryptoWorkerClient` (BIP39/BIP32) |
| Persistence   | Done | `FilePersistence` |
| Lightning     | Mock | `MockLightningClient` (LDK Integration in progress) |
| Sidechains    | Beta | `LiquidBlockchainClient`, `MockLiquidClient` |
| Ecash (L3)    | Mock | `MockEcashClient` |
| State Chains  | Mock | `MockStateChainClient` |
| Oracles       | Mock | `MockOracleClient` |
