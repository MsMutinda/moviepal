"use client"

import { Calendar, Star } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import FiltersDialog from "@/components/common/filters-dialog"
import SearchArea from "@/components/common/search-area"
import { MovieGrid } from "@/components/movie-grid"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDebouncedValue } from "@/hooks/use-debounce"
import type { MovieDiscoveryParams } from "@/hooks/use-tmdb-data"
import {
  useLandingPageData,
  useMovieDiscoveryInfinite,
  useMovieTabs,
} from "@/hooks/use-tmdb-data"
import { tmdbBaseImageUrl } from "@/lib/constants"
import { MovieTab } from "@/lib/types"

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedQuery = useDebouncedValue(searchQuery, 500)
  const [sortBy, setSortBy] = useState("popularity.desc")
  const [yearFrom, setYearFrom] = useState("")
  const [yearTo, setYearTo] = useState("")
  const [minRating, setMinRating] = useState("")
  const [genre, setGenre] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [activeTab, setActiveTab] = useState<MovieTab>("trending")

  const discoverParams = useMemo(() => {
    const p: MovieDiscoveryParams = { sort_by: sortBy }
    if (yearFrom) p["primary_release_date.gte"] = `${yearFrom}-01-01` as string
    if (yearTo) p["primary_release_date.lte"] = `${yearTo}-12-31` as string
    if (minRating) p["vote_average.gte"] = minRating as string
    if (genre) p.with_genres = genre
    return p
  }, [sortBy, yearFrom, yearTo, minRating, genre])

  const { genres, trendingMovie, trendingMovieTrailer, isLoading } =
    useLandingPageData()
  const {
    movies: tabMovies,
    isLoading: isLoadingTab,
    isFetchingNextPage: isTabFetchingNextPage,
    hasMore: tabHasMore,
    fetchNextPage: fetchNextTabPage,
  } = useMovieTabs(activeTab)
  const {
    movies: discoverMovies,
    isLoading: isDiscoverLoading,
    isFetchingNextPage,
    fetchNextPage,
    refetch: refetchDiscover,
    hasMore,
    error: discoverError,
    hasActiveFilters,
  } = useMovieDiscoveryInfinite({
    search: debouncedQuery,
    discoverParams,
  })

  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const isIntersectingRef = useRef(false)
  useEffect(() => {
    if (!sentinelRef.current) return
    const element = sentinelRef.current
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (
          entry.isIntersecting &&
          !isIntersectingRef.current &&
          !isFetchingNextPage &&
          hasMore
        ) {
          isIntersectingRef.current = true
          fetchNextPage()

          setTimeout(() => {
            isIntersectingRef.current = false
          }, 1000)
        }
      },
      { rootMargin: "200px" },
    )
    intersectionObserver.observe(element)
    return () => intersectionObserver.unobserve(element)
  }, [fetchNextPage, hasMore, isFetchingNextPage])

  const toggleFilters = useCallback(() => {
    setShowFilters((v) => !v)
  }, [])

  const clearFilters = useCallback(() => {
    setSortBy("popularity.desc")
    setYearFrom("")
    setYearTo("")
    setMinRating("")
    setGenre("")
    setSearchQuery("")
    refetchDiscover()
  }, [refetchDiscover])

  if (isLoading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-[#009A9C]"></div>
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen">
      {trendingMovie && (
        <section className="relative h-[60vh] overflow-hidden sm:h-[70vh] lg:h-[80vh]">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${trendingMovie.backdrop_path ? `${tmdbBaseImageUrl}original${trendingMovie.backdrop_path}` : ""})`,
            }}
          >
            <div className="from-background/90 via-background/50 absolute inset-0 bg-gradient-to-r to-transparent" />
            <div className="from-background absolute inset-0 bg-gradient-to-t via-transparent to-transparent" />
          </div>

          <div className="relative z-10 flex h-full items-center">
            <div className="container mx-auto px-4 sm:px-6">
              <div className="max-w-2xl space-y-4 sm:space-y-6">
                <div className="space-y-3 sm:space-y-4">
                  <h2 className="text-foreground text-3xl leading-tight font-bold sm:text-4xl lg:text-5xl">
                    Discover movies you will love in seconds
                  </h2>
                </div>

                <div className="space-y-3 pt-4 sm:space-y-4 sm:pt-8">
                  <h3 className="text-foreground text-2xl font-bold sm:text-3xl lg:text-4xl">
                    {trendingMovie.title}
                  </h3>

                  <div className="text-muted-foreground flex items-center gap-3 text-sm sm:gap-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {trendingMovie.release_date
                          ? new Date(trendingMovie.release_date).getFullYear()
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="secondary"
                        className="border-[#009A9C]/30 bg-[#009A9C]/20 text-[#009A9C]"
                      >
                        Trending Now
                      </Badge>
                      <div className="text-muted-foreground flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>
                          {trendingMovie.vote_average
                            ? trendingMovie.vote_average.toFixed(1)
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-foreground/80 max-w-xl text-sm leading-relaxed sm:text-base">
                    {trendingMovie.overview}
                  </p>

                  {trendingMovieTrailer && trendingMovieTrailer.key && (
                    <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                      <Link
                        target="_blank"
                        href={`https://www.youtube.com/watch?v=${trendingMovieTrailer.key}`}
                      >
                        <Button
                          size="lg"
                          variant="outline"
                          className="w-full border-[#CCCCCC]/50 bg-[#009A9C] text-white backdrop-blur-sm hover:bg-[#009A9C]/70 sm:w-auto"
                        >
                          Watch Trailer
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="px-4 py-12 sm:px-6 sm:py-16">
        <SearchArea
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          loadDiscover={() => refetchDiscover()}
          toggleFilters={toggleFilters}
        />

        {hasActiveFilters && (
          <div className="container mx-auto mt-12">
            <div className="mb-6 flex items-center justify-end">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="border-[#CCCCCC]/50 hover:border-[#009A9C]/50"
              >
                Clear All Filters
              </Button>
            </div>

            {isDiscoverLoading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#009A9C] border-t-transparent" />
              </div>
            ) : discoverMovies.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                  {discoverMovies.map((movie) => (
                    <Link key={movie.id} href={`/movies/${movie.id}`}>
                      <Card className="group cursor-pointer overflow-hidden border-[#CCCCCC]/50 py-0 transition-all duration-300 hover:scale-105 hover:border-[#009A9C]/50">
                        <CardContent className="p-0">
                          <div className="relative">
                            <div className="aspect-[2/3] overflow-hidden">
                              <Image
                                width={500}
                                height={750}
                                src={
                                  movie.poster_path
                                    ? `${tmdbBaseImageUrl}w500${movie.poster_path}`
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

                <div ref={sentinelRef} className="h-10 w-full" />

                {isFetchingNextPage && (
                  <div className="flex justify-center py-6">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#009A9C] border-t-transparent" />
                  </div>
                )}
              </>
            ) : (
              <div className="mx-auto max-w-2xl p-8 text-center">
                <div className="mb-4 text-6xl">🎬</div>
                <h3 className="text-foreground mb-2 text-xl font-semibold">
                  No movies found
                </h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search terms or filters to find more
                  movies.
                </p>
              </div>
            )}
          </div>
        )}

        {discoverError && (
          <div className="container mx-auto mt-4">
            <div className="mx-auto max-w-2xl p-4 text-center">
              <p className="text-red-800">
                Failed to load movies. Please refresh the page.
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="container mx-auto">
          <div className="mb-8 text-center">
            <h2 className="text-foreground mb-4 text-3xl font-bold">
              Explore Movies
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl">
              Discover trending, popular, and top-rated movies from around the
              world
            </p>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as MovieTab)}
            className="w-full"
          >
            <TabsList className="mx-auto grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="trending" className="text-sm font-medium">
                Trending
              </TabsTrigger>
              <TabsTrigger value="popular" className="text-sm font-medium">
                Popular
              </TabsTrigger>
              <TabsTrigger value="top_rated" className="text-sm font-medium">
                Top Rated
              </TabsTrigger>
            </TabsList>

            <TabsContent value="trending" className="mt-8">
              <MovieGrid
                movies={activeTab === "trending" ? tabMovies : []}
                isLoading={isLoadingTab}
                error={null}
                hasMore={activeTab === "trending" ? tabHasMore : false}
                isFetchingNextPage={
                  activeTab === "trending" ? isTabFetchingNextPage : false
                }
                onLoadMore={
                  activeTab === "trending" ? fetchNextTabPage : undefined
                }
                showPagination={activeTab === "trending"}
              />
            </TabsContent>

            <TabsContent value="popular" className="mt-8">
              <MovieGrid
                movies={activeTab === "popular" ? tabMovies : []}
                isLoading={isLoadingTab}
                error={null}
                hasMore={activeTab === "popular" ? tabHasMore : false}
                isFetchingNextPage={
                  activeTab === "popular" ? isTabFetchingNextPage : false
                }
                onLoadMore={
                  activeTab === "popular" ? fetchNextTabPage : undefined
                }
                showPagination={activeTab === "popular"}
              />
            </TabsContent>

            <TabsContent value="top_rated" className="mt-8">
              <MovieGrid
                movies={activeTab === "top_rated" ? tabMovies : []}
                isLoading={isLoadingTab}
                error={null}
                hasMore={activeTab === "top_rated" ? tabHasMore : false}
                isFetchingNextPage={
                  activeTab === "top_rated" ? isTabFetchingNextPage : false
                }
                onLoadMore={
                  activeTab === "top_rated" ? fetchNextTabPage : undefined
                }
                showPagination={activeTab === "top_rated"}
              />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {showFilters && (
        <FiltersDialog
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          sortBy={sortBy}
          setSortBy={setSortBy}
          yearFrom={yearFrom}
          setYearFrom={setYearFrom}
          yearTo={yearTo}
          setYearTo={setYearTo}
          minRating={minRating}
          setMinRating={setMinRating}
          genre={genre}
          setGenre={setGenre}
          genres={genres}
          refetchDiscover={refetchDiscover}
          isDiscoverLoading={isDiscoverLoading}
          clearFilters={clearFilters}
        />
      )}
    </div>
  )
}
