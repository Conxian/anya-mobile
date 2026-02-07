import { ElectrumBlockchainClient } from './electrum-client';
// @ts-expect-error - No type definitions for @mempool/electrum-client
import ElectrumClient from '@mempool/electrum-client';

jest.mock('@mempool/electrum-client');

describe('ElectrumBlockchainClient', () => {
  let client: ElectrumBlockchainClient;
  let mockElectrumClient: { request: jest.Mock };

  beforeEach(() => {
    (ElectrumClient as jest.Mock).mockClear();
    client = new ElectrumBlockchainClient('localhost', 50001, 'tcp');
    mockElectrumClient = (ElectrumClient as jest.Mock).mock.instances[0];
  });

  it('should cache fee estimates within TTL', async () => {
    // Electrum returns BTC/kvB. 0.0001 BTC/kvB = 10 sat/vB
    mockElectrumClient.request.mockResolvedValue(0.0001);

    // First call should trigger network requests
    const estimates1 = await client.getFeeEstimates();
    expect(mockElectrumClient.request).toHaveBeenCalledTimes(3);
    expect(estimates1).toEqual({ slow: 10, medium: 10, fast: 10 });

    // Second call within TTL should return cached values
    const estimates2 = await client.getFeeEstimates();
    expect(mockElectrumClient.request).toHaveBeenCalledTimes(3); // No new calls
    expect(estimates2).toEqual(estimates1);
  });

  it('should refresh fee estimates after TTL expires', async () => {
    mockElectrumClient.request.mockResolvedValue(0.0001);

    await client.getFeeEstimates();
    expect(mockElectrumClient.request).toHaveBeenCalledTimes(3);

    // Fast-forward time by 61 seconds
    const now = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(now + 61 * 1000);

    await client.getFeeEstimates();
    expect(mockElectrumClient.request).toHaveBeenCalledTimes(6);

    jest.restoreAllMocks();
  });

  it('should cache script hashes', () => {
    const address = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
    const clientAny = client as unknown as {
      addressToScriptHash: (addr: string) => string;
      scriptHashCache: Map<string, string>;
    };

    const scriptHash1 = clientAny.addressToScriptHash(address);
    const scriptHash2 = clientAny.addressToScriptHash(address);

    expect(scriptHash1).toBe(scriptHash2);
    expect(clientAny.scriptHashCache.has(address)).toBe(true);
    expect(clientAny.scriptHashCache.get(address)).toBe(scriptHash1);
  });
});
