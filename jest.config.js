/** @type {import('jest').Config} */
const config = {
  transform: {
    "^.+\\.(ts|tsx|js|jsx)$": [
      "babel-jest",
      { configFile: "./babel.config.jest.js" },
    ],
  },
  transformIgnorePatterns: [
    "node_modules/(?!(.*\\.mjs$|@testing-library|@tanstack))",
  ],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jsdom",
  testPathIgnorePatterns: [
    "<rootDir>/.next/",
    "<rootDir>/node_modules/",
    "<rootDir>/src/__tests__/setup/",
    "<rootDir>/src/__tests__/mocks/",
  ],
  moduleNameMapper: {
    "^@/tests/(.*)$": "<rootDir>/tests/$1",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.stories.{js,jsx,ts,tsx}",
    "!src/**/index.{js,jsx,ts,tsx}",
  ],
  coverageReporters: ["text", "lcov", "html"],
  testMatch: [
    "<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}",
    "<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}",
    // '<rootDir>/tests/**/*.{test,spec}.{js,jsx,ts,tsx}', // Disabled due to MSW compatibility issues
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  testEnvironmentOptions: {
    url: "http://localhost:3000",
  },
}

export default config
