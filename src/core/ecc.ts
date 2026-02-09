import { secp256k1 as noble, schnorr } from '@noble/curves/secp256k1.js';
import EC from 'elliptic';

/**
 * ⚡ Bolt: Hybrid high-performance pure-JS ECC implementation.
 * Uses @noble/curves for point operations (faster) and elliptic for signing/verification
 * to maintain strict compatibility with bip32/bitcoinjs-lib deterministic signature tests.
 * This improves performance of address derivation and key path spending significantly.
 */

const ec = new EC.ec('secp256k1');
const NOBLE_ORDER = BigInt('0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141');

const toHex = (b: Uint8Array) => Buffer.from(b).toString('hex');

/**
 * ⚡ Bolt: High-performance byte-to-BigInt conversion using DataView.
 * Replaces hex string-based conversion to avoid string allocations and parsing overhead.
 * This is especially beneficial in browser environments where Buffer polyfills are used.
 */
function bytesToNumberBE(bytes: Uint8Array): bigint {
  if (bytes.length !== 32) {
    let value = 0n;
    for (const byte of bytes) {
      value = (value << 8n) | BigInt(byte);
    }
    return value;
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return (view.getBigUint64(0) << 192n) |
         (view.getBigUint64(8) << 128n) |
         (view.getBigUint64(16) << 64n) |
         view.getBigUint64(24);
}

/**
 * ⚡ Bolt: High-performance BigInt-to-byte conversion using DataView.
 * Replaces hex string-based conversion to avoid string allocations and padding.
 */
function numberToBytesBE(n: bigint, length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  if (length === 32) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    view.setBigUint64(0, n >> 192n);
    view.setBigUint64(8, (n >> 128n) & 0xffffffffffffffffn);
    view.setBigUint64(16, (n >> 64n) & 0xffffffffffffffffn);
    view.setBigUint64(24, n & 0xffffffffffffffffn);
  } else {
    for (let i = length - 1; i >= 0; i--) {
      bytes[i] = Number(n & 0xffn);
      n >>= 8n;
    }
  }
  return bytes;
}

export const isPoint = (p: Uint8Array): boolean => {
  try {
    noble.Point.fromHex(toHex(p));
    return true;
  } catch {
    return false;
  }
};

export const isPrivate = (d: Uint8Array): boolean => {
  if (d.length !== 32) return false;
  try {
    const scalar = bytesToNumberBE(d);
    return scalar > 0n && scalar < NOBLE_ORDER;
  } catch {
    return false;
  }
};

export const pointAdd = (pA: Uint8Array, pB: Uint8Array, compressed?: boolean): Uint8Array | null => {
  try {
    const a = noble.Point.fromHex(toHex(pA));
    const b = noble.Point.fromHex(toHex(pB));
    const res = a.add(b);
    if (res.is0()) return null;
    return res.toBytes(compressed !== false);
  } catch {
    return null;
  }
};

export const pointAddScalar = (p: Uint8Array, tweak: Uint8Array, compressed?: boolean): Uint8Array | null => {
  try {
    const pt = noble.Point.fromHex(toHex(p));
    const scalar = bytesToNumberBE(tweak);
    if (scalar >= NOBLE_ORDER) return null;
    const res = pt.add(noble.Point.BASE.multiply(scalar));
    if (res.is0()) return null;
    return res.toBytes(compressed !== false);
  } catch {
    return null;
  }
};

export const pointCompress = (p: Uint8Array, compressed?: boolean): Uint8Array => {
  const pt = noble.Point.fromHex(toHex(p));
  return pt.toBytes(compressed !== false);
};

export const pointMultiply = (p: Uint8Array, tweak: Uint8Array, compressed?: boolean): Uint8Array | null => {
  try {
    const pt = noble.Point.fromHex(toHex(p));
    const scalar = bytesToNumberBE(tweak);
    const res = pt.multiply(scalar);
    if (res.is0()) return null;
    return res.toBytes(compressed !== false);
  } catch {
    return null;
  }
};

export const pointFromScalar = (d: Uint8Array, compressed?: boolean): Uint8Array | null => {
  try {
    const scalar = bytesToNumberBE(d);
    if (scalar === 0n || scalar >= NOBLE_ORDER) return null;
    const res = noble.Point.BASE.multiply(scalar);
    return res.toBytes(compressed !== false);
  } catch {
    return null;
  }
};

export const privateAdd = (d: Uint8Array, tweak: Uint8Array): Uint8Array | null => {
  try {
    const dd = bytesToNumberBE(d);
    const tt = bytesToNumberBE(tweak);
    const res = (dd + tt) % NOBLE_ORDER;
    if (res === 0n) return null;
    return numberToBytesBE(res, 32);
  } catch {
    return null;
  }
};

export const privateNegate = (d: Uint8Array): Uint8Array => {
  const dd = bytesToNumberBE(d);
  const res = (NOBLE_ORDER - dd) % NOBLE_ORDER;
  return numberToBytesBE(res, 32);
};

export const sign = (hash: Uint8Array, x: Uint8Array): Uint8Array => {
  const sig = ec.sign(Buffer.from(hash), Buffer.from(x), { canonical: true });
  const res = new Uint8Array(64);
  res.set(new Uint8Array(sig.r.toArray('be', 32)), 0);
  res.set(new Uint8Array(sig.s.toArray('be', 32)), 32);
  return res;
};

export const verify = (hash: Uint8Array, p: Uint8Array, signature: Uint8Array): boolean => {
  try {
    const r = signature.slice(0, 32);
    const s = signature.slice(32, 64);
    return ec.verify(Buffer.from(hash), { r: Buffer.from(r), s: Buffer.from(s) }, Buffer.from(p));
  } catch {
    return false;
  }
};

// --- Taproot / X-Only Support ---

export const isXOnlyPoint = (p: Uint8Array): boolean => {
  if (p.length !== 32) return false;
  try {
    noble.Point.fromHex('02' + toHex(p));
    return true;
  } catch {
    return false;
  }
};

export const xOnlyPointAddTweak = (p: Uint8Array, t: Uint8Array): { parity: 0 | 1; xOnlyPubkey: Uint8Array } | null => {
  try {
    const pt = noble.Point.fromHex('02' + toHex(p));
    const scalar = bytesToNumberBE(t);
    if (scalar >= NOBLE_ORDER) return null;
    const res = pt.add(noble.Point.BASE.multiply(scalar));
    if (res.is0()) return null;
    return {
      parity: res.toBytes(true)[0] === 2 ? 0 : 1,
      xOnlyPubkey: res.toBytes(false).slice(1, 33),
    };
  } catch {
    return null;
  }
};

export const privateTweakAdd = (d: Uint8Array, t: Uint8Array): Uint8Array | null => {
  try {
    const d_bi = bytesToNumberBE(d);
    const P = noble.Point.BASE.multiply(d_bi);
    let d_norm = d_bi;
    if (P.toBytes(true)[0] !== 2) {
      d_norm = (NOBLE_ORDER - d_bi) % NOBLE_ORDER;
    }
    const t_bi = bytesToNumberBE(t);
    if (t_bi >= NOBLE_ORDER) return null;
    const res = (d_norm + t_bi) % NOBLE_ORDER;
    if (res === 0n) return null;
    return numberToBytesBE(res, 32);
  } catch {
    return null;
  }
};

export const signSchnorr = (h: Uint8Array, d: Uint8Array, e: Uint8Array = new Uint8Array(32)): Uint8Array => {
  return schnorr.sign(h, d, e);
};

export const verifySchnorr = (h: Uint8Array, p: Uint8Array, s: Uint8Array): boolean => {
  return schnorr.verify(s, h, p);
};

const ecc = {
  isPoint,
  isPrivate,
  pointAdd,
  pointAddScalar,
  pointCompress,
  pointMultiply,
  pointFromScalar,
  privateAdd,
  privateNegate,
  sign,
  verify,
  isXOnlyPoint,
  xOnlyPointAddTweak,
  privateTweakAdd,
  signSchnorr,
  verifySchnorr,
};

export default ecc;
