import { render, screen } from "@testing-library/react"
import React from "react"

import QueryProvider from "@/providers/query"
import { ThemeProvider } from "@/providers/theme"

// Mock next-themes
jest.mock("next-themes", () => ({
  ThemeProvider: ({
    children,
    ...props
  }: {
    children: React.ReactNode
    [key: string]: unknown
  }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mockReact = require("react")
    return mockReact.createElement(
      "div",
      {
        "data-testid": "theme-provider",
        "data-props": JSON.stringify(props),
      },
      children,
    )
  },
}))

// Mock React Query
jest.mock("@tanstack/react-query", () => ({
  QueryClient: jest.fn().mockImplementation((config) => ({
    ...config,
    defaultOptions: config.defaultOptions,
  })),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mockReact = require("react")
    return mockReact.createElement(
      "div",
      { "data-testid": "query-client-provider" },
      children,
    )
  },
}))

// Mock React Query Devtools
jest.mock("@tanstack/react-query-devtools", () => ({
  ReactQueryDevtools: () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mockReact = require("react")
    return mockReact.createElement(
      "div",
      { "data-testid": "react-query-devtools" },
      "DevTools",
    )
  },
}))

// Mock useState
jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useState: jest.fn((initial) => [initial, jest.fn()]),
}))

describe("Providers Integration", () => {
  it("should render both providers together", () => {
    render(
      <QueryProvider showDevtools={false}>
        <ThemeProvider>
          <div data-testid="app-content">App Content</div>
        </ThemeProvider>
      </QueryProvider>,
    )

    expect(screen.getByTestId("query-client-provider")).toBeInTheDocument()
    expect(screen.getByTestId("theme-provider")).toBeInTheDocument()
    expect(screen.getByTestId("app-content")).toBeInTheDocument()
  })

  it("should pass through children correctly", () => {
    render(
      <QueryProvider showDevtools={false}>
        <ThemeProvider>
          <div data-testid="child1">Child 1</div>
          <div data-testid="child2">Child 2</div>
        </ThemeProvider>
      </QueryProvider>,
    )

    expect(screen.getByTestId("child1")).toBeInTheDocument()
    expect(screen.getByTestId("child2")).toBeInTheDocument()
  })

  it("should handle nested providers", () => {
    render(
      <QueryProvider showDevtools={false}>
        <ThemeProvider>
          <QueryProvider showDevtools={false}>
            <ThemeProvider>
              <div data-testid="nested-content">Nested Content</div>
            </ThemeProvider>
          </QueryProvider>
        </ThemeProvider>
      </QueryProvider>,
    )

    expect(screen.getByTestId("nested-content")).toBeInTheDocument()
  })

  it("should maintain provider order", () => {
    render(
      <QueryProvider showDevtools={false}>
        <ThemeProvider>
          <div data-testid="content">Content</div>
        </ThemeProvider>
      </QueryProvider>,
    )

    const queryProvider = screen.getByTestId("query-client-provider")
    const themeProvider = screen.getByTestId("theme-provider")
    const content = screen.getByTestId("content")

    expect(queryProvider).toContainElement(themeProvider)
    expect(themeProvider).toContainElement(content)
  })

  it("should handle custom props for both providers", () => {
    render(
      <QueryProvider showDevtools={true}>
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="dark"
          enableSystem={false}
        >
          <div data-testid="content">Content</div>
        </ThemeProvider>
      </QueryProvider>,
    )

    const themeProvider = screen.getByTestId("theme-provider")
    const props = JSON.parse(themeProvider.getAttribute("data-props") || "{}")

    expect(props.attribute).toBe("data-theme")
    expect(props.defaultTheme).toBe("dark")
    expect(props.enableSystem).toBe(false)
    expect(screen.getByTestId("react-query-devtools")).toBeInTheDocument()
  })
})
