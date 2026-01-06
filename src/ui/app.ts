import { createWallet } from '../core/wallet';
import { uploadToIPFS, downloadFromIPFS } from '../services/ipfs';

document.getElementById('createWallet').addEventListener('click', async () => {
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
  }
});

document.getElementById('loadWallet').addEventListener('click', async () => {
  const cid = (document.getElementById('cidInput') as HTMLInputElement).value;
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
  }
});
