const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/ui/app.ts'],
  bundle: true,
  outfile: 'public/app.js',
  format: 'esm',
  platform: 'browser',
  loader: { '.wasm': 'binary' },
  // ⚡ Bolt: Inject the Buffer polyfill.
  // The 'tiny-secp256k1' library, a dependency of 'bip32', uses the global
  // Buffer object, which is not available in browsers. This was causing a
  // runtime 'TypeError' that crashed the application. By defining
  // 'global.Buffer' as the 'buffer.Buffer' module, we provide the necessary
  // polyfill to prevent the crash and ensure crypto operations run smoothly
  // in the browser.
  define: {
    'global.Buffer': 'buffer.Buffer',
  },
  // No external modules, so they will be bundled
}).catch(() => process.exit(1));
