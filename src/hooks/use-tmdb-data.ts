"use client"

import {
  keepPreviousData,
  QueryKey,
  useInfiniteQuery,
  useQueries,
  useQuery,
} from "@tanstack/react-query"
import { useMemo } from "react"

import { routes } from "@/lib/constants"
import type {
  ApiResponse,
  Genre,
  Movie,
  MovieTab,
  Region,
  SpokenLanguage,
  Trailer,
  TrailerResponse,
} from "@/lib/types"
import { TMDB_TAGS } from "@/services/tmdb.service"

const qFetch =
  <T>(url: string) =>
  async ({ signal }: { signal?: AbortSignal }): Promise<T> => {
    const res = await fetch(url, { signal, credentials: "same-origin" })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || `Failed to fetch ${url}`)
    }
    return (await res.json()) as T
  }

const getTrendingMovies = qFetch<ApiResponse>(routes.api.movies.trending)

const getPopularMovies = qFetch<ApiResponse>(routes.api.movies.popular)

const getTopRatedMovies = qFetch<ApiResponse>(routes.api.movies.topRated)

const getGenres = qFetch<{ genres: Genre[] }>(routes.api.genres)

export function useLandingPageData() {
  const results = useQueries({
    queries: [
      {
        queryKey: ["tmdb", "landing", TMDB_TAGS.trending],
        queryFn: getTrendingMovies,
        placeholderData: keepPreviousData,
        select: (r: ApiResponse) => r.results?.slice(0, 12) ?? [],
        retry: 2,
      },
      {
        queryKey: ["tmdb", "landing", TMDB_TAGS.popular],
        queryFn: getPopularMovies,
        placeholderData: keepPreviousData,
        select: (r: ApiResponse) => r.results?.slice(0, 12) ?? [],
        retry: 2,
      },
      {
        queryKey: ["tmdb", "landing", TMDB_TAGS.top_rated],
        queryFn: getTopRatedMovies,
        placeholderData: keepPreviousData,
        select: (r: ApiResponse) => r.results?.slice(0, 12) ?? [],
        retry: 2,
      },
      {
        queryKey: ["tmdb", "landing", TMDB_TAGS.genres],
        queryFn: getGenres,
        staleTime: 86_400_000,
        select: (r: { genres: Genre[] }) => r.genres,
        retry: 2,
      },
    ],
  })

  const [trendingMovies, popularMovies, topRatedMovies, genres] = results
  const trendingMovie = (trendingMovies.data ?? [])[0] as Movie | undefined

  const movieTrailerQuery = useMovieTrailer(trendingMovie?.id)

  const isLoading =
    results.some((q) => q.isLoading) ||
    (movieTrailerQuery.isEnabled && movieTrailerQuery.isLoading)

  return {
    trending: trendingMovies.data ?? [],
    popular: popularMovies.data ?? [],
    topRated: topRatedMovies.data ?? [],
    genres: genres.data ?? [],
    trendingMovie: trendingMovie ?? null,
    trendingMovieTrailer: (movieTrailerQuery.data ?? null) as Trailer | null,
    isLoading,
    errors: results.map((query) => query.error).filter(Boolean),
  }
}

export function useMovieTabs(active: MovieTab) {
  const trendingQuery = useInfiniteQuery({
    enabled: active === "trending",
    queryKey: ["tmdb", "tabs", "trending", "infinite"],
    queryFn: async ({ pageParam = 1, signal }) => {
      const url = new URL(routes.api.movies.trending, window.location.origin)
      url.searchParams.set("page", pageParam.toString())
      const res = await fetch(url.toString(), { signal })
      if (!res.ok) throw new Error("Failed to fetch trending movies")
      return (await res.json()) as ApiResponse
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const next = (lastPage?.page ?? 1) + 1
      const max = Math.min(lastPage?.total_pages ?? 30, 30)
      return next <= max ? next : undefined
    },
    retry: 2,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  const popularQuery = useInfiniteQuery({
    enabled: active === "popular",
    queryKey: ["tmdb", "tabs", "popular", "infinite"],
    queryFn: async ({ pageParam = 1, signal }) => {
      const url = new URL(routes.api.movies.popular, window.location.origin)
      url.searchParams.set("page", pageParam.toString())
      const res = await fetch(url.toString(), { signal })
      if (!res.ok) throw new Error("Failed to fetch popular movies")
      return (await res.json()) as ApiResponse
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const next = (lastPage?.page ?? 1) + 1
      const max = Math.min(lastPage?.total_pages ?? 30, 30)
      return next <= max ? next : undefined
    },
    retry: 2,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  const topRatedQuery = useInfiniteQuery({
    enabled: active === "top_rated",
    queryKey: ["tmdb", "tabs", "top_rated", "infinite"],
    queryFn: async ({ pageParam = 1, signal }) => {
      const url = new URL(routes.api.movies.topRated, window.location.origin)
      url.searchParams.set("page", pageParam.toString())
      const res = await fetch(url.toString(), { signal })
      if (!res.ok) throw new Error("Failed to fetch top rated movies")
      return (await res.json()) as ApiResponse
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const next = (lastPage?.page ?? 1) + 1
      const max = Math.min(lastPage?.total_pages ?? 30, 30)
      return next <= max ? next : undefined
    },
    retry: 2,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  const getActiveQuery = () => {
    if (active === "trending") return trendingQuery
    if (active === "popular") return popularQuery
    if (active === "top_rated") return topRatedQuery
    return null
  }

  const activeQuery = getActiveQuery()

  const flat = useMemo(() => {
    if (!activeQuery?.data?.pages) return []

    const allMovies = activeQuery.data.pages.flatMap(
      (p) => (p?.results ?? []) as Movie[],
    )
    const seenMovies = new Set<number>()
    const uniqueMovies = allMovies.filter((movie) => {
      if (seenMovies.has(movie.id)) {
        return false
      }
      seenMovies.add(movie.id)
      return true
    })

    return uniqueMovies
  }, [activeQuery?.data?.pages, active])

  return {
    movies: (flat || []) as Movie[],
    isLoading: activeQuery?.isLoading ?? false,
    isFetchingNextPage: activeQuery?.isFetchingNextPage ?? false,
    hasMore: activeQuery?.hasNextPage ?? false,
    fetchNextPage: activeQuery?.fetchNextPage ?? (() => {}),
  }
}

export type MovieDiscoveryParams = {
  sort_by: string
  "primary_release_date.gte"?: string
  "primary_release_date.lte"?: string
  "vote_average.gte"?: string
  with_genres?: string
}

export function useMovieDiscoveryInfinite(opts: {
  search: string
  discoverParams: MovieDiscoveryParams
}) {
  const { search, discoverParams } = opts

  const hasActiveFilters = useMemo(() => {
    const hasSearch = search.trim().length > 0
    const hasFilters = Object.values(discoverParams).some(
      (value) => value && value !== "popularity.desc",
    )
    return hasSearch || hasFilters
  }, [search, discoverParams])

  const queryKey: QueryKey = useMemo(
    () => ["tmdb", "discover", { search, discoverParams }],
    [search, discoverParams],
  )

  const queryFn = async ({
    pageParam = 1,
    signal,
  }: {
    pageParam?: number
    signal?: AbortSignal
  }): Promise<ApiResponse> => {
    if (search.trim()) {
      const url = new URL(routes.api.movies.search, window.location.origin)
      url.searchParams.set("query", search.trim())
      url.searchParams.set("page", pageParam.toString())
      const res = await fetch(url.toString(), { signal })
      if (!res.ok) throw new Error("Failed to search movies")
      return (await res.json()) as ApiResponse
    }
    const url = new URL(routes.api.movies.discover, window.location.origin)
    url.searchParams.set("page", pageParam.toString())
    Object.entries(discoverParams).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value.toString())
      }
    })
    const res = await fetch(url.toString(), { signal })
    if (!res.ok) throw new Error("Failed to apply filters")
    return (await res.json()) as ApiResponse
  }

  const infiniteQuery = useInfiniteQuery({
    queryKey,
    queryFn,
    initialPageParam: 1,
    enabled: hasActiveFilters,
    getNextPageParam: (lastPage) => {
      const next = (lastPage?.page ?? 1) + 1
      const max = Math.min(lastPage?.total_pages ?? 30, 30)
      return next <= max ? next : undefined
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  const flat = useMemo(() => {
    try {
      if (!infiniteQuery.data?.pages) return []

      const allMovies = infiniteQuery.data.pages.flatMap(
        (p) => (p?.results ?? []) as Movie[],
      )
      const seenMovies = new Set<number>()
      const uniqueMovies = allMovies.filter((movie) => {
        if (seenMovies.has(movie.id)) {
          return false
        }
        seenMovies.add(movie.id)
        return true
      })

      return uniqueMovies
    } catch {
      return []
    }
  }, [infiniteQuery.data?.pages])

  return {
    ...infiniteQuery,
    movies: (flat || []) as Movie[],
    hasMore: infiniteQuery.hasNextPage,
    hasActiveFilters,
    error: infiniteQuery.error || null,
  }
}

export function useMovieDetails(movieId: string) {
  const movieQuery = useQuery({
    queryKey: ["tmdb", "movie", movieId],
    queryFn: async ({ signal }) => {
      if (!movieId) throw new Error("Movie ID is required")

      const res = await fetch(routes.api.movies.details(movieId), { signal })
      if (!res.ok) {
        throw new Error(`Failed to fetch movie details: ${res.status}`)
      }

      return res.json() as Promise<Movie>
    },
    enabled: !!movieId,
    retry: 2,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  const trailerQuery = useMovieTrailer(movieId)

  return {
    movie: movieQuery.data,
    trailer: trailerQuery.data,
    isLoading: movieQuery.isLoading,
    isError: movieQuery.isError,
    error: movieQuery.error,
    refetch: () => {
      movieQuery.refetch()
      trailerQuery.refetch()
    },
  }
}

export function useMovieTrailer(movieId: string | number | undefined) {
  return useQuery({
    enabled: !!movieId,
    queryKey: ["tmdb", TMDB_TAGS.trailer(Number(movieId) || 0)],
    queryFn: async ({ signal }) => {
      if (!movieId) return null
      const res = await fetch(routes.api.movies.videos(movieId!), { signal })

      if (!res.ok) {
        throw new Error(`Failed to fetch movie trailer: ${res.status}`)
      }

      let videos: TrailerResponse | null = null
      try {
        videos = await res.json()
      } catch {
        return null
      }

      if (!videos?.results || !Array.isArray(videos.results)) {
        return null
      }

      const trailer = videos.results.find(
        (v: Trailer) =>
          v.official && v.type === "Trailer" && v.site === "YouTube",
      )

      return trailer || null
    },
    retry: 2,
  })
}

export function useLanguagesInfinite() {
  return useInfiniteQuery({
    queryKey: ["tmdb", "languages", "infinite"],
    queryFn: async ({ pageParam = 1, signal }) => {
      const url = new URL(routes.api.languages, window.location.origin)
      url.searchParams.set("page", pageParam.toString())
      url.searchParams.set("limit", "50")
      const res = await fetch(url.toString(), { signal })
      if (!res.ok) throw new Error("Failed to fetch languages")
      return (await res.json()) as {
        results: SpokenLanguage[]
        page: number
        total_pages: number
        total_results: number
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const next = (lastPage?.page ?? 1) + 1
      const max = lastPage?.total_pages ?? 1
      return next <= max ? next : undefined
    },
    retry: 2,
    staleTime: 86_400_000,
    gcTime: 86_400_000,
  })
}

export function useRegionsInfinite() {
  return useInfiniteQuery({
    queryKey: ["tmdb", "regions", "infinite"],
    queryFn: async ({ pageParam = 1, signal }) => {
      const url = new URL(routes.api.regions, window.location.origin)
      url.searchParams.set("page", pageParam.toString())
      url.searchParams.set("limit", "50")
      const res = await fetch(url.toString(), { signal })
      if (!res.ok) throw new Error("Failed to fetch regions")
      return (await res.json()) as {
        results: Region[]
        page: number
        total_pages: number
        total_results: number
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const next = (lastPage?.page ?? 1) + 1
      const max = lastPage?.total_pages ?? 1
      return next <= max ? next : undefined
    },
    retry: 2,
    staleTime: 86_400_000,
    gcTime: 86_400_000,
  })
}
