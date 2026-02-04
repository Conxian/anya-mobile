const bip32 = require('bip32');
const ecc = require('tiny-secp256k1');
const node = bip32.BIP32Factory(ecc).fromSeed(Buffer.alloc(64));
console.log('Has tweak:', typeof node.tweak === 'function');
