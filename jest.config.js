module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    // The default transformIgnorePatterns ignores node_modules.
    // We make an exception for @noble/secp256k1, @scure/bip39, and its
    // dependencies @noble/hashes and @scure/base which are ES modules and
    // need to be transformed. The '.*' is added to handle pnpm's nested
    // node_modules structure.
    'node_modules/(?!.*@noble/secp256k1|.*@noble/curves|.*@scure/bip39|.*@noble/hashes|.*@scure/base)',
  ],
};
