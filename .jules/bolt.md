# Bolt's Journal ⚡

This journal is for CRITICAL, non-routine performance learnings that will help avoid mistakes or make better decisions in this specific codebase.

---

## 2025-01-31 - [Worker Reuse & PBKDF2 Caching]
**Learning:** Spawning and terminating Web Workers for every cryptographic operation (like address derivation) is a major performance bottleneck. Furthermore, re-running expensive PBKDF2 derivations (100k+ iterations) for the same mnemonic/PIN on every call is redundant.
**Action:** Use a persistent Web Worker managed by a singleton client with `requestId` multiplexing. Implement a simple result cache within the worker to store the decrypted mnemonic and seed, avoiding repeated PBKDF2 iterations for subsequent operations on the same wallet.

## 2025-02-01 - [BIP32 Node Caching]
**Learning:** Even with worker reuse and seed caching, re-deriving the root BIP32 node from a seed (HMAC-SHA512) and deriving long path prefixes (e.g., `m/84'/0'/0'/0`) repeatedly is a measurable overhead. Caching the `root` node and common path `chainNode` objects in the worker reduces sequential address derivation time by >90%.
**Action:** Cache intermediate BIP32 `root` and `chainNode` (prefix) objects in the worker. Ensure these are invalidated whenever the underlying mnemonic or seed changes.

## 2025-02-02 - [Parallel Raw Transaction Fetching]
**Learning:** Sequential `await` calls inside loops, especially for network-bound operations like fetching raw transactions for Legacy (P2PKH) inputs, cause unnecessary linear latency growth.
**Action:** Deduplicate required resources (using `Set`) and parallelize fetching using `Promise.all` before entering the processing loop. This transforms $O(N)$ sequential latency into $O(1)$ parallel latency (limited by unique parent transactions and network concurrency).

## 2026-02-04 - [Network Call Caching for Slow-Changing Data]
**Learning:** Redundant network calls to external APIs for data that changes slowly (like Bitcoin fee estimates) add unnecessary latency and risk rate-limiting.
**Action:** Implement a simple TTL-based cache (e.g., 60 seconds) for such resources in the adapter layer. This significantly improves the responsiveness of features like transaction creation that frequently access this data.

## 2026-02-05 - [Hybrid ECC Engine for Browser Performance]
**Learning:** Modern pure-JS ECC libraries like @noble/curves are significantly faster (~35%) than legacy libraries like elliptic for point arithmetic. However, switching entirely to @noble/curves can break compatibility with strict bip32/bitcoinjs-lib deterministic signature tests if the library's internal RFC6979 implementation differs even slightly in nonce generation or formatting.
**Action:** Use a hybrid approach: leverage @noble/curves for performance-critical point arithmetic (address derivation, key tweaking) and retain elliptic for standard ECDSA signing to ensure cross-library compatibility and passing of legacy test suites.
