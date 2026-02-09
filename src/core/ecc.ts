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
const fromHex = (s: string) => new Uint8Array(Buffer.from(s, 'hex'));
const toBI = (b: Uint8Array) => BigInt('0x' + toHex(b));

export const isPoint = (p: Uint8Array): boolean => {
  try {
    noble.Point.fromBytes(p);
    return true;
  } catch {
    return false;
  }
};

export const isPrivate = (d: Uint8Array): boolean => {
  if (d.length !== 32) return false;
  try {
    const scalar = toBI(d);
    return scalar > 0n && scalar < NOBLE_ORDER;
  } catch {
    return false;
  }
};

export const pointAdd = (pA: Uint8Array, pB: Uint8Array, compressed?: boolean): Uint8Array | null => {
  try {
    const a = noble.Point.fromBytes(pA);
    const b = noble.Point.fromBytes(pB);
    const res = a.add(b);
    if (res.is0()) return null;
    return res.toBytes(compressed !== false);
  } catch {
    return null;
  }
};

export const pointAddScalar = (p: Uint8Array, tweak: Uint8Array, compressed?: boolean): Uint8Array | null => {
  try {
    const pt = noble.Point.fromBytes(p);
    const scalar = toBI(tweak);
    if (scalar >= NOBLE_ORDER) return null;
    const res = pt.add(noble.Point.BASE.multiply(scalar));
    if (res.is0()) return null;
    return res.toBytes(compressed !== false);
  } catch {
    return null;
  }
};

export const pointCompress = (p: Uint8Array, compressed?: boolean): Uint8Array => {
  const pt = noble.Point.fromBytes(p);
  return pt.toBytes(compressed !== false);
};

export const pointMultiply = (p: Uint8Array, tweak: Uint8Array, compressed?: boolean): Uint8Array | null => {
  try {
    const pt = noble.Point.fromBytes(p);
    const scalar = toBI(tweak);
    const res = pt.multiply(scalar);
    if (res.is0()) return null;
    return res.toBytes(compressed !== false);
  } catch {
    return null;
  }
};

export const pointFromScalar = (d: Uint8Array, compressed?: boolean): Uint8Array | null => {
  try {
    const scalar = toBI(d);
    if (scalar === 0n || scalar >= NOBLE_ORDER) return null;
    const res = noble.Point.BASE.multiply(scalar);
    return res.toBytes(compressed !== false);
  } catch {
    return null;
  }
};

export const privateAdd = (d: Uint8Array, tweak: Uint8Array): Uint8Array | null => {
  try {
    const dd = toBI(d);
    const tt = toBI(tweak);
    const res = (dd + tt) % NOBLE_ORDER;
    if (res === 0n) return null;
    return fromHex(res.toString(16).padStart(64, '0'));
  } catch {
    return null;
  }
};

export const privateNegate = (d: Uint8Array): Uint8Array => {
  const dd = toBI(d);
  const res = (NOBLE_ORDER - dd) % NOBLE_ORDER;
  return fromHex(res.toString(16).padStart(64, '0'));
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
    const b = new Uint8Array(33);
    b[0] = 2;
    b.set(p, 1);
    noble.Point.fromBytes(b);
    return true;
  } catch {
    return false;
  }
};

export const xOnlyPointAddTweak = (p: Uint8Array, t: Uint8Array): { parity: 0 | 1; xOnlyPubkey: Uint8Array } | null => {
  try {
    const b = new Uint8Array(33);
    b[0] = 2;
    b.set(p, 1);
    const pt = noble.Point.fromBytes(b);
    const scalar = toBI(t);
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
    const d_bi = toBI(d);
    const P = noble.Point.BASE.multiply(d_bi);
    let d_norm = d_bi;
    if (P.toBytes(true)[0] !== 2) {
      d_norm = (NOBLE_ORDER - d_bi) % NOBLE_ORDER;
    }
    const t_bi = toBI(t);
    if (t_bi >= NOBLE_ORDER) return null;
    const res = (d_norm + t_bi) % NOBLE_ORDER;
    if (res === 0n) return null;
    return fromHex(res.toString(16).padStart(64, '0'));
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
