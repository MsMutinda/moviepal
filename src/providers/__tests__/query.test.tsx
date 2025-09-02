import { render, screen } from "@testing-library/react"
import React from "react"

import QueryProvider, { createQueryClient } from "@/providers/query"

// Mock React Query
jest.mock("@tanstack/react-query", () => ({
  QueryClient: jest.fn().mockImplementation((config) => ({
    ...config,
    defaultOptions: config.defaultOptions,
  })),
  QueryClientProvider: ({
    children,
    client,
  }: {
    children: React.ReactNode
    client: { defaultOptions: unknown }
  }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mockReact = require("react")
    return mockReact.createElement(
      "div",
      {
        "data-testid": "query-client-provider",
        "data-client": JSON.stringify(client.defaultOptions),
      },
      children,
    )
  },
}))

// Mock React Query Devtools
jest.mock("@tanstack/react-query-devtools", () => ({
  ReactQueryDevtools: ({ initialIsOpen }: { initialIsOpen: boolean }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mockReact = require("react")
    return mockReact.createElement(
      "div",
      {
        "data-testid": "react-query-devtools",
        "data-initial-open": initialIsOpen,
      },
      "DevTools",
    )
  },
}))

// Mock useState
const mockSetState = jest.fn()
jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useState: jest.fn((initial) => [initial, mockSetState]),
}))

describe("QueryProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset environment
    process.env.NODE_ENV = "test"
  })

  it("should render children", () => {
    render(
      <QueryProvider>
        <div data-testid="child">Test Child</div>
      </QueryProvider>,
    )

    expect(screen.getByTestId("child")).toBeInTheDocument()
    expect(screen.getByText("Test Child")).toBeInTheDocument()
  })

  it("should not show devtools by default in test environment", () => {
    render(
      <QueryProvider>
        <div>Test</div>
      </QueryProvider>,
    )

    expect(screen.queryByTestId("react-query-devtools")).not.toBeInTheDocument()
  })

  it("should show devtools when showDevtools prop is true", () => {
    render(
      <QueryProvider showDevtools={true}>
        <div>Test</div>
      </QueryProvider>,
    )

    expect(screen.getByTestId("react-query-devtools")).toBeInTheDocument()
    expect(screen.getByTestId("react-query-devtools")).toHaveAttribute(
      "data-initial-open",
      "false",
    )
  })

  it("should not show devtools when showDevtools prop is false", () => {
    render(
      <QueryProvider showDevtools={false}>
        <div>Test</div>
      </QueryProvider>,
    )

    expect(screen.queryByTestId("react-query-devtools")).not.toBeInTheDocument()
  })

  it("should handle multiple children", () => {
    render(
      <QueryProvider>
        <div data-testid="child1">Child 1</div>
        <div data-testid="child2">Child 2</div>
        <span data-testid="child3">Child 3</span>
      </QueryProvider>,
    )

    expect(screen.getByTestId("child1")).toBeInTheDocument()
    expect(screen.getByTestId("child2")).toBeInTheDocument()
    expect(screen.getByTestId("child3")).toBeInTheDocument()
  })

  it("should handle empty children", () => {
    render(<QueryProvider>{null}</QueryProvider>)

    const queryProvider = screen.getByTestId("query-client-provider")
    expect(queryProvider).toBeInTheDocument()
    expect(queryProvider).toBeEmptyDOMElement()
  })

  it("should handle undefined children", () => {
    render(<QueryProvider>{undefined}</QueryProvider>)

    const queryProvider = screen.getByTestId("query-client-provider")
    expect(queryProvider).toBeInTheDocument()
    expect(queryProvider).toBeEmptyDOMElement()
  })
})

describe("createQueryClient", () => {
  it("should create a QueryClient with correct configuration", () => {
    const client = createQueryClient()

    expect(client).toBeDefined()
    expect(client.defaultOptions).toEqual({
      queries: {
        staleTime: 5 * 60_000,
        gcTime: 10 * 60_000,
        retry: expect.any(Function),
        refetchOnWindowFocus: false,
        retryDelay: expect.any(Function),
        refetchOnMount: true,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 2,
        retryDelay: expect.any(Function),
      },
    })
  })

  it("should create independent QueryClient instances", () => {
    const client1 = createQueryClient()
    const client2 = createQueryClient()

    expect(client1).not.toBe(client2)
    // Test that the configurations are equivalent
    expect(client1.defaultOptions.queries.staleTime).toBe(
      client2.defaultOptions.queries.staleTime,
    )
    expect(client1.defaultOptions.queries.gcTime).toBe(
      client2.defaultOptions.queries.gcTime,
    )
    expect(client1.defaultOptions.mutations.retry).toBe(
      client2.defaultOptions.mutations.retry,
    )
  })

  it("should test retry function for queries", () => {
    const client = createQueryClient()
    const retryFunction = client.defaultOptions.queries.retry

    // Test AbortError should not retry
    const abortError = new Error("Request aborted")
    abortError.name = "AbortError"
    expect(retryFunction(1, abortError)).toBe(false)

    // Test other errors should retry up to 2 times
    const normalError = new Error("Network error")
    expect(retryFunction(0, normalError)).toBe(true)
    expect(retryFunction(1, normalError)).toBe(true)
    expect(retryFunction(2, normalError)).toBe(false)
  })

  it("should test retry delay function for queries", () => {
    const client = createQueryClient()
    const retryDelayFunction = client.defaultOptions.queries.retryDelay

    // Test exponential backoff with max delay
    expect(retryDelayFunction(0)).toBe(1000) // 1000 * 2^0
    expect(retryDelayFunction(1)).toBe(2000) // 1000 * 2^1
    expect(retryDelayFunction(2)).toBe(4000) // 1000 * 2^2
    expect(retryDelayFunction(5)).toBe(30000) // Max delay of 30000
  })

  it("should test retry delay function for mutations", () => {
    const client = createQueryClient()
    const retryDelayFunction = client.defaultOptions.mutations.retryDelay

    // Test exponential backoff with max delay
    expect(retryDelayFunction(0)).toBe(1000) // 1000 * 2^0
    expect(retryDelayFunction(1)).toBe(2000) // 1000 * 2^1
    expect(retryDelayFunction(2)).toBe(4000) // 1000 * 2^2
    expect(retryDelayFunction(5)).toBe(30000) // Max delay of 30000
  })
})
