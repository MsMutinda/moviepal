"use client"

import { ChevronsUpDown, LogOutIcon, UserIcon } from "lucide-react"
import { redirect } from "next/navigation"
import { startTransition, useActionState, useState } from "react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/clients/auth"
import { routes } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils/styles"
import { User } from "better-auth"

function getInitials(name: string): string {
  const names = name.trim().split(" ")
  if (names.length >= 2) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase()
  }
  return name[0].toUpperCase()
}

function UserNavSkeleton() {
  return (
    <Button
      size="lg"
      className="hover:bg-transparent active:bg-transparent gap-2 justify-start"
      aria-label="Loading user menu"
      disabled
    >
      <Skeleton className="size-8 rounded-lg" />
      <div className="grid flex-1 gap-1">
        <Skeleton className="h-3.5 w-1/2 rounded-md" />
        <Skeleton className="h-3 w-4/5 rounded-md" />
      </div>
    </Button>
  )
}

export function UserNav({ isPending, user }: { isPending: boolean, user: User | null }) {
  const [isSignedOut, setIsSignedOut] = useState(false)
  const router = useRouter()
  const [, formAction, isPendingLogout] = useActionState(async () => {
    await authClient.signOut({
      fetchOptions: {
        onError: ({ error }) => {
          toast.error("Authentication failed", {
            description: error.message,
          })
        },
        onSuccess: () => {
          setIsSignedOut(true)
          redirect(routes.auth.signin)
        },
      },
    })
  }, null)

  const handleSignOut = () => {
    startTransition(() => {
      formAction()
    })
  }

  if (isPending) {
    return <UserNavSkeleton />
  }

  if (!user) {
    return (
      <Button asChild
        size="lg"
        variant="outline"
        className="gap-2 justify-start bg-[#009A9C] hover:bg-[#009A9C]/90"
        aria-label="Sign in"
      >
        <Link href={routes.auth.signin} prefetch>
          <UserIcon className="text-white" />
        </Link>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="lg"
          variant="ghost"
          aria-label="User menu"
          className={cn("gap-2 px-2 sm:px-3 transition-colors hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background")}
        > 
          <Avatar className="size-8 rounded-lg">
            <AvatarImage src={user.image ?? ""} alt={user.name} />
            <AvatarFallback className="rounded-lg bg-muted text-muted-foreground">{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="hidden md:grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">{user.email}</span>
          </div>
          <ChevronsUpDown className="ml-auto size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[var(--radix-dropdown-menu-trigger-width)] rounded-lg bg-popover text-popover-foreground border border-border shadow-md"
        side="bottom"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuItem aria-label="Go to Profile" className="cursor-pointer" onClick={() => router.push(routes.user.profile)}>
            <UserIcon /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem disabled={isPendingLogout || isSignedOut} onClick={handleSignOut} aria-label="Sign out" className="cursor-pointer">
          <LogOutIcon />
          {isPendingLogout || isSignedOut ? "Signing out..." : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
