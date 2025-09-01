import { tmdbApiKey, tmdbBaseUrl } from "@/lib/constants"
import {
  ApiResponse,
  Credits,
  Genre,
  Keyword,
  Movie,
  Region,
  SpokenLanguage,
  TMDBRequestOpts,
  Trailer,
} from "@/lib/types"
import { buildQueryString } from "@/lib/utils/api"

export const TMDB_TAGS = {
  genres: "tmdb:genres",
  languages: "tmdb:languages",
  regions: "tmdb:regions",
  movie: (id: number | string) => `tmdb:movie:${id}`,
  trending: "tmdb:trending",
  popular: "tmdb:popular:movie",
  top_rated: "tmdb:top_rated:movie",
  search: (query: string) => `tmdb:search:${query}`,
  discover: (params: Record<string, string>) =>
    `tmdb:discover:${JSON.stringify(params)}`,
  keywords: (id: number) => `tmdb:keywords:${id}`,
  trailer: (id: number) => `tmdb:trailer:${id}`,
} as const

class TmdbService {
  async request<T>(
    path: string,
    opts: TMDBRequestOpts = {
      revalidate: 60,
      tags: [],
      signal: undefined,
      query: {},
      language: "en-US",
      retries: 0, // handled by react-query
    },
  ): Promise<T> {
    if (!tmdbApiKey) {
      throw new Error("TMDB API key is not defined.")
    }

    const url =
      `${tmdbBaseUrl}${path}?api_key=${tmdbApiKey}&language=${encodeURIComponent(opts.language ?? "en-US")}` +
      `${buildQueryString(opts.query as TMDBRequestOpts["query"])}`

    let attempt = 0
    const backoff = (n: number) =>
      new Promise((r) => setTimeout(r, 200 * 2 ** n))

    while (true) {
      const res = await fetch(url, {
        signal: opts.signal,
      })

      if (res.ok) {
        return (await res.json()) as T
      }

      if (
        (res.status === 429 || (res.status >= 500 && res.status < 600)) &&
        attempt < (opts.retries ?? 2)
      ) {
        await backoff(attempt++)
        continue
      }

      const body = await res.text()

      if (res.status === 401) {
        throw new Error(
          `TMDB Authentication failed. Please check your API key.`,
        )
      } else if (res.status === 404) {
        throw new Error(`TMDB endpoint not found: ${path}.`)
      } else if (res.status === 429) {
        throw new Error(`TMDB rate limit exceeded. Please try again later.`)
      }

      throw new Error(`TMDB ${res.status}: ${body}`)
    }
  }

  getGenres(opts: TMDBRequestOpts = {}): Promise<{ genres: Genre[] }> {
    return this.request<{ genres: { id: number; name: string }[] }>(
      "/genre/movie/list",
      { revalidate: 86_400, tags: [TMDB_TAGS.genres], ...opts },
    )
  }

  getTrendingMovies(opts: TMDBRequestOpts = {}): Promise<ApiResponse> {
    return this.request(`/trending/movie/day`, {
      revalidate: opts.revalidate,
      tags: [TMDB_TAGS.trending],
      query: { include_adult: false },
      ...opts,
    })
  }

  getPopularMovies(opts: TMDBRequestOpts = {}): Promise<ApiResponse> {
    return this.request("/movie/popular", {
      revalidate: opts.revalidate,
      tags: [TMDB_TAGS.popular],
      query: { include_adult: false },
      ...opts,
    })
  }

  getTopRatedMovies(opts: TMDBRequestOpts = {}): Promise<ApiResponse> {
    return this.request("/movie/top_rated", {
      revalidate: opts.revalidate,
      tags: [TMDB_TAGS.top_rated],
      query: { include_adult: false },
      ...opts,
    })
  }

  searchMovies(
    query: string,
    page = 1,
    opts: TMDBRequestOpts = {},
  ): Promise<ApiResponse> {
    return this.request("/search/movie", {
      tags: [TMDB_TAGS.search(query)],
      query: { query, include_adult: false, page },
      ...opts,
    })
  }

  discoverMovies(opts: TMDBRequestOpts = {}): Promise<ApiResponse> {
    return this.request("/discover/movie", {
      tags: [TMDB_TAGS.discover(opts.query as Record<string, string>)],
      query: { ...opts.query, include_adult: false },
      ...opts,
    })
  }

  getMovieDetails(
    id: number,
    getKeywords = false,
    getTrailer = false,
    getCredits = false,
    opts: TMDBRequestOpts = {},
  ): Promise<Movie | Keyword[] | Trailer | Credits> {
    if (getKeywords) {
      return this.request(`/movie/${id}/keywords`, {
        revalidate: opts.revalidate,
        tags: [TMDB_TAGS.movie(id), TMDB_TAGS.keywords(id)],
      })
    }

    if (getTrailer) {
      return this.request(`/movie/${id}/videos`, {
        revalidate: opts.revalidate,
        tags: [TMDB_TAGS.movie(id), TMDB_TAGS.trailer(id)],
      })
    }

    if (getCredits) {
      return this.request(`/movie/${id}/credits`, {
        revalidate: opts.revalidate,
        tags: [TMDB_TAGS.movie(id)],
      })
    }

    return this.request(`/movie/${id}`, {
      revalidate: opts.revalidate,
      tags: [TMDB_TAGS.movie(id)],
    })
  }

  getLanguages(
    page = 1,
    limit = 50,
    opts: TMDBRequestOpts = {},
  ): Promise<ApiResponse> {
    return this.request<SpokenLanguage[]>("/configuration/languages", {
      revalidate: 86_400,
      tags: [TMDB_TAGS.languages],
      ...opts,
    }).then((languages) => {
      const startIndex = (page - 1) * limit
      const results = languages
      const endIndex = startIndex + limit
      const paginatedLanguages = results.slice(startIndex, endIndex)
      const totalPages = Math.ceil(results.length / limit)

      return {
        results: paginatedLanguages,
        page,
        total_pages: totalPages,
        total_results: results.length,
      }
    })
  }

  getRegions(
    page = 1,
    limit = 50,
    opts: TMDBRequestOpts = {},
  ): Promise<ApiResponse> {
    return this.request<Region[]>("/configuration/countries", {
      revalidate: 86_400,
      tags: [TMDB_TAGS.regions],
      ...opts,
    }).then((regions) => {
      const startIndex = (page - 1) * limit
      const results = regions
      const endIndex = startIndex + limit
      const paginatedRegions = results.slice(startIndex, endIndex)
      const totalPages = Math.ceil(results.length / limit)

      return {
        results: paginatedRegions,
        page: page,
        total_pages: totalPages,
        total_results: results.length,
      }
    })
  }
}

export const tmdbService = new TmdbService()
