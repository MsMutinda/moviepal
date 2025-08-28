"use client"

import { Star } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useMemo } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { useInfiniteScroll } from "@/hooks/use-intersection-observer"
import { tmdbBaseImageUrl } from "@/lib/constants"
import { Movie } from "@/lib/types"

interface MovieGridProps {
  movies: Movie[]
  isLoading?: boolean
  error?: string | null
  hasMore?: boolean
  isFetchingNextPage?: boolean
  onLoadMore?: () => void
  showPagination?: boolean
}

export function MovieGrid({
  movies,
  isLoading,
  error,
  hasMore = false,
  isFetchingNextPage = false,
  onLoadMore,
  showPagination = false,
}: MovieGridProps) {
  const uniqueMovies = useMemo(() => {
    const seen = new Set<number>()
    return movies.filter((movie) => {
      if (seen.has(movie.id)) {
        return false
      }
      seen.add(movie.id)
      return true
    })
  }, [movies])

  const sentinelRef = useInfiniteScroll(
    onLoadMore || (() => {}),
    hasMore,
    isFetchingNextPage,
    {
      rootMargin: "200px",
    },
  )

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#009A9C] border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">{error}</p>
      </div>
    )
  }

  if (uniqueMovies.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">No movies found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
        {uniqueMovies.map((movie) => (
          <Link key={movie.id} href={`/movie/${movie.id}`}>
            <Card className="group cursor-pointer overflow-hidden border-[#CCCCCC]/50 py-0 transition-all duration-300 hover:scale-105 hover:border-[#009A9C]/50">
              <CardContent className="p-0">
                <div className="relative">
                  <div className="aspect-[2/3] overflow-hidden">
                    <Image
                      width={500}
                      height={750}
                      src={
                        movie.poster_path
                          ? `${tmdbBaseImageUrl}original${movie.poster_path}`
                          : "https://picsum.photos/500/750"
                      }
                      alt={movie.title}
                      loading="eager"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="mb-1 line-clamp-2 text-sm font-semibold">
                    {movie.title}
                  </h3>
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-muted-foreground text-xs">
                      {movie.release_date
                        ? new Date(movie.release_date).getFullYear()
                        : "N/A"}
                    </p>
                    <div className="text-muted-foreground flex items-center gap-1 text-xs">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>
                        {movie.vote_average
                          ? movie.vote_average.toFixed(1)
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {showPagination && hasMore && onLoadMore && (
        <div
          ref={sentinelRef as React.Ref<HTMLDivElement>}
          className="h-10 w-full"
        />
      )}

      {showPagination && isFetchingNextPage && (
        <div className="flex justify-center py-6">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#009A9C] border-t-transparent" />
        </div>
      )}
    </div>
  )
}
