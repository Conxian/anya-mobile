const esbuild = require('esbuild');

// ⚡ Bolt: Centralized esbuild configuration.
// To support multiple build targets (the main app and the crypto worker),
// we define a shared configuration object. This promotes consistency and
// simplifies maintenance by ensuring both bundles receive the same essential
// settings, such as the Buffer polyfill.
const sharedConfig = {
  bundle: true,
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
};

// ⚡ Bolt: Parallel builds for efficiency.
// Using Promise.all allows esbuild to run the application and worker builds
// concurrently, which can speed up the overall build process, especially
// as the number of build targets grows.
Promise.all([
  // Build the main application
  esbuild.build({
    ...sharedConfig,
    entryPoints: ['src/ui/app.ts'],
    outfile: 'public/app.js',
  }),
  // Build the crypto worker
  esbuild.build({
    ...sharedConfig,
    entryPoints: ['src/core/crypto-worker.ts'],
    outfile: 'public/crypto-worker.js',
  }),
]).catch(() => process.exit(1));
