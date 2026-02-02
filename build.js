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
  define: {
    'global': 'globalThis',
    'process.browser': 'true',
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
