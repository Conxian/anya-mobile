// ⚡ Bolt: This worker offloads the expensive, CPU-intensive `mnemonicToSeed`
// operation from the main UI thread. By performing this cryptographic work in the
// background, we prevent the UI from freezing during wallet creation or loading,
// ensuring a smooth and responsive user experience.

import { mnemonicToSeed } from '@scure/bip39';

self.onmessage = async (event: MessageEvent<string>) => {
  const mnemonic = event.data;
  try {
    const seed = await mnemonicToSeed(mnemonic);
    // Post the Uint8Array seed back to the main thread.
    // The second argument, [seed.buffer], is a Transferable object, which
    // transfers ownership of the underlying ArrayBuffer to the main thread
    // near-instantaneously, avoiding the overhead of copying.
    self.postMessage({ status: 'success', seed }, [seed.buffer]);
  } catch (error) {
    // If an error occurs, post an error message back.
    self.postMessage({ status: 'error', error: error.message });
  }
};
