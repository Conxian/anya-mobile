const ecc = require('./src/core/ecc').default;

const pA = new Uint8Array(Buffer.from('0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798', 'hex'));
const tweak = new Uint8Array(Buffer.from('0000000000000000000000000000000000000000000000000000000000000001', 'hex'));

const iterations = 1000;

console.log(`Running benchmark with ${iterations} iterations...`);

const start = Date.now();
for (let i = 0; i < iterations; i++) {
  ecc.pointAddScalar(pA, tweak);
}
const end = Date.now();
console.log(`pointAddScalar: ${end - start}ms (${((end - start) / iterations).toFixed(4)}ms/op)`);

const start2 = Date.now();
for (let i = 0; i < iterations; i++) {
  ecc.privateAdd(tweak, tweak);
}
const end2 = Date.now();
console.log(`privateAdd: ${end2 - start2}ms (${((end2 - start2) / iterations).toFixed(4)}ms/op)`);

const p = pA.slice(1);
const start3 = Date.now();
for (let i = 0; i < iterations; i++) {
  ecc.xOnlyPointAddTweak(p, tweak);
}
const end3 = Date.now();
console.log(`xOnlyPointAddTweak: ${end3 - start3}ms (${((end3 - start3) / iterations).toFixed(4)}ms/op)`);
