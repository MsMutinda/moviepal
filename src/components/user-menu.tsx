"use client"

import { User } from "better-auth"
import {
  ChevronsUpDown,
  ListIcon,
  LogOutIcon,
  SparklesIcon,
  UserIcon,
} from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { useRouter } from "next/navigation"
import { startTransition, useActionState, useState } from "react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { authClient } from "@/lib/clients/auth"
import { routes } from "@/lib/constants"
import { cn } from "@/lib/utils/styles"

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
      className="justify-start gap-2 hover:bg-transparent active:bg-transparent"
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

export function UserNav({
  isPending,
  user,
}: {
  isPending: boolean
  user: User | null
}) {
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
      <Button
        asChild
        size="lg"
        variant="outline"
        className="justify-start gap-2 bg-[#009A9C] hover:bg-[#009A9C]/90"
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
          className={cn(
            "hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground focus-visible:ring-ring focus-visible:ring-offset-background gap-2 px-2 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 sm:px-3",
          )}
        >
          <Avatar className="size-8 rounded-lg">
            <AvatarImage src={user.image ?? ""} alt={user.name} />
            <AvatarFallback className="bg-muted text-muted-foreground rounded-lg">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden flex-1 text-left text-sm leading-tight md:grid">
            <span className="truncate font-medium">{user.name}</span>
            <span className="text-muted-foreground truncate text-xs">
              {user.email}
            </span>
          </div>
          <ChevronsUpDown className="ml-auto size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="bg-popover text-popover-foreground border-border w-[var(--radix-dropdown-menu-trigger-width)] rounded-lg border shadow-md"
        side="bottom"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuItem
          aria-label="Visit Profile"
          className="cursor-pointer"
          onClick={() => router.push(routes.account.profile)}
        >
          <UserIcon /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem
          aria-label="View Your Lists"
          className="cursor-pointer"
          onClick={() => router.push(routes.account.lists)}
        >
          <ListIcon /> My Lists
        </DropdownMenuItem>
        <DropdownMenuItem
          aria-label="View Discover"
          className="cursor-pointer"
          onClick={() => router.push(routes.account.recommendations)}
        >
          <SparklesIcon /> Discover
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={isPendingLogout || isSignedOut}
          onClick={handleSignOut}
          aria-label="Sign out"
          className="cursor-pointer"
        >
          <LogOutIcon />
          {isPendingLogout || isSignedOut ? "Signing out..." : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
