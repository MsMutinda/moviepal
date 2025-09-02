"use client"

import { Bookmark, Sparkles, Star, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useMemo } from "react"

import { AddListItemDialog } from "@/components/add-to-list-dialog"
import { MovieStatusOverlay } from "@/components/movie-status-overlay"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useInfiniteScroll } from "@/hooks/use-intersection-observer"
import { useListItemsMutations } from "@/hooks/use-list-items"
import { useMovieBatchStatus } from "@/hooks/use-movie-batch-status"
import { useMovieDismiss } from "@/hooks/use-movie-dismiss"
import { tmdbBaseImageUrl } from "@/lib/constants"
import { Movie } from "@/lib/types"

interface RecommendationMovie extends Movie {
  recommendationScore?: number
  recommendationReason?: string
}

type MovieGridMovie = Movie | RecommendationMovie

interface MovieGridProps {
  movies: MovieGridMovie[]
  isLoading?: boolean
  error?: string | null
  hasMore?: boolean
  isFetchingNextPage?: boolean
  onLoadMore?: () => void
  showPagination?: boolean
  showRecommendationInfo?: boolean
  showDismissButton?: boolean
  batchStatusData?: Record<string, { liked: boolean; rating: number | null }>
}

export function MovieGrid({
  movies,
  isLoading,
  error,
  hasMore = false,
  isFetchingNextPage = false,
  onLoadMore,
  showPagination = false,
  showRecommendationInfo = false,
  showDismissButton = false,
  batchStatusData,
}: MovieGridProps) {
  const { isAddingListItem } = useListItemsMutations()
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

  const movieIds = useMemo(
    () => uniqueMovies.map((movie) => movie.id.toString()),
    [uniqueMovies],
  )

  const { getMovieStatus, updateMovieStatus } = useMovieBatchStatus(movieIds)

  const getMovieStatusData = (movieId: string) => {
    if (batchStatusData && batchStatusData[movieId]) {
      return batchStatusData[movieId]
    }
    return getMovieStatus(movieId)
  }

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
          <Card
            key={movie.id}
            className="group overflow-hidden border-[#CCCCCC]/50 py-0 transition-all duration-300 hover:scale-105 hover:border-[#009A9C]/50"
          >
            <CardContent className="p-0">
              <div className="relative">
                <div className="aspect-[2/3] overflow-hidden">
                  <Link href={`/movies/${movie.id}`}>
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
                  </Link>

                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <AddListItemDialog
                      movieId={movie.id}
                      movieTitle={movie.title}
                    >
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0 shadow-lg"
                        disabled={isAddingListItem}
                      >
                        {isAddingListItem ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Bookmark className="h-4 w-4" />
                        )}
                      </Button>
                    </AddListItemDialog>
                    <MovieStatusOverlay
                      movieId={movie.id.toString()}
                      {...getMovieStatusData(movie.id.toString())}
                      onStatusUpdate={(updates) =>
                        updateMovieStatus(movie.id.toString(), updates)
                      }
                    />
                    {showDismissButton && (
                      <DismissButton movieId={movie.id.toString()} />
                    )}
                  </div>
                </div>
              </div>
              <div className="p-3">
                <Link href={`/movies/${movie.id}`}>
                  <h3 className="hover:text-primary mb-1 line-clamp-2 text-sm font-semibold transition-colors">
                    {movie.title}
                  </h3>
                </Link>

                {showRecommendationInfo &&
                  "recommendationReason" in movie &&
                  movie.recommendationReason && (
                    <div className="mb-2">
                      <Badge variant="secondary" className="text-xs">
                        <Sparkles className="mr-1 h-3 w-3" />
                        {(movie as RecommendationMovie).recommendationReason}
                      </Badge>
                    </div>
                  )}

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

function DismissButton({ movieId }: { movieId: string }) {
  const { dismissMovie, isDismissing } = useMovieDismiss(movieId)

  return (
    <Button
      size="sm"
      variant="destructive"
      className="h-8 w-8 p-0 shadow-lg"
      onClick={dismissMovie}
      disabled={isDismissing}
      title="Dismiss from recommendations"
    >
      {isDismissing ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <X className="h-4 w-4" />
      )}
    </Button>
  )
}
