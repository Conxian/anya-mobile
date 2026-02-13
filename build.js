const esbuild = require('esbuild');
const path = require('path');

const sharedConfig = {
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2020',
  loader: { '.wasm': 'binary' },
  define: {
    'global': 'globalThis',
    'process.browser': 'true',
    'process.env.NODE_ENV': '"development"',
    'Buffer': 'Buffer',
  },
  alias: {
    'tiny-secp256k1': path.resolve(__dirname, 'src/core/ecc.ts'),
    'stream': 'stream-browserify',
    'events': 'events',
    'path': 'path-browserify',
    'assert': 'assert',
    'util': 'util',
    'vm': 'vm-browserify',
    'buffer': 'buffer',
    'crypto': 'crypto-browserify',
    'mercury-layer-sdk': path.resolve(__dirname, 'dummy.js'),
  },
  inject: ['./buffer-polyfill.js'],
};

Promise.all([
  esbuild.build({
    ...sharedConfig,
    entryPoints: ['src/ui/app.ts'],
    outfile: 'public/app.js',
  }),
  esbuild.build({
    ...sharedConfig,
    entryPoints: ['src/core/crypto-worker.ts'],
    outfile: 'public/crypto-worker.js',
  }),
]).catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
