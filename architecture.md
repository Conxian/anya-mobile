# Wallet Architecture: Ports and Adapters

## 1. Introduction

This document describes the architecture of the multi-layer Bitcoin wallet. The architecture is based on the **Ports and Adapters (or Hexagonal)** pattern, designed to create a loosely coupled system that is easy to test, maintain, and extend.

## 2. Core Principles

*   **Separation of Concerns:** Core business logic is strictly separated from external infrastructure (blockchains, databases, UIs).
*   **Dependency Inversion:** The core logic depends on abstract interfaces (Ports), while implementations (Adapters) depend on these Ports.
*   **Modularity:** Features are organized into independent modules (e.g., L1, Lightning, Sidechains) that interact through well-defined interfaces.

## 3. Architecture Layers

### 3.1. The Core (Domain)
Contains the essential business rules and data models:
- **Models:** `Account`, `Wallet`, `Transaction`, `Asset`.
- **Services:** `WalletServiceImpl`, `TransactionServiceImpl`, `UnifiedBalanceService`.
- **Ports:** Interfaces for external interaction (e.g., `BlockchainClient`, `Persistence`).

### 3.2. The Ports
Abstract interfaces defining "what" needs to be done, without specifying "how":
- **Driving Ports:** Used by external agents (UI, CLI) to trigger core logic.
- **Driven Ports:** Used by the core to interact with the outside world (Blockchains, Oracles).

### 3.3. The Adapters
Concrete implementations of the Ports:
- **Driving Adapters:** Web UI (TypeScript/HTML), CLI (planned).
- **Driven Adapters:** `ElectrumBlockchainClient`, `BlockstreamClient`, `LiquidBlockchainClient`, `FilePersistence`.

## 4. Current Progress & Next Steps

The architectural foundation is fully established. Most core ports for L1, L2, and Sidechains are defined, and production-ready adapters for L1 are implemented.

**Current Focus:**
- Transitioning Lightning and State Chain adapters from mocks to functional implementations (LDK, Mercury).
- Implementing unified transaction history across all adapters.
