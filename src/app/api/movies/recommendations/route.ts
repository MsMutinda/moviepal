import { eq, inArray } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/database/database"
import {
  dismissedMovies,
  likes,
  listItems,
  lists,
  movies,
  ratings,
} from "@/lib/database/schema/public"
import { Keyword, Movie, MovieMetadata } from "@/lib/types"
import { tmdbService } from "@/services/tmdb.service"

interface RecommendationScore {
  movieId: string
  tmdbId: number
  score: number
  reason: string
}

interface UserProfile {
  likedGenres: Map<number, number>
  likedKeywords: Map<string, number>
  averageRating: number
  totalRatings: number
  preferredYears: number[]
  likedMovies: Set<string>
  ratedMovies: Map<string, number>
  dismissedMovies: Set<string>
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50)
    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1)
    const forceRefresh = searchParams.get("refresh") === "true"

    const userId = session.user.id

    // Add cache headers for dynamic updates
    const response = new NextResponse()

    if (!forceRefresh) {
      response.headers.set(
        "Cache-Control",
        "private, max-age=300, stale-while-revalidate=600",
      )
    } else {
      response.headers.set(
        "Cache-Control",
        "no-cache, no-store, must-revalidate",
      )
    }

    const userProfile = await buildUserProfile(userId)

    if (
      userProfile.likedMovies.size === 0 &&
      userProfile.ratedMovies.size === 0
    ) {
      const popularMovies = await tmdbService.getPopularMovies({
        query: { page: page.toString() },
        revalidate: forceRefresh ? 0 : 3600,
      })

      const result = {
        results: popularMovies.results.slice(0, limit),
        page,
        total_pages: popularMovies.total_pages,
        total_results: popularMovies.total_results,
        reason: "Popular movies for new users",
        generatedAt: new Date().toISOString(),
        userActivity: {
          likedMovies: 0,
          ratedMovies: 0,
          totalLists: 0,
        },
      }

      return NextResponse.json(result, { headers: response.headers })
    }

    const recommendations = await generateRecommendations(
      userProfile,
      limit,
      page,
      userId,
    )

    const movieDetails = await Promise.allSettled(
      recommendations.map((rec) =>
        tmdbService.getMovieDetails(rec.tmdbId, false, false, false, {
          revalidate: forceRefresh ? 0 : 3600,
        }),
      ),
    )

    const validMovies = movieDetails
      .filter((result) => result.status === "fulfilled")
      .map((result, index) => ({
        ...(result as PromiseFulfilledResult<Movie>).value,
        recommendationScore: recommendations[index].score,
        recommendationReason: recommendations[index].reason,
      }))

    const result = {
      results: validMovies,
      page,
      total_pages: Math.ceil(validMovies.length / limit),
      total_results: validMovies.length,
      reason: "Personalized recommendations",
      generatedAt: new Date().toISOString(),
      userActivity: {
        likedMovies: userProfile.likedMovies.size,
        ratedMovies: userProfile.ratedMovies.size,
        totalLists: userProfile.likedGenres.size,
      },
      recommendationStats: {
        totalStrategies: 4,
        genreBased: recommendations.filter((r) => r.reason.includes("favorite"))
          .length,
        ratingBased: recommendations.filter((r) => r.reason.includes("rated"))
          .length,
        popularityBased: recommendations.filter((r) =>
          r.reason.includes("Popular"),
        ).length,
        recencyBased: recommendations.filter((r) => r.reason.includes("Recent"))
          .length,
      },
    }

    return NextResponse.json(result, { headers: response.headers })
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    )
  }
}

async function buildUserProfile(userId: string): Promise<UserProfile> {
  const likedMoviesData = await db
    .select({
      movieId: likes.movieId,
      tmdbId: movies.tmdbId,
      metadata: movies.metadata,
    })
    .from(likes)
    .innerJoin(movies, eq(likes.movieId, movies.id))
    .where(eq(likes.userId, userId))

  const ratedMoviesData = await db
    .select({
      movieId: ratings.movieId,
      score: ratings.score,
      tmdbId: movies.tmdbId,
      metadata: movies.metadata,
    })
    .from(ratings)
    .innerJoin(movies, eq(ratings.movieId, movies.id))
    .where(eq(ratings.userId, userId))

  const listMoviesData = await db
    .select({
      movieId: listItems.movieId,
      tmdbId: movies.tmdbId,
      metadata: movies.metadata,
    })
    .from(listItems)
    .innerJoin(movies, eq(listItems.movieId, movies.id))
    .innerJoin(lists, eq(listItems.listId, lists.id))
    .where(eq(lists.userId, userId))

  const dismissedMoviesData = await db
    .select({
      movieId: dismissedMovies.movieId,
    })
    .from(dismissedMovies)
    .where(eq(dismissedMovies.userId, userId))

  const allUserMovies = [
    ...likedMoviesData,
    ...ratedMoviesData,
    ...listMoviesData,
  ]

  const uniqueMovies = new Map()
  allUserMovies.forEach((movie) => {
    if (!uniqueMovies.has(movie.movieId)) {
      uniqueMovies.set(movie.movieId, movie)
    }
  })

  const userMovies = Array.from(uniqueMovies.values())

  const likedGenres = new Map<number, number>()
  const likedKeywords = new Map<string, number>()
  const preferredYears: number[] = []
  const likedMovies = new Set<string>()
  const ratedMovies = new Map<string, number>()
  const userDismissedMovies = new Set<string>()

  likedMoviesData.forEach((movie) => {
    likedMovies.add(movie.movieId)
    if (
      movie.metadata &&
      typeof movie.metadata === "object" &&
      "release_date" in movie.metadata
    ) {
      const releaseDate = (movie.metadata as MovieMetadata).release_date
      if (releaseDate) {
        const year = new Date(releaseDate).getFullYear()
        if (year > 1900) preferredYears.push(year)
      }
    }
  })

  ratedMoviesData.forEach((movie) => {
    ratedMovies.set(movie.movieId, movie.score)
    if (
      movie.metadata &&
      typeof movie.metadata === "object" &&
      "release_date" in movie.metadata
    ) {
      const releaseDate = (movie.metadata as MovieMetadata).release_date
      if (releaseDate) {
        const year = new Date(releaseDate).getFullYear()
        if (year > 1900) preferredYears.push(year)
      }
    }
  })

  dismissedMoviesData.forEach((movie) => {
    userDismissedMovies.add(movie.movieId)
  })

  const movieDetails = await Promise.allSettled(
    userMovies.map((movie) => tmdbService.getMovieDetails(movie.tmdbId)),
  )

  movieDetails.forEach((result, _index) => {
    if (result.status === "fulfilled") {
      const movie = result.value as Movie

      movie.genre_ids?.forEach((genreId) => {
        likedGenres.set(genreId, (likedGenres.get(genreId) || 0) + 1)
      })
    }
  })

  // Extract keywords asynchronously (non-blocking)
  const keywordPromises = movieDetails.map((result, _index) => {
    if (result.status === "fulfilled") {
      const movie = result.value as Movie
      return tmdbService
        .getMovieDetails(movie.id, true)
        .then((keywordsResult) => {
          if (Array.isArray(keywordsResult)) {
            keywordsResult.forEach((keyword: Keyword) => {
              likedKeywords.set(
                keyword.name,
                (likedKeywords.get(keyword.name) || 0) + 1,
              )
            })
          }
        })
        .catch(() => {
          // Ignore keyword fetch errors
        })
    }
    return Promise.resolve()
  })

  await Promise.allSettled(keywordPromises)

  const ratingValues = Array.from(ratedMovies.values())
  const averageRating =
    ratingValues.length > 0
      ? ratingValues.reduce((sum, rating) => sum + rating, 0) /
        ratingValues.length
      : 7.0

  return {
    likedGenres,
    likedKeywords,
    averageRating,
    totalRatings: ratingValues.length,
    preferredYears: preferredYears.filter((year) => year > 1990),
    likedMovies,
    ratedMovies,
    dismissedMovies: userDismissedMovies,
  }
}

async function generateRecommendations(
  userProfile: UserProfile,
  limit: number,
  page: number,
  userId: string,
): Promise<RecommendationScore[]> {
  const recommendations = new Map<string, RecommendationScore>()

  // Strategy 1: Genre-based recommendations
  if (userProfile.likedGenres.size > 0) {
    const topGenres = Array.from(userProfile.likedGenres.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([genreId]) => genreId)

    for (const genreId of topGenres) {
      try {
        const genreMoviesResponse = await tmdbService.discoverMovies({
          query: {
            with_genres: genreId.toString(),
            sort_by: "popularity.desc",
            page: page.toString(),
          },
          revalidate: 3600,
        })

        const genreMovies = genreMoviesResponse.results as Movie[]
        genreMovies.forEach((movie: Movie) => {
          const score = calculateGenreScore(movie, userProfile, genreId)
          if (score > 0) {
            recommendations.set(movie.id.toString(), {
              movieId: movie.id.toString(), // This is tmdbId as string
              tmdbId: movie.id,
              score,
              reason: `Similar to your favorite ${getGenreName(genreId)} movies`,
            })
          }
        })
      } catch (error) {
        console.warn(`Failed to fetch genre ${genreId} movies:`, error)
      }
    }
  }

  // Strategy 2: Rating-based recommendations (movies similar to highly rated ones)
  if (userProfile.ratedMovies.size > 0) {
    const ratedMoviesData = await db
      .select({
        movieId: ratings.movieId,
        score: ratings.score,
        tmdbId: movies.tmdbId,
      })
      .from(ratings)
      .innerJoin(movies, eq(ratings.movieId, movies.id))
      .where(eq(ratings.userId, userId))

    const highRatedMovies = ratedMoviesData
      .filter((movie) => movie.score >= 7)
      .slice(0, 5)

    for (const movie of highRatedMovies) {
      try {
        const similarMoviesResponse = await tmdbService.request<{
          results: Movie[]
        }>(`/movie/${movie.tmdbId}/recommendations`, { revalidate: 3600 })

        const similarMovies = similarMoviesResponse.results as Movie[]
        similarMovies.forEach((similarMovie: Movie) => {
          const score = calculateSimilarityScore(
            similarMovie,
            userProfile,
            movie.score,
          )
          if (score > 0) {
            const existing = recommendations.get(similarMovie.id.toString())
            if (!existing || score > existing.score) {
              recommendations.set(similarMovie.id.toString(), {
                movieId: similarMovie.id.toString(),
                tmdbId: similarMovie.id,
                score,
                reason: `Similar to movies you rated ${movie.score}/10`,
              })
            }
          }
        })
      } catch (error) {
        console.warn(
          `Failed to fetch similar movies for ${movie.tmdbId}:`,
          error,
        )
      }
    }
  }

  // Strategy 3: Popular movies in user's preferred genres
  if (userProfile.likedGenres.size > 0) {
    try {
      const popularMoviesResponse = await tmdbService.getPopularMovies({
        query: { page: page.toString() },
        revalidate: 3600,
      })

      const popularMovies = popularMoviesResponse.results as Movie[]
      popularMovies.forEach((movie: Movie) => {
        const score = calculatePopularityScore(movie, userProfile)
        if (score > 0) {
          const existing = recommendations.get(movie.id.toString())
          if (!existing || score > existing.score) {
            recommendations.set(movie.id.toString(), {
              movieId: movie.id.toString(),
              tmdbId: movie.id,
              score,
              reason: "Popular in your favorite genres",
            })
          }
        }
      })
    } catch (error) {
      console.warn("Failed to fetch popular movies:", error)
    }
  }

  // Strategy 4: Recent movies in preferred genres
  if (
    userProfile.likedGenres.size > 0 &&
    userProfile.preferredYears.length > 0
  ) {
    const currentYear = new Date().getFullYear()
    const recentYears = [currentYear, currentYear - 1, currentYear - 2]

    for (const year of recentYears) {
      try {
        const recentMoviesResponse = await tmdbService.discoverMovies({
          query: {
            primary_release_year: year.toString(),
            sort_by: "popularity.desc",
            page: page.toString(),
          },
          revalidate: 3600,
        })

        const recentMovies = recentMoviesResponse.results as Movie[]
        recentMovies.forEach((movie: Movie) => {
          const score = calculateRecencyScore(movie, userProfile, year)
          if (score > 0) {
            const existing = recommendations.get(movie.id.toString())
            if (!existing || score > existing.score) {
              recommendations.set(movie.id.toString(), {
                movieId: movie.id.toString(),
                tmdbId: movie.id,
                score,
                reason: `Recent ${year} movie in your favorite genres`,
              })
            }
          }
        })
      } catch (error) {
        console.warn(`Failed to fetch ${year} movies:`, error)
      }
    }
  }

  // Strategy 5: Fallback - if no recommendations found, get popular movies
  if (recommendations.size === 0) {
    try {
      const popularMoviesResponse = await tmdbService.getPopularMovies({
        query: { page: page.toString() },
        revalidate: 3600,
      })

      const popularMovies = popularMoviesResponse.results as Movie[]
      popularMovies.slice(0, limit).forEach((movie: Movie) => {
        recommendations.set(movie.id.toString(), {
          movieId: movie.id.toString(),
          tmdbId: movie.id,
          score: movie.popularity / 100, // Use popularity as score
          reason: "Popular movies based on your activity",
        })
      })
    } catch (error) {
      console.warn("Failed to fetch fallback popular movies:", error)
    }
  }

  // Get internal database IDs for all recommended movies to properly filter dismissed movies
  const recommendedTmdbIds = Array.from(recommendations.values()).map(
    (rec) => rec.tmdbId,
  )
  const movieIdMappings =
    recommendedTmdbIds.length > 0
      ? await db
          .select({
            id: movies.id,
            tmdbId: movies.tmdbId,
          })
          .from(movies)
          .where(inArray(movies.tmdbId, recommendedTmdbIds))
      : []

  const tmdbToInternalId = new Map<number, string>()
  movieIdMappings.forEach((movie) => {
    tmdbToInternalId.set(movie.tmdbId, movie.id)
  })

  // Filter out movies user has already interacted with or dismissed
  const filteredRecommendations = Array.from(recommendations.values()).filter(
    (rec) => {
      const internalId = tmdbToInternalId.get(rec.tmdbId)
      if (!internalId) return true // If we can't find the internal ID, include it

      return (
        !userProfile.likedMovies.has(internalId) &&
        !userProfile.ratedMovies.has(internalId) &&
        !userProfile.dismissedMovies.has(internalId)
      )
    },
  )

  // Sort by score and return top recommendations
  return filteredRecommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

function calculateGenreScore(
  movie: Movie,
  userProfile: UserProfile,
  targetGenre: number,
): number {
  let score = 0

  // Base score for genre match
  if (movie.genre_ids?.includes(targetGenre)) {
    score += 10
  }

  // Bonus for multiple genre matches
  const matchingGenres =
    movie.genre_ids?.filter((id) => userProfile.likedGenres.has(id)).length || 0
  score += matchingGenres * 5

  // Popularity bonus
  score += Math.min(movie.popularity / 100, 5)

  // Rating bonus
  if (movie.vote_average > userProfile.averageRating) {
    score += 3
  }

  return score
}

function calculateSimilarityScore(
  movie: Movie,
  userProfile: UserProfile,
  referenceRating: number,
): number {
  let score = 0

  // Genre similarity
  const matchingGenres =
    movie.genre_ids?.filter((id) => userProfile.likedGenres.has(id)).length || 0
  score += matchingGenres * 8

  // Rating similarity
  const ratingDiff = Math.abs(movie.vote_average - referenceRating)
  score += Math.max(0, 10 - ratingDiff)

  // Popularity
  score += Math.min(movie.popularity / 100, 3)

  return score
}

function calculatePopularityScore(
  movie: Movie,
  userProfile: UserProfile,
): number {
  let score = 0

  // Genre match
  const matchingGenres =
    movie.genre_ids?.filter((id) => userProfile.likedGenres.has(id)).length || 0
  score += matchingGenres * 6

  // High popularity
  score += Math.min(movie.popularity / 50, 8)

  // Good rating
  if (movie.vote_average >= 7.0) {
    score += 5
  }

  return score
}

function calculateRecencyScore(
  movie: Movie,
  userProfile: UserProfile,
  year: number,
): number {
  let score = 0

  // Genre match
  const matchingGenres =
    movie.genre_ids?.filter((id) => userProfile.likedGenres.has(id)).length || 0
  score += matchingGenres * 7

  // Recency bonus
  const currentYear = new Date().getFullYear()
  const yearDiff = currentYear - year
  score += Math.max(0, 5 - yearDiff)

  // Popularity
  score += Math.min(movie.popularity / 100, 4)

  return score
}

function getGenreName(genreId: number): string {
  const genreMap: Record<number, string> = {
    28: "Action",
    12: "Adventure",
    16: "Animation",
    35: "Comedy",
    80: "Crime",
    99: "Documentary",
    18: "Drama",
    10751: "Family",
    14: "Fantasy",
    36: "History",
    27: "Horror",
    10402: "Music",
    9648: "Mystery",
    10749: "Romance",
    878: "Science Fiction",
    10770: "TV Movie",
    53: "Thriller",
    10752: "War",
    37: "Western",
  }
  return genreMap[genreId] || "movies"
}
