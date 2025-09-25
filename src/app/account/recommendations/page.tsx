"use client"

import {
  Calendar,
  Filter,
  RefreshCw,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react"
import { useState } from "react"

import { MovieGrid } from "@/components/movie-grid"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useMovieBatchStatus } from "@/hooks/use-movie-batch-status"
import { useMovieRecommendations } from "@/hooks/use-movie-recommendations"
import { authClient } from "@/lib/clients/auth"

export default function RecommendationsPage() {
  const { data: session } = authClient.useSession()
  const isAuthenticated = !!session?.user
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [forceRefresh, setForceRefresh] = useState(false)

  const {
    data: recommendationsData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useMovieRecommendations(page, limit, forceRefresh)

  const movieIds =
    recommendationsData?.results?.map((movie) => movie.id.toString()) || []

  const { data: batchStatusData } = useMovieBatchStatus(movieIds)

  const safeBatchStatusData = batchStatusData || { movies: {} }

  const handleRefresh = () => {
    setForceRefresh(true)
    refetch()
    // reset force refresh after a short delay
    setTimeout(() => setForceRefresh(false), 1000)
  }

  const handleNextPage = () => {
    setPage((prev) => prev + 1)
  }

  const handlePrevPage = () => {
    setPage((prev) => Math.max(1, prev - 1))
  }

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit)
    setPage(1)
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h3 className="mb-4 text-xl font-bold">Movie Recommendations</h3>
          <div className="mx-auto max-w-md rounded-lg border border-red-200 bg-red-50 p-6">
            <p className="mb-4 text-red-600">
              Failed to load recommendations: {error?.message}
            </p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="mb-4 sm:mb-0">
          <h1 className="flex items-center gap-2 text-xl font-bold">
            <Sparkles className="h-8 w-8" />
            Movie Recommendations
          </h1>
          <p className="text-muted-foreground mt-2">
            Personalized suggestions based on your preferences, ratings, and
            lists
          </p>
        </div>

        <div className="flex items-center gap-2">
          {recommendationsData?.reason && (
            <Badge variant="secondary" className="text-sm">
              {getReasonIcon(recommendationsData.reason)}
              {recommendationsData.reason}
            </Badge>
          )}
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isRefetching}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      <div className="mb-6 space-y-4">
        {recommendationsData?.userActivity && (
          <div className="grid grid-cols-1 gap-4 rounded-lg bg-blue-50 p-4 sm:grid-cols-3 dark:bg-blue-950/20">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {recommendationsData.userActivity.likedMovies}
              </div>
              <div className="text-muted-foreground text-sm">Liked Movies</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {recommendationsData.userActivity.ratedMovies}
              </div>
              <div className="text-muted-foreground text-sm">Rated Movies</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {recommendationsData.userActivity.totalLists}
              </div>
              <div className="text-muted-foreground text-sm">
                Favorite Genres
              </div>
            </div>
          </div>
        )}

        {recommendationsData?.recommendationStats && (
          <div className="bg-muted/30 grid grid-cols-2 gap-2 rounded-lg p-3 sm:grid-cols-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                {recommendationsData.recommendationStats.genreBased}
              </div>
              <div className="text-muted-foreground text-xs">Genre-based</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                {recommendationsData.recommendationStats.ratingBased}
              </div>
              <div className="text-muted-foreground text-xs">Rating-based</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {recommendationsData.recommendationStats.popularityBased}
              </div>
              <div className="text-muted-foreground text-xs">Popularity</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                {recommendationsData.recommendationStats.recencyBased}
              </div>
              <div className="text-muted-foreground text-xs">Recent</div>
            </div>
          </div>
        )}

        <div className="bg-muted/50 flex flex-col gap-4 rounded-lg p-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Results per page:</span>
            <select
              value={limit}
              onChange={(e) => handleLimitChange(parseInt(e.target.value))}
              className="rounded border px-2 py-1 text-sm"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <span>Auto-refresh:</span>
            <Badge variant="outline" className="text-xs">
              Every 10 minutes
            </Badge>
          </div>

          {recommendationsData?.generatedAt && (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <span>Last updated:</span>
              <Badge variant="outline" className="text-xs">
                {new Date(recommendationsData.generatedAt).toLocaleTimeString()}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[2/3] w-full rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recommendationsData &&
        recommendationsData.results?.length > 0 &&
        !isLoading && (
          <>
            <div className="mb-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  Showing {recommendationsData.results.length} recommendations
                </h2>
                {recommendationsData.total_results && (
                  <p className="text-muted-foreground text-sm">
                    {recommendationsData.total_results} total results
                  </p>
                )}
              </div>
            </div>

            <MovieGrid
              movies={recommendationsData.results}
              batchStatusData={safeBatchStatusData.movies}
              showRecommendationInfo={true}
              showDismissButton={true}
              isAuthenticated={isAuthenticated}
            />

            {recommendationsData.total_pages &&
              recommendationsData.total_pages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-4">
                  <Button
                    onClick={handlePrevPage}
                    disabled={page === 1}
                    variant="outline"
                  >
                    Previous
                  </Button>

                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">
                      Page {page} of {recommendationsData.total_pages}
                    </span>
                  </div>

                  <Button
                    onClick={handleNextPage}
                    disabled={page >= recommendationsData.total_pages}
                    variant="outline"
                  >
                    Next
                  </Button>
                </div>
              )}
          </>
        )}

      {recommendationsData &&
        recommendationsData.results?.length === 0 &&
        !isLoading && (
          <div className="py-12 text-center">
            <Sparkles className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
            <h3 className="mb-2 text-xl font-semibold">
              No recommendations available
            </h3>
            <p className="text-muted-foreground mb-6">
              Start liking movies and adding them to your lists to get
              personalized recommendations!
            </p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Recommendations
            </Button>
          </div>
        )}
    </div>
  )
}

function getReasonIcon(reason: string) {
  if (reason.includes("Popular")) {
    return <TrendingUp className="mr-1 h-3 w-3" />
  }
  if (reason.includes("rated")) {
    return <Star className="mr-1 h-3 w-3" />
  }
  if (reason.includes("Recent")) {
    return <Calendar className="mr-1 h-3 w-3" />
  }
  return <Sparkles className="mr-1 h-3 w-3" />
}
