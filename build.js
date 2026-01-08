const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/ui/app.ts'],
  bundle: true,
  outfile: 'public/app.js',
  format: 'esm',
  platform: 'browser',
  loader: {
    '.wasm': 'binary',
  },
}).catch(() => process.exit(1));
