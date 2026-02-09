const { secp256k1: noble } = require('@noble/curves/secp256k1');

try {
  const pA = Buffer.from('02' + '0'.repeat(62) + '1', 'hex');
  const a = noble.Point.fromHex(pA);
  console.log('fromHex with Uint8Array worked!');
} catch (e) {
  console.error('fromHex with Uint8Array failed:', e.message);
}

try {
  const pA_hex = '02' + '0'.repeat(62) + '1';
  const a = noble.Point.fromHex(pA_hex);
  console.log('fromHex with string worked!');
} catch (e) {
  console.error('fromHex with string failed:', e.message);
}
