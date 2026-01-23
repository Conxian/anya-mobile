module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    // The default transformIgnorePatterns ignores node_modules.
    // We make an exception for ES modules which need to be transformed.
    // The '.*' is added to handle pnpm's nested node_modules structure.
    'node_modules/(?!.*@noble/secp256k1|.*@scure/bip39|.*@noble/hashes|.*@scure/base)',
  ],
};
