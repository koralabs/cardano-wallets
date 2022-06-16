module.exports = {
  testEnvironment: 'node',
  preset: 'ts-jest/presets/js-with-ts',
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ["js", "ts"],
  moduleDirectories: ["node_modules", "src", "lib"],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  }
};