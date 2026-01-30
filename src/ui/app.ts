import { createWallet, BitcoinWallet } from '../core/wallet';
import { uploadToIPFS, downloadFromIPFS } from '../services/ipfs';

document.getElementById('createWallet').addEventListener('click', async () => {
  const createWalletButton = document.getElementById('createWallet') as HTMLButtonElement;
  createWalletButton.disabled = true;
  createWalletButton.innerText = 'Creating...';

  const wallet = await createWallet();

  const walletInfo = document.getElementById('walletInfo');

  // ⚡ Bolt: Provide immediate feedback to the user.
  // This avoids a long wait where the UI shows no new information.
  // We also give the IPFS status element a unique ID for targeted updates.
  walletInfo.innerHTML = `
    <p><strong>Mnemonic:</strong> ${wallet.mnemonic} <button id="copyMnemonic" title="Copy mnemonic to clipboard" aria-label="Copy mnemonic to clipboard">📋</button></p>
    <p><strong>Address:</strong> ${await wallet.getP2wpkhAddress()}</p>
    <p id="ipfs-status"><strong>IPFS CID:</strong> Uploading...</p>
  `;

  // 🎨 Palette: Add copy-to-clipboard functionality for the mnemonic.
  // This is a common UX pattern that makes it easier and safer for users
  // to back up their sensitive information.
  const copyMnemonicButton = document.getElementById('copyMnemonic') as HTMLButtonElement;
  if (copyMnemonicButton) {
    copyMnemonicButton.addEventListener('click', () => {
      navigator.clipboard.writeText(wallet.mnemonic).then(() => {
        copyMnemonicButton.innerText = '✅';
        setTimeout(() => {
          copyMnemonicButton.innerText = '📋';
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy mnemonic: ', err);
        // 🎨 Palette: Let the user know if the copy action failed.
        copyMnemonicButton.innerText = 'Error!';
        copyMnemonicButton.disabled = true;
      });
    });
  }

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

// 🎨 Palette: Enable the 'Load Wallet' button only when the input field is not empty.
// This provides a clear visual cue to the user about the required action
// and prevents them from clicking a button that would do nothing.
const cidInput = document.getElementById('cidInput') as HTMLInputElement;
const loadWalletButton = document.getElementById('loadWallet') as HTMLButtonElement;

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

  try {
    const walletJson = await downloadFromIPFS(cid);
    const walletData = JSON.parse(walletJson.toString());
    const wallet = new BitcoinWallet(walletData.mnemonic);

    // ⚡ Bolt: Build the complete HTML string in a variable before updating the DOM.
    walletInfoHTML = `
      <p><strong>Mnemonic:</strong> ${wallet.mnemonic}</p>
      <p><strong>Address:</strong> ${await wallet.getP2wpkhAddress()}</p>
    `;
  } catch (error) {
    walletInfoHTML = `<p>Failed to load wallet from IPFS. Please check the CID and your connection.</p>`;
  } finally {
    // ⚡ Bolt: Update the DOM only once with the final HTML content.
    walletInfo.innerHTML = walletInfoHTML;
    loadWalletButton.disabled = false;
    loadWalletButton.innerText = 'Load Wallet from IPFS';
    cidInput.disabled = false;
  }
});
