import { createWallet } from '../core/wallet';
import { uploadToIPFS, downloadFromIPFS } from '../services/ipfs';

document.getElementById('createWallet').addEventListener('click', async () => {
  const createWalletButton = document.getElementById('createWallet') as HTMLButtonElement;
  createWalletButton.disabled = true;
  createWalletButton.innerText = 'Creating...';

  const wallet = createWallet();

  const walletInfo = document.getElementById('walletInfo');

  // ⚡ Bolt: Provide immediate feedback to the user.
  // This avoids a long wait where the UI shows no new information.
  // We also give the IPFS status element a unique ID for targeted updates.
  walletInfo.innerHTML = `
    <p><strong>Mnemonic:</strong> ${wallet.mnemonic}</p>
    <p><strong>Address:</strong> ${wallet.p2wpkhAddress}</p>
    <p id="ipfs-status"><strong>IPFS CID:</strong> Uploading...</p>
  `;

  // Then, attempt to upload to IPFS in the background
  try {
    const walletJson = JSON.stringify(wallet);
    const cid = await uploadToIPFS(walletJson);
    // ⚡ Bolt: Perform a targeted DOM update.
    // This is more efficient than re-writing the entire walletInfo block.
    document.getElementById('ipfs-status').innerHTML = `<strong>IPFS CID:</strong> ${cid.toString()}`;
  } catch (error) {
    document.getElementById('ipfs-status').innerHTML = `<strong>IPFS CID:</strong> Upload failed. (No local IPFS node found)`;
  } finally {
    createWalletButton.disabled = false;
    createWalletButton.innerText = 'Create New Wallet';
  }
});

const loadWalletButton = document.getElementById('loadWallet') as HTMLButtonElement;
const cidInput = document.getElementById('cidInput') as HTMLInputElement;

// 🎨 Palette: Disable the "Load Wallet" button by default.
// This prevents the user from clicking it with an empty input.
loadWalletButton.disabled = true;

// 🎨 Palette: Add an input event listener to enable/disable the button.
// This provides immediate feedback to the user as they type.
cidInput.addEventListener('input', () => {
  loadWalletButton.disabled = cidInput.value.trim() === '';
});

document.getElementById('loadWallet').addEventListener('click', async () => {
  loadWalletButton.disabled = true;
  loadWalletButton.innerText = 'Loading...';

  const cid = cidInput.value;
  const walletInfo = document.getElementById('walletInfo');
  // 🎨 Palette: Provide immediate feedback that the wallet is loading.
  // This prevents the user from wondering if their click was registered.
  walletInfo.innerHTML = '<p>Loading wallet from IPFS...</p>';
  let walletInfoHTML = '';

  try {
    const walletJson = await downloadFromIPFS(cid);
    const wallet = JSON.parse(walletJson.toString());

    // ⚡ Bolt: Build the complete HTML string in a variable before updating the DOM.
    walletInfoHTML = `
      <p><strong>Mnemonic:</strong> ${wallet.mnemonic}</p>
      <p><strong>Address:</strong> ${wallet.p2wpkhAddress}</p>
    `;
  } catch (error) {
    walletInfoHTML = `<p>Failed to load wallet from IPFS. Please check the CID and your connection.</p>`;
  } finally {
    // ⚡ Bolt: Update the DOM only once with the final HTML content.
    walletInfo.innerHTML = walletInfoHTML;
    loadWalletButton.disabled = false;
    loadWalletButton.innerText = 'Load Wallet from IPFS';
  }
});
