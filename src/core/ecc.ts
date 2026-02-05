import EC from 'elliptic';
import BN from 'bn.js';
import { secp256k1 as noble, schnorr } from '@noble/curves/secp256k1.js';

/**
 * ⚡ Bolt: Hybrid ECC implementation.
 * This provides a reliable, high-performance, and WASM-free alternative to
 * tiny-secp256k1 for browser environments.
 */

const ec = new EC.ec('secp256k1');
const G = ec.curve.g;
const n = ec.curve.n;

const NOBLE_ORDER = (noble.Point as any).Fn.ORDER;

const toHex = (b: Uint8Array) => Buffer.from(b).toString('hex');
const fromHex = (s: string) => Uint8Array.from(Buffer.from(s, 'hex'));

export const isPoint = (p: Uint8Array): boolean => {
  try {
    ec.curve.decodePoint(Buffer.from(p));
    return true;
  } catch {
    return false;
  }
};

export const isPrivate = (d: Uint8Array): boolean => {
  if (d.length !== 32) return false;
  const bn = new BN(Buffer.from(d));
  return bn.gt(new BN(0)) && bn.lt(n);
};

export const pointAdd = (pA: Uint8Array, pB: Uint8Array, compressed?: boolean): Uint8Array | null => {
  try {
    const a = ec.curve.decodePoint(Buffer.from(pA));
    const b = ec.curve.decodePoint(Buffer.from(pB));
    const res = a.add(b);
    if (res.isInfinity()) return null;
    return Uint8Array.from(res.encode(undefined, compressed !== false) as any);
  } catch {
    return null;
  }
};

export const pointAddScalar = (p: Uint8Array, tweak: Uint8Array, compressed?: boolean): Uint8Array | null => {
  try {
    const pp = ec.curve.decodePoint(Buffer.from(p));
    const tt = new BN(Buffer.from(tweak));
    const qq = G.mul(tt);
    const res = pp.add(qq);
    if (res.isInfinity()) return null;
    return Uint8Array.from(res.encode(undefined, compressed !== false) as any);
  } catch {
    return null;
  }
};

export const pointCompress = (p: Uint8Array, compressed?: boolean): Uint8Array => {
  const pp = ec.curve.decodePoint(Buffer.from(p));
  return Uint8Array.from(pp.encode(undefined, compressed !== false) as any);
};

export const pointMultiply = (p: Uint8Array, tweak: Uint8Array, compressed?: boolean): Uint8Array | null => {
  try {
    const pp = ec.curve.decodePoint(Buffer.from(p));
    const tt = new BN(Buffer.from(tweak));
    const res = pp.mul(tt);
    if (res.isInfinity()) return null;
    return Uint8Array.from(res.encode(undefined, compressed !== false) as any);
  } catch {
    return null;
  }
};

export const pointFromScalar = (d: Uint8Array, compressed?: boolean): Uint8Array | null => {
  try {
    const dd = new BN(Buffer.from(d));
    if (dd.isZero() || dd.gte(n)) return null;
    const res = G.mul(dd);
    if (res.isInfinity()) return null;
    return Uint8Array.from(res.encode(undefined, compressed !== false) as any);
  } catch {
    return null;
  }
};

export const privateAdd = (d: Uint8Array, tweak: Uint8Array): Uint8Array | null => {
  const dd = new BN(Buffer.from(d));
  const tt = new BN(Buffer.from(tweak));
  const res = dd.add(tt).umod(n);
  if (res.isZero()) return null;
  return new Uint8Array(res.toArray('be', 32));
};

export const privateNegate = (d: Uint8Array): Uint8Array => {
  const dd = new BN(Buffer.from(d));
  const res = n.sub(dd).umod(n);
  return new Uint8Array(res.toArray('be', 32));
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
    const scalar = BigInt('0x' + toHex(t));
    if (scalar >= NOBLE_ORDER) return null;
    const res = pt.add(noble.Point.BASE.multiply(scalar));
    if (res.is0()) return null;
    return {
      parity: (res as any).hasEvenY() ? 0 : 1,
      xOnlyPubkey: res.toBytes(false).slice(1, 33),
    };
  } catch {
    return null;
  }
};

export const privateTweakAdd = (d: Uint8Array, t: Uint8Array): Uint8Array | null => {
  try {
    const d_bi = BigInt('0x' + toHex(d));
    const P = noble.Point.BASE.multiply(d_bi);
    let d_norm = d_bi;
    if (!(P as any).hasEvenY()) {
      d_norm = (NOBLE_ORDER - d_bi) % NOBLE_ORDER;
    }
    const t_bi = BigInt('0x' + toHex(t));
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
