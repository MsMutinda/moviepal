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
import { useLanguagesInfinite } from "@/hooks/use-tmdb-data"

interface LanguagesDropdownProps {
  value?: string
  onValueChange?: (_value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function LanguagesDropdown({
  value,
  onValueChange,
  placeholder = "Select language",
  disabled = false,
  className,
}: LanguagesDropdownProps) {
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
  } = useLanguagesInfinite()

  const allLanguages = useMemo(() => {
    if (!data?.pages) return []
    return data.pages.flatMap((page) => page.results || [])
  }, [data?.pages])

  const filteredLanguages = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return allLanguages
    return allLanguages.filter((lang) =>
      lang.english_name
        .toLowerCase()
        .includes(debouncedSearchTerm.toLowerCase()),
    )
  }, [allLanguages, debouncedSearchTerm])

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

  const selectedLanguage = allLanguages.find((lang) => lang.iso_639_1 === value)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleItemClick = (languageId: string) => {
    onValueChange?.(languageId)
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
          {selectedLanguage?.english_name || placeholder}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-[300px] w-full min-w-[200px] overflow-y-auto">
        <div className="border-b p-2">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search languages..."
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
                Loading languages...
              </span>
            </div>
          )}

          {!isLoading &&
            filteredLanguages.length === 0 &&
            debouncedSearchTerm.trim() && (
              <div className="text-muted-foreground p-2 text-sm">
                No languages found matching "{debouncedSearchTerm}"
              </div>
            )}

          {!isLoading &&
            filteredLanguages.map((language) => (
              <DropdownMenuItem
                key={language.iso_639_1}
                onClick={() => handleItemClick(language.iso_639_1)}
                className="cursor-pointer"
              >
                {language.english_name}
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
              Failed to load languages
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
