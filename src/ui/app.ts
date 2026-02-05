import './palette-init';
import { createWallet } from '../core/wallet';
import { SecureStorageService } from '../services/secure-storage';
import { uploadToIPFS, downloadFromIPFS } from '../services/ipfs';
import { UnifiedBalanceService } from '../core/unified-balance-service';
import { MockBlockchainClient } from '../adapters/mock-blockchain-client';
import { MockLightningClient } from '../adapters/mock-lightning-client';
import { LiquidBlockchainClient } from '../adapters/liquid-client';
import { Account, AddressType } from '../core/domain';

const secureStorage = new SecureStorageService();

// Initialize services for the unified balance view.
// In a production app, these would be configured based on user settings.
const l1Client = new MockBlockchainClient();
const l2Client = new MockLightningClient();
const sidechainClient = new LiquidBlockchainClient();
const balanceService = new UnifiedBalanceService(
  l1Client,
  l2Client,
  sidechainClient
);

/**
 * 🎨 Palette: Standardized helper to toggle visibility of sensitive information like mnemonics.
 */
function setupMnemonicToggle(
  spanId: string,
  buttonId: string,
  mnemonic: string
) {
  const span = document.getElementById(spanId);
  const button = document.getElementById(buttonId);
  if (span && button) {
    let visible = false;
    const mask = '•••• •••• •••• •••• •••• ••••';
    span.innerText = mask;

    button.addEventListener('click', () => {
      visible = !visible;
      span.innerText = visible ? mnemonic : mask;
      button.innerText = visible ? '🙈' : '👁️';
      button.setAttribute(
        'aria-label',
        visible ? 'Hide mnemonic' : 'Show mnemonic'
      );
    });
  }
}

/**
 * 🎨 Palette: Standardized helper to attach copy-to-clipboard functionality to buttons.
 */
function setupCopyButton(buttonId: string, textToCopy: string) {
  const button = document.getElementById(buttonId) as HTMLButtonElement;
  if (button) {
    const originalLabel = button.getAttribute('aria-label') || '';
    const originalText = button.innerText;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    button.addEventListener('click', () => {
      if (timeoutId) clearTimeout(timeoutId);

      navigator.clipboard
        .writeText(textToCopy)
        .then(() => {
          button.innerText = '✅';
          button.setAttribute('aria-label', 'Copied!');
          timeoutId = setTimeout(() => {
            button.innerText = originalText;
            button.setAttribute('aria-label', originalLabel);
            timeoutId = null;
          }, 2000);
        })
        .catch((err) => {
          console.error(`Failed to copy ${buttonId}: `, err);
          button.innerText = '❌';
          button.setAttribute('aria-label', 'Failed to copy');
          timeoutId = setTimeout(() => {
            button.innerText = originalText;
            button.setAttribute('aria-label', originalLabel);
            timeoutId = null;
          }, 2000);
        });
    });
  }
}

/**
 * 🎨 Palette: Keyboard accessibility - trigger primary actions on Enter key.
 */
document.getElementById('pinInput')?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    (e.target as HTMLElement).blur();
    document.getElementById('createWallet')?.click();
  }
});

document.getElementById('cidInput')?.addEventListener('keypress', (e) => {
  const loadWalletButton = document.getElementById(
    'loadWallet'
  ) as HTMLButtonElement;
  if (e.key === 'Enter' && loadWalletButton && !loadWalletButton.disabled) {
    (e.target as HTMLElement).blur();
    loadWalletButton.click();
  }
});

document.getElementById('createWallet')?.addEventListener('click', async () => {
  const walletInfo = document.getElementById('walletInfo');
  const pinInput = document.getElementById('pinInput') as HTMLInputElement;
  const pin = pinInput?.value || '1234';
  const addressTypeSelect = document.getElementById('addressType') as HTMLSelectElement;
  const addressType = addressTypeSelect?.value || 'P2WPKH';

  if (
    walletInfo &&
    walletInfo.innerHTML.trim() !== '' &&
    !confirm(
      'Are you sure you want to create a new wallet? This will replace the current one shown. Make sure you have backed up your mnemonic!'
    )
  ) {
    return;
  }

  const createWalletButton = document.getElementById(
    'createWallet'
  ) as HTMLButtonElement;
  createWalletButton.disabled = true;
  createWalletButton.innerText = 'Creating...';

  try {
    const { wallet, mnemonic } = await createWallet(secureStorage, pin);

    let path = "m/84'/0'/0'/0";
    if (addressType === 'P2TR') path = "m/86'/0'/0'/0";
    if (addressType === 'P2PKH') path = "m/44'/0'/0'/0";

    const address = await wallet.getAddress(0, pin, path, addressType);

    if (walletInfo) {
      walletInfo.innerHTML = `
        <div class="wallet-section">
          <h3>Security</h3>
          <p>
            <strong>Mnemonic:</strong>
            <span id="mnemonic-value"></span>
            <button id="toggleMnemonic" title="Show/Hide mnemonic" aria-label="Show mnemonic">👁️</button>
            <button id="copyMnemonic" title="Copy mnemonic to clipboard" aria-label="Copy mnemonic to clipboard">📋</button>
          </p>
        </div>
        <div class="wallet-section">
          <h3>L1 - Bitcoin</h3>
          <p><strong>Address:</strong> ${address} <button id="copyAddress" title="Copy address to clipboard" aria-label="Copy address to clipboard">📋</button></p>
        </div>
        <div id="unified-balance" class="wallet-section">
          <h3>Unified Balance</h3>
          <p>Loading balances across all layers...</p>
        </div>
        <p id="ipfs-status"><strong>IPFS CID:</strong> Uploading...</p>
      `;
    }

    // Update unified balance
    const btcAsset = { symbol: 'BTC', name: 'Bitcoin', decimals: 8 };
    // Create a temporary account object for balance fetching.
    const tempAccount = new Account('temp', 'Temp', null as any, undefined, addressType as AddressType);
    // Use the derived address for the mock account
    Object.defineProperty(tempAccount, 'address', { get: () => address });

    balanceService.getUnifiedBalance(tempAccount, btcAsset).then(balances => {
      const balanceDiv = document.getElementById('unified-balance');
      if (balanceDiv) {
        balanceDiv.innerHTML = `
          <h3>Unified Balance</h3>
          <ul>
            <li><strong>Layer 1:</strong> ${balances.l1.amount.value} BTC</li>
            <li><strong>Lightning (L2):</strong> ${balances.l2.amount.value} BTC</li>
            <li><strong>Liquid (Sidechain):</strong> ${Number(balances.sidechain.amount.value) / 1e8} L-BTC</li>
          </ul>
          <p><strong>Total Wealth:</strong> ${Number(balances.total) / 1e8} BTC equivalent</p>
        `;
      }
    }).catch(err => {
      console.error('Failed to fetch unified balance:', err);
    });

    setupMnemonicToggle('mnemonic-value', 'toggleMnemonic', mnemonic);
    setupCopyButton('copyMnemonic', mnemonic);
    setupCopyButton('copyAddress', address);

    try {
      const walletData = {
        encryptedMnemonic: wallet.getEncryptedMnemonic(),
        address: address,
      };
      const walletJson = JSON.stringify(walletData);
      const cid = await uploadToIPFS(walletJson);
      const cidStr = cid.toString();
      const ipfsStatus = document.getElementById('ipfs-status');
      if (ipfsStatus) {
        ipfsStatus.innerHTML = `
          <strong>IPFS CID:</strong> ${cidStr}
          <button id="copyCID" title="Copy CID to clipboard" aria-label="Copy CID to clipboard">📋</button>
        `;
      }
      setupCopyButton('copyCID', cidStr);
    } catch (err) {
      console.error('IPFS upload failed:', err);
      const ipfsStatus = document.getElementById('ipfs-status');
      if (ipfsStatus) {
        ipfsStatus.innerHTML =
          `<strong>IPFS CID:</strong> Upload failed. (No local IPFS node found)`;
      }
    }
  } catch (err) {
    console.error('Wallet creation failed:', err);
  } finally {
    createWalletButton.disabled = false;
    createWalletButton.innerText = 'Create New Wallet';
  }
});

const cidInput = document.getElementById('cidInput') as HTMLInputElement;
const loadWalletButton = document.getElementById(
  'loadWallet'
) as HTMLButtonElement;

if (cidInput && loadWalletButton) {
  cidInput.addEventListener('input', () => {
    loadWalletButton.disabled = cidInput.value.trim() === '';
  });
}

document.getElementById('loadWallet')?.addEventListener('click', async () => {
  if (!loadWalletButton || !cidInput) return;

  loadWalletButton.disabled = true;
  loadWalletButton.innerText = 'Loading...';
  cidInput.disabled = true;

  const cid = cidInput.value.trim();
  const pinInput = document.getElementById('pinInput') as HTMLInputElement;
  const pin = pinInput?.value || '1234';
  const walletInfo = document.getElementById('walletInfo');

  if (walletInfo) {
    walletInfo.innerHTML = '<p>Loading wallet from IPFS...</p>';
  }

  try {
    const walletJson = await downloadFromIPFS(cid);
    const loadedData = JSON.parse(walletJson.toString());
    const mnemonic = await secureStorage.decrypt(loadedData.encryptedMnemonic, pin);

    if (walletInfo) {
      walletInfo.innerHTML = `
        <p>
          <strong>Mnemonic (Decrypted):</strong>
          <span id="loaded-mnemonic-value"></span>
          <button id="toggleLoadedMnemonic" title="Show/Hide mnemonic" aria-label="Show mnemonic">👁️</button>
          <button id="copyLoadedMnemonic" title="Copy mnemonic to clipboard" aria-label="Copy mnemonic to clipboard">📋</button>
        </p>
        <p><strong>Original Address:</strong> ${loadedData.address}</p>
      `;
      setupMnemonicToggle('loaded-mnemonic-value', 'toggleLoadedMnemonic', mnemonic);
      setupCopyButton('copyLoadedMnemonic', mnemonic);
    }
  } catch (err) {
    console.error('Failed to load wallet:', err);
    if (walletInfo) {
      walletInfo.innerHTML = `<p>Failed to load or decrypt wallet. Please check CID and PIN.</p>`;
    }
  } finally {
    loadWalletButton.disabled = false;
    loadWalletButton.innerText = 'Load Wallet from IPFS';
    cidInput.disabled = false;
  }
});
