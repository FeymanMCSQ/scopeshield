import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js'],
  clearMocks: true,

  // ✅ teach Jest what "@" means
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },

  // ✅ ts-jest goes here now (instead of globals)
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
  },
};

export default config;
