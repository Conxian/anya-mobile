# Bolt's Journal ⚡

This journal is for CRITICAL, non-routine performance learnings that will help avoid mistakes or make better decisions in this specific codebase.

---

## 2025-01-31 - [Worker Reuse & PBKDF2 Caching]
**Learning:** Spawning and terminating Web Workers for every cryptographic operation (like address derivation) is a major performance bottleneck. Furthermore, re-running expensive PBKDF2 derivations (100k+ iterations) for the same mnemonic/PIN on every call is redundant.
**Action:** Use a persistent Web Worker managed by a singleton client with `requestId` multiplexing. Implement a simple result cache within the worker to store the decrypted mnemonic and seed, avoiding repeated PBKDF2 iterations for subsequent operations on the same wallet.
