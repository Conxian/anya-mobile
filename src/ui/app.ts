import { createWallet } from '../core/wallet';
import { uploadToIPFS, downloadFromIPFS } from '../services/ipfs';

document.getElementById('createWallet').addEventListener('click', async () => {
  const createWalletButton = document.getElementById('createWallet') as HTMLButtonElement;
  createWalletButton.disabled = true;
  createWalletButton.innerText = 'Creating...';

  const wallet = createWallet();

  // Display wallet info first
  const walletInfo = document.getElementById('walletInfo');
  walletInfo.innerHTML = `
    <p><strong>Mnemonic:</strong> ${wallet.mnemonic}</p>
    <p><strong>Address:</strong> ${wallet.p2wpkhAddress}</p>
    <p><strong>IPFS CID:</strong> Uploading...</p>
  `;

  // Then, attempt to upload to IPFS
  try {
    const walletJson = JSON.stringify(wallet);
    const cid = await uploadToIPFS(walletJson);
    walletInfo.innerHTML += `<p><strong>IPFS CID:</strong> ${cid.toString()}</p>`;
  } catch (error) {
    walletInfo.innerHTML += `<p><strong>IPFS CID:</strong> Upload failed. (No local IPFS node found)</p>`;
  } finally {
    createWalletButton.disabled = false;
    createWalletButton.innerText = 'Create New Wallet';
  }
});

document.getElementById('loadWallet').addEventListener('click', async () => {
  const loadWalletButton = document.getElementById('loadWallet') as HTMLButtonElement;
  const cidInput = document.getElementById('cidInput') as HTMLInputElement;

  loadWalletButton.disabled = true;
  cidInput.disabled = true;
  loadWalletButton.innerText = 'Loading...';

  const cid = cidInput.value;
  const walletInfo = document.getElementById('walletInfo');
  try {
    const walletJson = await downloadFromIPFS(cid);
    const wallet = JSON.parse(walletJson.toString());

    walletInfo.innerHTML = `
      <p><strong>Mnemonic:</strong> ${wallet.mnemonic}</p>
      <p><strong>Address:</strong> ${wallet.p2wpkhAddress}</p>
    `;
  } catch (error) {
    walletInfo.innerHTML = `<p>Failed to load wallet from IPFS. Please check the CID and your connection.</p>`;
  } finally {
    loadWalletButton.disabled = false;
    cidInput.disabled = false;
    loadWalletButton.innerText = 'Load Wallet from IPFS';
  }
});
