import { render, screen } from "@testing-library/react"
import React from "react"

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

describe("ThemeProvider", () => {
  it("should render children", () => {
    render(
      <ThemeProvider>
        <div data-testid="child">Test Child</div>
      </ThemeProvider>,
    )

    expect(screen.getByTestId("child")).toBeInTheDocument()
    expect(screen.getByText("Test Child")).toBeInTheDocument()
  })

  it("should pass correct default props to NextThemesProvider", () => {
    render(
      <ThemeProvider>
        <div>Test</div>
      </ThemeProvider>,
    )

    const themeProvider = screen.getByTestId("theme-provider")
    const props = JSON.parse(themeProvider.getAttribute("data-props") || "{}")

    expect(props.attribute).toBe("class")
    expect(props.disableTransitionOnChange).toBe(true)
    expect(props.defaultTheme).toBe("system")
    expect(props.enableSystem).toBe(true)
  })

  it("should pass custom props to NextThemesProvider", () => {
    render(
      <ThemeProvider
        attribute="data-theme"
        disableTransitionOnChange={false}
        defaultTheme="dark"
        enableSystem={false}
      >
        <div>Test</div>
      </ThemeProvider>,
    )

    const themeProvider = screen.getByTestId("theme-provider")
    const props = JSON.parse(themeProvider.getAttribute("data-props") || "{}")

    expect(props.attribute).toBe("data-theme")
    expect(props.disableTransitionOnChange).toBe(false)
    expect(props.defaultTheme).toBe("dark")
    expect(props.enableSystem).toBe(false)
  })

  it("should handle multiple children", () => {
    render(
      <ThemeProvider>
        <div data-testid="child1">Child 1</div>
        <div data-testid="child2">Child 2</div>
        <span data-testid="child3">Child 3</span>
      </ThemeProvider>,
    )

    expect(screen.getByTestId("child1")).toBeInTheDocument()
    expect(screen.getByTestId("child2")).toBeInTheDocument()
    expect(screen.getByTestId("child3")).toBeInTheDocument()
  })

  it("should handle empty children", () => {
    render(<ThemeProvider>{null}</ThemeProvider>)

    const themeProvider = screen.getByTestId("theme-provider")
    expect(themeProvider).toBeInTheDocument()
    expect(themeProvider).toBeEmptyDOMElement()
  })

  it("should handle undefined children", () => {
    render(<ThemeProvider>{undefined}</ThemeProvider>)

    const themeProvider = screen.getByTestId("theme-provider")
    expect(themeProvider).toBeInTheDocument()
    expect(themeProvider).toBeEmptyDOMElement()
  })
})
