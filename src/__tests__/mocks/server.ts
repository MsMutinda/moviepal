import { setupServer } from "msw/node"

import { tmdbHandlers } from "@/__tests__/mocks/handlers"

// Setup MSW server for testing
export const server = setupServer(...tmdbHandlers)

// Start server before all tests
beforeAll(() => server.listen())

// Reset handlers after each test
afterEach(() => server.resetHandlers())

// Clean up after all tests
afterAll(() => server.close())
