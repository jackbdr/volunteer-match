import type { Config } from 'jest'
import nextJest from 'next/jest.js'
 
const createJestConfig = nextJest({
  dir: './',
})
 
const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'node', // Use 'node' for backend testing
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  collectCoverageFrom: [
    'src/lib/services/**/*.{ts,tsx}',
    'src/lib/repositories/**/*.{ts,tsx}',
    'src/lib/validations/**/*.{ts,tsx}',
    '!src/lib/services/__tests__/**',
    '!src/lib/repositories/__tests__/**',
    '!src/lib/validations/__tests__/**',
    '!**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testPathIgnorePatterns: [
    '/node_modules/',
    'jest.setup.ts',
    '__tests__/test-utils.ts'
  ],
}
 
export default createJestConfig(config)