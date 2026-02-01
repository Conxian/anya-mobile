# Multi-Layer Bitcoin Wallet

This project is a multi-layer Bitcoin wallet that aims to provide a comprehensive and user-friendly platform for interacting with the entire Bitcoin ecosystem. It supports multiple layers, including Layer 1 (on-chain), Layer 2 (Lightning Network), Sidechains (Liquid), and State Chains.

## Architecture

The wallet is designed with a "Ports and Adapters" (or Hexagonal) architecture. This architecture separates the core logic of the wallet from the external services it interacts with, making the system loosely coupled, easy to test, maintain, and extend.

## Decentralized Web App

A proof-of-concept for a decentralized web application version of the wallet has been implemented. This version utilizes a fully decentralized stack for storage and hosting.

### Technologies

*   **Storage:** IPFS
*   **Hosting:** Fleek
*   **Domain:** Handshake

### Current Status

The project is actively expanding its multi-layer capabilities.

*   **Layer 1:** Robust transaction management using `bitcoinjs-lib` with support for Legacy, SegWit, and Taproot.
*   **Lightning:** Ports and domain models defined; mock adapter for development.
*   **Sidechains:** `liquidjs-lib` integrated; mock adapter for Liquid support.
*   **State Chains:** Ports and domain models defined; mock adapter for State Chain services.

*   **IPFS Upload:** The application is configured to upload data to a local IPFS node. For a production environment, this needs to be configured to use a pinning service with authentication.
*   **Handshake Domain:** The Handshake domain has not been registered.

### Getting Started

To get started with the project, you will need to have Node.js and pnpm installed.

1.  Clone the repository:
    ```
    git clone https://github.com/your-username/multi-layer-bitcoin-wallet.git
    ```
2.  Install the dependencies:
    ```
    pnpm install
    ```
3.  Build the web app:
    ```
    node build.js
    ```
4.  Open the `public/index.html` file in your browser to run the web app.

5.  Run the tests:
    ```
    npx jest
    ```
