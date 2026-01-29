import { TransactionServiceImpl } from './transaction-service';
import { BlockchainClient } from './ports';
import { Account, Transaction, DraftTransaction } from './domain';
import { mock, MockProxy } from 'jest-mock-extended';
import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';

const bip32 = BIP32Factory(ecc);

describe('TransactionServiceImpl', () => {
  let transactionService: TransactionServiceImpl;
  let blockchainClient: MockProxy<BlockchainClient>;
  let account: Account;

  beforeEach(() => {
    blockchainClient = mock<BlockchainClient>();
    const network = bitcoin.networks.testnet;
    transactionService = new TransactionServiceImpl(blockchainClient, network);
    const node = bip32.fromSeed(Buffer.alloc(64));
    account = new Account('test-id', 'test-account', node, network);
  });

  describe('getTransactionHistory', () => {
    it('should correctly parse a send transaction from the history', async () => {
      const mockSendTransaction: Transaction = {
        id: 'mock-send-tx',
        from: account.address,
        to: 'recipient-address',
        asset: { symbol: 'BTC', name: 'Bitcoin', decimals: 8 },
        amount: {
          asset: { symbol: 'BTC', name: 'Bitcoin', decimals: 8 },
          value: '0.5',
        },
        fee: {
          asset: { symbol: 'BTC', name: 'Bitcoin', decimals: 8 },
          value: '0.0001',
        },
        timestamp: Date.now(),
        psbt: '',
      };
      blockchainClient.getTransactionHistory.mockResolvedValue([
        mockSendTransaction,
      ]);

      const transactions = await transactionService.getTransactionHistory(
        account
      );

      expect(transactions).toEqual([mockSendTransaction]);
      expect(blockchainClient.getTransactionHistory).toHaveBeenCalledWith(
        account.address
      );
    });

    it('should correctly parse a receive transaction from the history', async () => {
      const mockReceiveTransaction: Transaction = {
        id: 'mock-receive-tx',
        from: 'sender-address',
        to: account.address,
        asset: { symbol: 'BTC', name: 'Bitcoin', decimals: 8 },
        amount: {
          asset: { symbol: 'BTC', name: 'Bitcoin', decimals: 8 },
          value: '1.0',
        },
        fee: {
          asset: { symbol: 'BTC', name: 'Bitcoin', decimals: 8 },
          value: '0.0001',
        },
        timestamp: Date.now(),
        psbt: '',
      };
      blockchainClient.getTransactionHistory.mockResolvedValue([
        mockReceiveTransaction,
      ]);

      const transactions = await transactionService.getTransactionHistory(
        account
      );

      expect(transactions).toEqual([mockReceiveTransaction]);
      expect(blockchainClient.getTransactionHistory).toHaveBeenCalledWith(
        account.address
      );
    });
  });

  describe('createTransaction', () => {
    it('should create a transaction when there are sufficient funds', async () => {
      const utxos = [
        { txid: 'a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1', vout: 0, value: 100000n },
        { txid: 'b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1', vout: 1, value: 200000n },
      ];
      blockchainClient.getUTXOs.mockResolvedValue(utxos);

      const destinationAddress =
        'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7';
      const amount = { value: '150000', asset: { symbol: 'BTC', name: 'Bitcoin', decimals: 8 } };
      const feeRate = 10;

      const draftTx = await transactionService.createTransaction(
        account,
        destinationAddress,
        amount.asset,
        amount,
        feeRate
      );

      expect(draftTx).toBeDefined();
      expect(draftTx.from).toEqual(account.address);
      expect(draftTx.to).toEqual(destinationAddress);
      expect(draftTx.amount.value).toEqual(amount.value);

      const psbt = bitcoin.Psbt.fromBase64(draftTx.psbt);
      expect(psbt.txInputs.length).toBe(1);
      expect(psbt.txOutputs.length).toBe(2);
    });

    it('should throw an error when there are insufficient funds', async () => {
        const utxos = [{ txid: 'tx1', vout: 0, value: 50000n }];
        blockchainClient.getUTXOs.mockResolvedValue(utxos);

        const destinationAddress =
          'tb1q9pv3k5x3z3q2x7x7y2x7x7y2x7x7y2x7x7y2x7x7y2x7x7y2x7x7y2x7x7';
        const amount = { value: '100000', asset: { symbol: 'BTC', name: 'Bitcoin', decimals: 8 } };
        const feeRate = 10;

        await expect(
          transactionService.createTransaction(
            account,
            destinationAddress,
            amount.asset,
            amount,
            feeRate
          )
        ).rejects.toThrow('Insufficient funds to cover the transaction amount and network fee.');
      });
    });

    describe('signTransaction', () => {
        it('should sign a transaction', async () => {
          // Create a dummy UTXO and input for the transaction
          const utxo = {
            txid: 'a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1',
            vout: 0,
            value: 10000n,
          };

          const { output } = bitcoin.payments.p2wpkh({
            pubkey: account.getSigner().publicKey,
            network: bitcoin.networks.testnet,
          });

          const psbt = new bitcoin.Psbt({ network: bitcoin.networks.testnet })
            .addInput({
              hash: utxo.txid,
              index: utxo.vout,
              witnessUtxo: {
                script: output!,
                value: utxo.value,
              },
            })
            .addOutput({
              address: 'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7',
              value: 5000n,
            });

          const draftTx: DraftTransaction = {
            psbt: psbt.toBase64(),
            from: account.address,
            to: 'some-address',
            asset: { symbol: 'BTC', name: 'Bitcoin', decimals: 8 },
            amount: { value: '5000', asset: { symbol: 'BTC', name: 'Bitcoin', decimals: 8 } },
            fee: { value: '100', asset: { symbol: 'BTC', name: 'Bitcoin', decimals: 8 } },
          };

          const signedDraftTx = await transactionService.signTransaction(draftTx, account);
          const signedPsbt = bitcoin.Psbt.fromBase64(signedDraftTx.psbt);

          // Check if the input has a partial signature after signing
          expect(signedPsbt.data.inputs[0].partialSig).toBeDefined();
          expect(signedPsbt.data.inputs[0].partialSig!.length).toBeGreaterThan(0);
        });
      });

      describe('broadcastTransaction', () => {
        it('should broadcast a transaction', async () => {
          const utxo = {
            txid: 'a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1',
            vout: 0,
            value: 10000n,
          };

          const { output } = bitcoin.payments.p2wpkh({
            pubkey: account.getSigner().publicKey,
            network: bitcoin.networks.testnet,
          });

          const psbt = new bitcoin.Psbt({ network: bitcoin.networks.testnet })
            .addInput({
              hash: utxo.txid,
              index: utxo.vout,
              witnessUtxo: {
                script: output!,
                value: utxo.value,
              },
            })
            .addOutput({
              address: 'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7',
              value: 5000n,
            });

          psbt.signInput(0, account.getSigner());

          const draftTx: DraftTransaction = {
            psbt: psbt.toBase64(),
            from: account.address,
            to: 'some-address',
            asset: { symbol: 'BTC', name: 'Bitcoin', decimals: 8 },
            amount: { value: '5000', asset: { symbol: 'BTC', name: 'Bitcoin', decimals: 8 } },
            fee: { value: '100', asset: { symbol: 'BTC', name: 'Bitcoin', decimals: 8 } },
          };

          const expectedTxId = 'broadcasted-tx-id';
          blockchainClient.broadcastTransaction.mockResolvedValue(expectedTxId);

          const txId = await transactionService.broadcastTransaction(draftTx);

          expect(txId).toEqual(expectedTxId);
          expect(blockchainClient.broadcastTransaction).toHaveBeenCalled();
        });
      });
});
