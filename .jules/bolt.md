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

## 2025-05-15 - [Script Hash Caching in Electrum Adapters]
**Learning:** Repetitive address-to-scripthash conversions (decoding, script construction, hashing) are a hidden CPU bottleneck in wallets that frequently query balance, UTXOs, and history for the same set of addresses. Caching these deterministic results in the adapter layer can speed up subsequent lookups by >2000x.
**Action:** Implement a `Map`-based cache for script hashes in any adapter that uses the Electrum protocol (`blockchain.scripthash.*` methods).

## 2025-05-16 - [Redundant ECC Point Serialization]
**Learning:** In Taproot (BIP 341) operations, deriving the X-only public key and parity from a point using separate calls to `toBytes(true)` (compressed) and `toBytes(false)` (uncompressed) is redundant and expensive. The compressed format already contains the parity in its first byte and the X-coordinate in the subsequent 32 bytes.
**Action:** Call `res.toBytes(true)` once. Use the first byte to determine parity (`0x02` is even/0, `0x03` is odd/1) and slice bytes 1 to 33 for the X-only public key. This reduced `xOnlyPointAddTweak` latency by ~50% in benchmarks.

## 2026-02-06 - [Direct BigInt Coordinate Access for Parity]
**Learning:** Checking the parity of an ECC point using `P.y & 1n` is significantly faster (~30x) than serializing the point to bytes and checking the first byte (`P.toBytes(true)[0]`). Similarly, extracting the X-coordinate directly using `numberToBytesBE(P.x, 32)` avoids the overhead of full point serialization.
**Action:** Use direct BigInt coordinate access for parity checks and coordinate extraction in performance-critical ECC operations like Taproot/Schnorr tweaking.

## 2026-02-07 - [Optimized Decimal to Satoshi Conversion]
**Learning:** Standard string `split` and `padEnd` operations combined with BigInt exponentiation (`10n ** BigInt(8)`) introduce significant overhead when processing many balances or transaction amounts.
**Action:** Use `indexOf` and `slice` to avoid array allocations, and implement a pre-calculated `POWERS_OF_10` lookup table to eliminate repeated exponentiation. Early returns for common zero values further reduce latency. This improved `toSats` performance by ~2x for typical values and >50x for zero.
