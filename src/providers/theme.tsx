"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({ children }: React.PropsWithChildren) {
  return (
    <NextThemesProvider attribute="class" disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  )
}
