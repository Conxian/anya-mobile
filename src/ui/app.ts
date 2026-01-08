import { WalletServiceImpl } from '../core/wallet-service';
import { AccountServiceImpl } from '../services/account-service';
import { TransactionServiceImpl } from '../services/transaction-service';
import { BlockstreamClient } from '../adapters/blockstream-client';

const walletService = new WalletServiceImpl();
const blockchainClient = new BlockstreamClient();
const accountService = new AccountServiceImpl(blockchainClient);
const transactionService = new TransactionServiceImpl(blockchainClient);

document.getElementById('createWallet').addEventListener('click', async () => {
  const walletInfo = document.getElementById('walletInfo');
  walletInfo.innerHTML = '<p>Creating wallet...</p>';
  try {
    console.log('Creating wallet...');
    const { wallet, mnemonic } = await walletService.createWallet('password');
    console.log('Wallet created, creating account...');
    const { newAccount, updatedWallet } = await accountService.createAccount(wallet, 'Account 1');
    console.log('Account created:', newAccount.address);

    walletInfo.innerHTML = `
      <p><strong>Mnemonic:</strong> ${mnemonic}</p>
      <p><strong>Address:</strong> ${newAccount.address}</p>
    `;
    console.log('Wallet info displayed.');
  } catch (error) {
    console.error('Caught error:', error);
    walletInfo.innerHTML = `<p><strong>Error:</strong> ${error.message}</p>`;
  }
});
