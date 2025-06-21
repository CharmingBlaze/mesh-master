module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/lib'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      diagnostics: {
        warnOnly: false, // Report all diagnostics, not just warnings
        pretty: true,
        ignoreCodes: [], // Process all diagnostic codes
      },
    }],
  },
};