import './palette-init';
import { createWallet } from '../core/wallet';
import { SecureStorageService } from '../services/secure-storage';
import { uploadToIPFS, downloadFromIPFS } from '../services/ipfs';
import { UnifiedWalletService } from '../core/unified-wallet-service';
import { MockBlockchainClient } from '../adapters/mock-blockchain-client';
import { MockLightningClient } from '../adapters/mock-lightning-client';
import { LiquidBlockchainClient } from '../adapters/liquid-client';
import { SilentPaymentClient } from '../adapters/silent-payment-client';
import { MockEcashClient } from '../adapters/mock-ecash-client';
import { MockStateChainClient } from '../adapters/mock-statechain-client';
import { MockArkClient } from '../adapters/mock-ark-client';
import { Account, AddressType } from '../core/domain';

const secureStorage = new SecureStorageService();

// Initialize services for the unified balance view.
// In a production app, these would be configured based on user settings.
const l1Client = new MockBlockchainClient();
const l2Client = new MockLightningClient();
const sidechainClient = new LiquidBlockchainClient();
const silentPaymentClient = new SilentPaymentClient();
const ecashClient = new MockEcashClient();
const stateChainClient = new MockStateChainClient();
const arkClient = new MockArkClient();
const balanceService = new UnifiedWalletService(
  l1Client,
  l2Client,
  sidechainClient,
  ecashClient,
  stateChainClient,
  arkClient
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
    const node = await wallet.secureWallet.getNode(0, pin);

    if (walletInfo) {
      walletInfo.innerHTML = `
        <div class="wallet-section">
          <h3>Security</h3>
          <p>
            <strong>Mnemonic:</strong>
            <code id="mnemonic-value"></code>
            <button id="toggleMnemonic" class="btn-icon" title="Show/Hide mnemonic" aria-label="Show mnemonic">👁️</button>
            <button id="copyMnemonic" class="btn-icon" title="Copy mnemonic to clipboard" aria-label="Copy mnemonic to clipboard">📋</button>
          </p>
        </div>
        <div class="wallet-section">
          <h3>L1 - Bitcoin</h3>
          <p><strong>Address:</strong> <code>${address}</code> <button id="copyAddress" class="btn-icon" title="Copy address to clipboard" aria-label="Copy address to clipboard">📋</button></p>
          <p id="sp-container"><strong>Silent Payment:</strong> <span id="sp-address">Generating...</span> <button id="copySPAddress" class="btn-icon" title="Copy Silent Payment address to clipboard" aria-label="Copy SP address to clipboard">📋</button></p>
        </div>
        <div id="unified-balance" class="wallet-section">
          <h3>Unified Balance</h3>
          <p>Loading balances across all layers...</p>
        </div>
        <div class="wallet-section">
          <p id="ipfs-status"><strong>IPFS CID:</strong> Uploading...</p>
        </div>
        <div class="action-container">
          <button id="closeWallet" title="Close and clear wallet view" aria-label="Close wallet">Close Wallet</button>
        </div>
      `;

      document.getElementById('closeWallet')?.addEventListener('click', () => {
        if (confirm('Close wallet view? This will clear the sensitive information from the screen.')) {
          walletInfo.innerHTML = '';
        }
      });
    }

    // Update unified balance
    const btcAsset = { symbol: 'BTC', name: 'Bitcoin', decimals: 8 };
    // Create a temporary account object for balance fetching.
    const tempAccount = new Account('temp', 'Temp', node, undefined, addressType as AddressType);
    // Use the derived address for the mock account
    Object.defineProperty(tempAccount, 'address', { get: () => address });

    balanceService.getUnifiedBalance(tempAccount, btcAsset).then(balances => {
      const balanceDiv = document.getElementById('unified-balance');
      if (balanceDiv) {
        balanceDiv.innerHTML = `
          <h3>Unified Balance</h3>
          <ul class="balance-list">
            <li>🟠 <strong>Layer 1:</strong> ${balances.l1.amount.value} BTC</li>
            <li>⚡ <strong>Lightning (L2):</strong> ${balances.l2.amount.value} BTC</li>
            <li>💧 <strong>Liquid (Sidechain):</strong> ${balances.sidechain.amount.value} L-BTC</li>
            <li>🏦 <strong>Ecash (Cashu):</strong> ${balances.ecash.amount.value} BTC</li>
            <li>⛓️ <strong>State Chain (Mercury):</strong> ${balances.statechain.amount.value} BTC</li>
            <li>⛩️ <strong>Ark (Layer 2):</strong> ${balances.ark.amount.value} BTC</li>
          </ul>
          <p class="total-wealth"><strong>Total Wealth:</strong> ${Number(balances.total) / 1e8} BTC equivalent</p>
        `;
      }
    }).catch(err => {
      console.error('Failed to fetch unified balance:', err);
    });

    setupMnemonicToggle('mnemonic-value', 'toggleMnemonic', mnemonic);
    setupCopyButton('copyMnemonic', mnemonic);
    setupCopyButton('copyAddress', address);

    // Generate Silent Payment address
    silentPaymentClient.generateAddress(tempAccount).then(spAddr => {
      const spSpan = document.getElementById('sp-address');
      if (spSpan) {
        spSpan.innerHTML = `<code>${spAddr}</code>`;
        setupCopyButton('copySPAddress', spAddr);
      }
    }).catch(err => {
      console.error('SP Generation failed:', err);
      const spContainer = document.getElementById('sp-container');
      if (spContainer) spContainer.style.display = 'none';
    });

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
          <strong>IPFS CID:</strong> <code>${cidStr}</code>
          <button id="copyCID" class="btn-icon" title="Copy CID to clipboard" aria-label="Copy CID to clipboard">📋</button>
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
        <div class="wallet-section">
          <h3>Security</h3>
          <p>
            <strong>Mnemonic (Decrypted):</strong>
            <code id="loaded-mnemonic-value"></code>
            <button id="toggleLoadedMnemonic" class="btn-icon" title="Show/Hide mnemonic" aria-label="Show mnemonic">👁️</button>
            <button id="copyLoadedMnemonic" class="btn-icon" title="Copy mnemonic to clipboard" aria-label="Copy mnemonic to clipboard">📋</button>
          </p>
        </div>
        <div class="wallet-section">
          <h3>L1 - Bitcoin</h3>
          <p><strong>Original Address:</strong> <code>${loadedData.address}</code> <button id="copyLoadedAddress" class="btn-icon" title="Copy address to clipboard" aria-label="Copy address to clipboard">📋</button></p>
        </div>
        <div id="unified-balance-loaded" class="wallet-section">
          <h3>Unified Balance</h3>
          <p>Loading balances across all layers...</p>
        </div>
        <div class="action-container">
          <button id="closeLoadedWallet" title="Close and clear wallet view" aria-label="Close wallet">Close Wallet</button>
        </div>
      `;

      document.getElementById('closeLoadedWallet')?.addEventListener('click', () => {
        if (confirm('Close wallet view? This will clear the sensitive information from the screen.')) {
          walletInfo.innerHTML = '';
        }
      });

      setupMnemonicToggle('loaded-mnemonic-value', 'toggleLoadedMnemonic', mnemonic);
      setupCopyButton('copyLoadedMnemonic', mnemonic);
      setupCopyButton('copyLoadedAddress', loadedData.address);

      // Update unified balance for loaded wallet
      const btcAsset = { symbol: 'BTC', name: 'Bitcoin', decimals: 8 };
      const tempAccount = new Account('temp-loaded', 'Temp Loaded', null as any, undefined, AddressType.NativeSegWit);
      Object.defineProperty(tempAccount, 'address', { get: () => loadedData.address });

      balanceService.getUnifiedBalance(tempAccount, btcAsset).then(balances => {
        const balanceDiv = document.getElementById('unified-balance-loaded');
        if (balanceDiv) {
          balanceDiv.innerHTML = `
            <h3>Unified Balance</h3>
            <ul class="balance-list">
              <li>🟠 <strong>Layer 1:</strong> ${balances.l1.amount.value} BTC</li>
              <li>⚡ <strong>Lightning (L2):</strong> ${balances.l2.amount.value} BTC</li>
              <li>💧 <strong>Liquid (Sidechain):</strong> ${balances.sidechain.amount.value} L-BTC</li>
              <li>🏦 <strong>Ecash (Cashu):</strong> ${balances.ecash.amount.value} BTC</li>
              <li>⛓️ <strong>State Chain (Mercury):</strong> ${balances.statechain.amount.value} BTC</li>
              <li>⛩️ <strong>Ark (Layer 2):</strong> ${balances.ark.amount.value} BTC</li>
            </ul>
            <p class="total-wealth"><strong>Total Wealth:</strong> ${Number(balances.total) / 1e8} BTC equivalent</p>
          `;
        }
      }).catch(err => {
        console.error('Failed to fetch unified balance for loaded wallet:', err);
      });
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
