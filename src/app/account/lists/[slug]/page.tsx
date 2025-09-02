"use client"

import { ArrowLeft, Bookmark, Search, Trash2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useState } from "react"

import { RemoveItemDialog } from "@/components/remove-item-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useInfiniteScroll } from "@/hooks/use-intersection-observer"
import { useListItems } from "@/hooks/use-list-items"
import { useLists } from "@/hooks/use-lists"
import { tmdbBaseImageUrl } from "@/lib/constants"
import { ListItem } from "@/lib/types"

export default function ListViewPage() {
  const params = useParams()
  const slug = params.slug as string
  const [searchQuery, setSearchQuery] = useState("")
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [itemToRemove, setItemToRemove] = useState<{
    movieId: string
    movieTitle: string
  } | null>(null)

  const { data: lists, isLoading: listsLoading } = useLists()
  const {
    items,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    removeItemAsync,
    isRemovingItem,
  } = useListItems(slug, searchQuery)

  const currentList = lists?.find((list) => list.slug === slug)

  const sentinelRef = useInfiniteScroll(
    () => {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    },
    hasNextPage,
    isFetchingNextPage,
    { rootMargin: "200px" },
  )

  const handleRemoveItem = (movieId: string, movieTitle: string) => {
    setItemToRemove({ movieId, movieTitle })
    setRemoveDialogOpen(true)
  }

  const handleConfirmRemove = async () => {
    if (itemToRemove && currentList?.id) {
      try {
        await removeItemAsync({
          listId: currentList.id,
          movieId: itemToRemove.movieId,
        })
        setRemoveDialogOpen(false)
        setItemToRemove(null)
      } catch {
        // Error is already handled by the mutation's onError callback
        // Dialog stays open so user can try again
      }
    }
  }

  if (listsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#009A9C]"></div>
        </div>
      </div>
    )
  }

  if (!currentList) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="space-y-4 text-center">
            <h1 className="text-foreground text-2xl font-bold">
              List Not Found
            </h1>
            <p className="text-muted-foreground">
              The list you're looking for doesn't exist.
            </p>
            <Link href="/account/lists">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Lists
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-4">
          <Link href="/account/lists">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Lists
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Bookmark className="text-primary h-5 w-5" />
            <h1 className="text-foreground text-3xl font-bold">
              {currentList.title}
            </h1>
            {currentList.isBuiltin && (
              <Badge variant="secondary" className="text-xs">
                {currentList.builtinType === "favorites"
                  ? "Favorites"
                  : "Watch Later"}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="relative w-80">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search within this list..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#009A9C]"></div>
        </div>
      ) : error ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            Failed to load list items. Please try again.
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center">
          <div className="space-y-4">
            <Bookmark className="text-muted-foreground mx-auto h-12 w-12" />
            <div>
              <h3 className="text-foreground mb-2 text-lg font-medium">
                {searchQuery ? "No items found" : "This list is empty"}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? `No items match "${searchQuery}"`
                  : "Add some movies to get started"}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item: ListItem) => (
              <Card
                key={`${item.id}-${item.movieId}`}
                className="group overflow-hidden border-[#CCCCCC]/50 py-0 transition-all duration-300 hover:scale-105 hover:border-[#009A9C]/50"
              >
                <CardContent className="p-0">
                  <div className="relative">
                    <div className="aspect-[2/3] overflow-hidden">
                      <Link href={`/movies/${item.movie.tmdbId}`}>
                        <Image
                          width={500}
                          height={750}
                          src={
                            item.movie.metadata?.poster_path
                              ? `${tmdbBaseImageUrl}original${item.movie.metadata.poster_path}`
                              : "https://picsum.photos/500/750"
                          }
                          alt={item.movie.title}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />
                      </Link>

                      <div className="absolute top-2 right-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8 w-8 p-0 shadow-lg"
                          onClick={() =>
                            handleRemoveItem(item.movieId, item.movie.title)
                          }
                          disabled={isRemovingItem}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <Link href={`/movies/${item.movie.tmdbId}`}>
                      <h3 className="hover:text-primary mb-1 line-clamp-2 text-sm font-semibold transition-colors">
                        {item.movie.title}
                      </h3>
                    </Link>
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-muted-foreground text-xs">
                        {item.movie.year || "N/A"}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {item.addedAt
                          ? `Added ${new Date(item.addedAt).toLocaleDateString()}`
                          : "Added N/A"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {hasNextPage && (
            <div
              ref={sentinelRef as React.Ref<HTMLDivElement>}
              className="h-10 w-full"
            />
          )}

          {isFetchingNextPage && (
            <div className="flex justify-center py-6">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#009A9C] border-t-transparent" />
            </div>
          )}
        </div>
      )}

      {itemToRemove && (
        <RemoveItemDialog
          open={removeDialogOpen}
          onOpenChange={(open) => {
            if (!isRemovingItem) {
              setRemoveDialogOpen(open)
              if (!open) {
                setItemToRemove(null)
              }
            }
          }}
          onConfirm={handleConfirmRemove}
          movieTitle={itemToRemove.movieTitle}
          isRemoving={isRemovingItem}
        />
      )}
    </div>
  )
}
