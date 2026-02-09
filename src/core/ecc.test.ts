import ecc from './ecc';

describe('ECC Engine', () => {
  const pA_hex = '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798';
  const pA = Buffer.from(pA_hex, 'hex');
  const tweak_hex = '0000000000000000000000000000000000000000000000000000000000000001';
  const tweak = Buffer.from(tweak_hex, 'hex');

  test('isPoint', () => {
    expect(ecc.isPoint(Uint8Array.from(pA))).toBe(true);
    expect(ecc.isPoint(new Uint8Array(33))).toBe(false);
  });

  test('pointAddScalar', () => {
    const res = ecc.pointAddScalar(Uint8Array.from(pA), Uint8Array.from(tweak));
    expect(res).not.toBeNull();
    expect(Buffer.from(res!).toString('hex')).not.toBe(pA_hex);
  });

  test('privateAdd', () => {
    const d = Buffer.alloc(32, 0);
    d[31] = 1;
    const res = ecc.privateAdd(Uint8Array.from(d), Uint8Array.from(tweak));
    expect(res).not.toBeNull();
    const expected = Buffer.alloc(32, 0);
    expected[31] = 2;
    expect(Buffer.from(res!)).toEqual(expected);
  });

  test('xOnlyPointAddTweak', () => {
    const p = pA.slice(1);
    const res = ecc.xOnlyPointAddTweak(Uint8Array.from(p), Uint8Array.from(tweak));
    expect(res).not.toBeNull();
    expect(res!.xOnlyPubkey.length).toBe(32);
    expect(res!.parity).toBeLessThanOrEqual(1);
  });
});
