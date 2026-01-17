const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/ui/app.ts'],
  bundle: true,
  minify: true,
  outfile: 'public/app.js',
  format: 'esm',
  platform: 'browser',
  loader: { '.wasm': 'binary' },
  // No external modules, so they will be bundled
}).catch(() => process.exit(1));
