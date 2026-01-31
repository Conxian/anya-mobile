import { createWallet, BitcoinWallet } from '../core/wallet';
import { uploadToIPFS, downloadFromIPFS } from '../services/ipfs';

/**
 * 🎨 Palette: Standardized helper to attach copy-to-clipboard functionality to buttons.
 * This ensures consistent feedback and accessibility across the application.
 */
function setupCopyButton(buttonId: string, textToCopy: string) {
  const button = document.getElementById(buttonId) as HTMLButtonElement;
  if (button) {
    button.addEventListener('click', () => {
      navigator.clipboard
        .writeText(textToCopy)
        .then(() => {
          const originalText = button.innerText;
          button.innerText = '✅';
          setTimeout(() => {
            button.innerText = originalText;
          }, 2000);
        })
        .catch((err) => {
          console.error(`Failed to copy ${buttonId}: `, err);
          button.innerText = '❌';
          setTimeout(() => {
            button.innerText = '📋';
          }, 2000);
        });
    });
  }
}

document.getElementById('createWallet').addEventListener('click', async () => {
  const createWalletButton = document.getElementById(
    'createWallet'
  ) as HTMLButtonElement;
  createWalletButton.disabled = true;
  createWalletButton.innerText = 'Creating...';

  const wallet = await createWallet();

  const walletInfo = document.getElementById('walletInfo');

  // ⚡ Bolt: Provide immediate feedback to the user.
  // This avoids a long wait where the UI shows no new information.
  // We also give the IPFS status element a unique ID for targeted updates.
  const address = await wallet.getP2wpkhAddress();
  walletInfo.innerHTML = `
    <p><strong>Mnemonic:</strong> ${wallet.mnemonic} <button id="copyMnemonic" title="Copy mnemonic to clipboard" aria-label="Copy mnemonic to clipboard">📋</button></p>
    <p><strong>Address:</strong> ${address} <button id="copyAddress" title="Copy address to clipboard" aria-label="Copy address to clipboard">📋</button></p>
    <p id="ipfs-status"><strong>IPFS CID:</strong> Uploading...</p>
  `;

  // 🎨 Palette: Attach standardized copy handlers for Mnemonic and Address.
  setupCopyButton('copyMnemonic', wallet.mnemonic);
  setupCopyButton('copyAddress', address);

  // 🎨 Palette: Provide more specific feedback to the user during the IPFS upload.
  createWalletButton.innerText = 'Uploading...';

  // Then, attempt to upload to IPFS in the background
  try {
    // We need to resolve all async properties before serialization
    const walletData = {
      mnemonic: wallet.mnemonic,
      masterPrivateKey: await wallet.getMasterPrivateKey(),
      p2wpkhAddress: await wallet.getP2wpkhAddress(),
    };
    const walletJson = JSON.stringify(walletData);
    const cid = await uploadToIPFS(walletJson);
    const cidStr = cid.toString();
    // ⚡ Bolt: Perform a targeted DOM update.
    // This is more efficient than re-writing the entire walletInfo block.
    // 🎨 Palette: Add a copy button for the IPFS CID.
    document.getElementById('ipfs-status').innerHTML = `
      <strong>IPFS CID:</strong> ${cidStr}
      <button id="copyCID" title="Copy CID to clipboard" aria-label="Copy CID to clipboard">📋</button>
    `;
    setupCopyButton('copyCID', cidStr);
  } catch (error) {
    document.getElementById('ipfs-status').innerHTML =
      `<strong>IPFS CID:</strong> Upload failed. (No local IPFS node found)`;
  } finally {
    createWalletButton.disabled = false;
    createWalletButton.innerText = 'Create New Wallet';
  }
});

// 🎨 Palette: Enable the 'Load Wallet' button only when the input field is not empty.
// This provides a clear visual cue to the user about the required action
// and prevents them from clicking a button that would do nothing.
const cidInput = document.getElementById('cidInput') as HTMLInputElement;
const loadWalletButton = document.getElementById(
  'loadWallet'
) as HTMLButtonElement;

cidInput.addEventListener('input', () => {
  loadWalletButton.disabled = cidInput.value.trim() === '';
});

document.getElementById('loadWallet').addEventListener('click', async () => {
  // 🎨 Palette: Disable both button and input field during async operations.
  // This prevents the user from changing the input while the app is busy,
  // which provides clearer feedback about the system's state.
  loadWalletButton.disabled = true;
  loadWalletButton.innerText = 'Loading...';
  cidInput.disabled = true;

  const cid = cidInput.value.trim();
  const walletInfo = document.getElementById('walletInfo');
  // 🎨 Palette: Provide immediate feedback that the wallet is loading.
  // This prevents the user from wondering if their click was registered.
  walletInfo.innerHTML = '<p>Loading wallet from IPFS...</p>';
  let walletInfoHTML = '';
  let loadedWalletData: any = null;
  let loadedAddress = '';

  try {
    const walletJson = await downloadFromIPFS(cid);
    loadedWalletData = JSON.parse(walletJson.toString());
    const wallet = new BitcoinWallet(loadedWalletData.mnemonic);
    loadedAddress = await wallet.getP2wpkhAddress();

    // ⚡ Bolt: Build the complete HTML string in a variable before updating the DOM.
    // 🎨 Palette: Standardize the display with copy buttons for both Mnemonic and Address.
    walletInfoHTML = `
      <p><strong>Mnemonic:</strong> ${wallet.mnemonic} <button id="copyLoadedMnemonic" title="Copy mnemonic to clipboard" aria-label="Copy mnemonic to clipboard">📋</button></p>
      <p><strong>Address:</strong> ${loadedAddress} <button id="copyLoadedAddress" title="Copy address to clipboard" aria-label="Copy address to clipboard">📋</button></p>
    `;
  } catch (error) {
    walletInfoHTML = `<p>Failed to load wallet from IPFS. Please check the CID and your connection.</p>`;
  } finally {
    // ⚡ Bolt: Update the DOM only once with the final HTML content.
    walletInfo.innerHTML = walletInfoHTML;

    // 🎨 Palette: Attach copy handlers after updating the DOM using already loaded data.
    if (loadedWalletData) {
      setupCopyButton('copyLoadedMnemonic', loadedWalletData.mnemonic);
      setupCopyButton('copyLoadedAddress', loadedAddress);
    }

    loadWalletButton.disabled = false;
    loadWalletButton.innerText = 'Load Wallet from IPFS';
    cidInput.disabled = false;
  }
});
