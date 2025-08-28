import Link from "next/link"

import { ThemeToggle } from "@/components/common/theme-toggle"
import { Button } from "@/components/ui/button"
import { appInfo, routes } from "@/lib/constants"

export function Header() {
  return (
    <header className="relative z-50 flex items-center justify-between p-4 sm:p-6">
      <Link href="/" className="flex items-center space-x-2">
        <h1 className="text-2xl font-bold text-[#009A9C] sm:text-3xl">
          {appInfo.name}
        </h1>
      </Link>

      <div className="flex items-center gap-2 sm:gap-4">
        <ThemeToggle />
        <div className="flex items-center gap-2">
          <Button
            asChild
            className="bg-[#009A9C] px-3 py-2 text-xs text-white hover:bg-[#009A9C]/90 sm:px-4 sm:text-sm"
          >
            <Link href={routes.auth.signup}>Get started for free</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
