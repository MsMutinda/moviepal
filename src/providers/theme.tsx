"use client"

import { Attribute, ThemeProvider as NextThemesProvider } from "next-themes"
import { ReactNode } from "react"

interface ThemeProviderProps {
  children: ReactNode
  attribute?: Attribute | Attribute[]
  disableTransitionOnChange?: boolean
  defaultTheme?: string
  enableSystem?: boolean
}

export function ThemeProvider({
  children,
  attribute = "class",
  disableTransitionOnChange = true,
  defaultTheme = "system",
  enableSystem = true,
}: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute={attribute}
      disableTransitionOnChange={disableTransitionOnChange}
      defaultTheme={defaultTheme}
      enableSystem={enableSystem}
    >
      {children}
    </NextThemesProvider>
  )
}
