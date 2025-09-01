"use client"

import { ChevronDown, Loader2 } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDebouncedValue } from "@/hooks/use-debounce"
import { useInfiniteScroll } from "@/hooks/use-intersection-observer"
import { useRegionsInfinite } from "@/hooks/use-tmdb-data"

interface RegionsDropdownProps {
  value?: string
  onValueChange?: (_value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function RegionsDropdown({
  value,
  onValueChange,
  placeholder = "Select region",
  disabled = false,
  className,
}: RegionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Debounce search term to prevent excessive filtering
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 150)

  const {
    data,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    isLoading,
  } = useRegionsInfinite()

  const allRegions = useMemo(() => {
    if (!data?.pages) return []
    return data.pages.flatMap((page) => page.results || [])
  }, [data?.pages])

  const filteredRegions = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return allRegions
    return allRegions.filter((region) =>
      region.english_name
        .toLowerCase()
        .includes(debouncedSearchTerm.toLowerCase()),
    )
  }, [allRegions, debouncedSearchTerm])

  // Only enable infinite scroll when not searching and dropdown is open
  const shouldEnableInfiniteScroll =
    isOpen && !debouncedSearchTerm.trim() && hasNextPage && !isFetchingNextPage

  const sentinelRef = useInfiniteScroll(
    useCallback(() => {
      if (hasNextPage && !isFetchingNextPage && !debouncedSearchTerm.trim()) {
        fetchNextPage()
      }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage, debouncedSearchTerm]),
    shouldEnableInfiniteScroll,
    isFetchingNextPage,
  )

  // Focus management
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      // Small delay to ensure dropdown is fully rendered
      const timer = setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("")
    }
  }, [isOpen])

  const selectedRegion = allRegions.find(
    (region) => region.iso_3166_1 === value,
  )

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleItemClick = (regionId: string) => {
    onValueChange?.(regionId)
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className={`w-full justify-between ${className || ""}`}
          disabled={disabled}
        >
          {selectedRegion?.english_name || placeholder}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-[300px] w-full min-w-[200px] overflow-y-auto">
        <div className="border-b p-2">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search regions..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full rounded border px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
            onKeyDown={(e) => {
              // Prevent dropdown from closing on Enter
              if (e.key === "Enter") {
                e.preventDefault()
              }
            }}
          />
        </div>

        <div className="max-h-[200px] overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center p-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-muted-foreground ml-2 text-sm">
                Loading regions...
              </span>
            </div>
          )}

          {!isLoading &&
            filteredRegions.length === 0 &&
            debouncedSearchTerm.trim() && (
              <div className="text-muted-foreground p-2 text-sm">
                No regions found matching "{debouncedSearchTerm}"
              </div>
            )}

          {!isLoading &&
            filteredRegions.map((region) => (
              <DropdownMenuItem
                key={region.iso_3166_1}
                onClick={() => handleItemClick(region.iso_3166_1)}
                className="cursor-pointer"
              >
                {region.english_name}
              </DropdownMenuItem>
            ))}

          {!isLoading && isFetchingNextPage && !debouncedSearchTerm.trim() && (
            <div className="flex items-center justify-center p-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-muted-foreground ml-2 text-sm">
                Loading more...
              </span>
            </div>
          )}

          {!isLoading && error && (
            <div className="p-2 text-sm text-red-600">
              Failed to load regions
            </div>
          )}

          {!isLoading && hasNextPage && !debouncedSearchTerm.trim() && (
            <div
              ref={sentinelRef as React.Ref<HTMLDivElement>}
              className="h-1"
            />
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
