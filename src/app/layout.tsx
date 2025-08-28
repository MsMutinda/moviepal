import "@/styles/globals.css"

import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "sonner"

import { Footer } from "@/components/common/footer"
import { Header } from "@/components/common/header"
import { appInfo } from "@/lib/constants"
import QueryProvider from "@/providers/query"
import { ThemeProvider } from "@/providers/theme"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: appInfo.name,
  description: appInfo.description,
}

export default function RootLayout({ children }: React.PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider>
          <QueryProvider>
            <Header />
            {children}
            <Footer />
          </QueryProvider>
        </ThemeProvider>
        <Toaster className="pointer-events-auto" richColors />
      </body>
    </html>
  )
}
