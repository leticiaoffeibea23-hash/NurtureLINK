/**
 * Separate Jest config for the recommendation engine.
 * The engine is pure TypeScript — no React Native, no Expo, no browser globals.
 * Using ts-jest in Node mode keeps the test runner light and fast.
 */
module.exports = {
  displayName: 'engine',
  testEnvironment: 'node',
  testMatch: ['**/src/engine/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: './tsconfig.json' }],
  },
  moduleNameMapper: {
    '^@nurturelink/shared$': '<rootDir>/../../packages/shared/src',
  },
};
