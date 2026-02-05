const { secp256k1: noble } = require('@noble/curves/secp256k1.js');
const h = (hex) => Buffer.from(hex, 'hex');

const p = h('1617d38ed8d8657da4d4761e8057bc396ea9e4b9d29776d4be096016dbd2509b');
const t = h('a8397a935f0dfceba6ba9618f6451ef4d80637abf4e6af2669fbc9de6a8fd2ac');

try {
    const pt = noble.Point.fromHex('02' + p.toString('hex'));
    const scalar = BigInt('0x' + t.toString('hex'));
    const res = pt.add(noble.Point.BASE.multiply(scalar));
    console.log('parity:', res.hasEvenY() ? 0 : 1);
    console.log('x:', res.toRawBytes().slice(1, 33).toString('hex'));
} catch (e) {
    console.log('Error:', e.message);
}
