# State Chains Research: Mercury Layer

This document summarizes the research on State Chains, specifically focusing on the Mercury Layer protocol, and its integration into the multi-layer Bitcoin wallet.

## 1. What are State Chains?

State Chains are a Layer 2 scaling solution for Bitcoin that allows for the off-chain transfer of UTXO ownership. Unlike the Lightning Network, which uses payment channels, State Chains enable the transfer of the *entire* UTXO to a new owner without an on-chain transaction.

### Key Concepts:
*   **Blind Signing:** The server (Statechain Entity) helps sign transactions without knowing what it's signing or the private keys.
*   **Eltoo/SIGHASH_ANYPREVOUT (Future):** While currently implemented using complex multi-sig/ECDSA tricks, future improvements like Taproot and Anyprevout will make State Chains even more efficient.
*   **Mercury Layer:** The primary implementation of State Chains today.

## 2. Benefits of State Chains

*   **Instant Transfers:** Off-chain transfers are nearly instantaneous.
*   **Low Fees:** Only on-chain transactions (deposit/withdraw) incur Bitcoin network fees. Off-chain transfers are extremely cheap or free.
*   **Privacy:** Off-chain transfers are not visible on the Bitcoin blockchain.
*   **Full UTXO Control:** Users retain control over the UTXO, and the Statechain Entity cannot steal funds (non-custodial).
*   **Scalability:** Thousands of transfers can occur off-chain for a single on-chain UTXO.

## 3. Mercury Layer Integration

Mercury Layer is the most mature implementation of State Chains.

### Technical Requirements:
*   **Mercury SDK:** Integration with the Mercury Layer client-side SDK (typically Rust with WASM/TS bindings).
*   **Statechain Entity (SE):** The wallet must communicate with an SE to facilitate transfers.
*   **Backup Management:** Robust management of "backup transactions" to ensure funds can be recovered if the SE goes offline.

### Wallet Workflow:
1.  **Deposit:** User sends BTC to a specialized multi-sig address (controlled by user + SE).
2.  **Transfer:** User sends a "statebolt" or similar off-chain message to the recipient, transferring the "state" of the UTXO.
3.  **Withdraw:** The current owner of the state chain coin closes the state chain and receives the BTC on-chain.

## 4. Best-in-Class Tools

*   **Mercury Layer SDK:** The primary tool for interacting with Mercury State Chains.
*   **Specialized Oracles:** For monitoring SE availability and state.

## 5. Conclusion

State Chains offer a unique middle ground between the Lightning Network and on-chain transactions, particularly well-suited for high-value transfers that require privacy and speed without the complexity of managing Lightning channels. Integrating Mercury Layer will significantly enhance the wallet's multi-layer capabilities.
