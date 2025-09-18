# Testing Guide for MoviePal

This document provides a comprehensive guide to the testing setup and how to run tests for the MoviePal application.

## Test Structure

The testing setup includes:

- **Unit Tests**: Test individual functions and utilities in isolation
- **Integration Tests**: Test API routes and services working together
- **Mock Services**: Mock external dependencies like TMDB API and database

## Test Files

### Utility Tests

- `src/lib/utils/__tests__/api.test.ts` - Tests for API utility functions
- `src/lib/utils/__tests__/styles.test.ts` - Tests for CSS class name utilities
- `src/lib/utils/__tests__/rate-limit.simple.test.ts` - Tests for rate limiting functionality

### Service Tests

- `src/services/__tests__/tmdb.service.test.ts` - Tests for TMDB API service

### API Route Tests

- `src/app/api/lists/[identifier]/items/__tests__/route.test.ts` - Tests for list items API
- `src/app/api/movies/search/__tests__/route.test.ts` - Tests for movie search API

### Integration Tests

- `tests/integration/api.integration.test.ts` - End-to-end API tests

## Running Tests

### Run All Tests

```bash
pnpm test
```

### Run Tests in Watch Mode

```bash
pnpm run test:watch
```

### Run Tests with Coverage

```bash
pnpm run test:coverage
```

### Run Specific Test Files

```bash
pnpm test -- --testPathPattern="api.test.ts"
```

### Run Tests for Specific Directory

```bash
pnpm test -- src/lib/utils/__tests__/
```

## Test Configuration

### Jest Configuration

- **Config File**: `jest.config.js`
- **Setup File**: `jest.setup.js`
- **Environment**: Node.js environment for API testing

### Mock Setup

- **MSW (Mock Service Worker)**: Used for mocking HTTP requests
- **Jest Mocks**: Used for mocking modules and functions
- **Test Utilities**: Helper functions in `tests/setup/test-utils.ts`

## Writing Tests

### Unit Test Example

```typescript
import { buildQueryString } from "../api"

describe("API Utils", () => {
  it("should build query string from params", () => {
    const params = { page: 1, limit: 20, search: "test" }
    const result = buildQueryString(params)
    expect(result).toBe("&page=1&limit=20&search=test")
  })
})
```

### API Route Test Example

```typescript
import { GET } from "../route"
import { createMockRequest } from "../../../../../../tests/setup/test-utils"

describe("/api/movies/search", () => {
  it("should return empty results when query is missing", async () => {
    const request = createMockRequest("http://localhost:3000/api/movies/search")
    const response = await GET(request)

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.results).toEqual([])
  })
})
```

### Service Test Example

```typescript
import { tmdbService } from "../tmdb.service"

describe("TMDB Service", () => {
  it("should make successful API request", async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue(mockData),
    }
    global.fetch = jest.fn().mockResolvedValue(mockResponse)

    const result = await tmdbService.getMovieDetails(12345)
    expect(result).toEqual(mockData)
  })
})
```

## Mock Data

### Test Utilities

Located in `tests/setup/test-utils.ts`:

- `createMockRequest()` - Creates mock NextRequest objects
- `mockSession` - Mock user session data
- `mockTmdbMovie` - Mock TMDB movie data
- `mockList`, `mockMovie`, `mockListItem` - Mock database entities

### MSW Handlers

Located in `tests/mocks/handlers.ts`:

- Mock TMDB API responses
- Mock search, popular, trending, and genre endpoints
- Mock languages and regions endpoints

## Best Practices

### 1. Test Isolation

- Each test should be independent
- Use `beforeEach` and `afterEach` to clean up state
- Mock external dependencies

### 2. Descriptive Test Names

```typescript
it("should return 401 when user is not authenticated", async () => {
  // test implementation
})
```

### 3. Arrange-Act-Assert Pattern

```typescript
it("should add movie to list", async () => {
  // Arrange
  const request = createMockRequest("/api/lists/test/items", {
    method: "POST",
    body: { movieId: 12345 },
  })

  // Act
  const response = await POST(request, {
    params: Promise.resolve({ identifier: "test" }),
  })

  // Assert
  expect(response.status).toBe(200)
  const body = await response.json()
  expect(body.success).toBe(true)
})
```

### 4. Mock External Dependencies

```typescript
// Mock the database
jest.mock("@/lib/database/database", () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
  },
}))

// Mock the TMDB service
jest.mock("@/services/tmdb.service", () => ({
  tmdbService: {
    getMovieDetails: jest.fn(),
  },
}))
```

## Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

## Continuous Integration

Tests are configured to run in CI environments with:

- `pnpm run test:ci` - Runs tests without watch mode
- Coverage reporting
- Exit on test failure

## Troubleshooting

### Common Issues

1. **Module Resolution Errors**
   - Check Jest configuration in `jest.config.js`
   - Verify path mappings for `@/` imports

2. **Mock Not Working**
   - Ensure mocks are defined before imports
   - Check mock implementation matches expected interface

3. **Async Test Issues**
   - Use `async/await` for async operations
   - Use `done()` callback for callback-based tests

4. **Environment Variables**
   - Set test environment variables in `jest.setup.js`
   - Mock environment-dependent code

### Debug Mode

```bash
pnpm test -- --verbose
```

### Run Single Test

```bash
pnpm test -- --testNamePattern="should return 401"
```
