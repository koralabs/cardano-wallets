module.exports = {
  testEnvironment: 'node',
  preset: 'ts-jest',
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ["js", "ts"],
  moduleDirectories: ["node_modules", "src", "lib"],
  transformIgnorePatterns: ['/node_modules/(?!@emurgo/cardano-serialization-lib-asmjs/)'],
  transform: {
    'cardano_serialization_lib.*\\.js$': '<rootDir>/tests/asmjs-transform.cjs',
    '^.+\\.(ts|tsx)$': 'ts-jest',
  }
};