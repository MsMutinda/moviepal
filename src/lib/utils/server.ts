import { eq } from "drizzle-orm"

import { db } from "@/lib/database/database"
import { movies } from "@/lib/database/schema/public"
import { Movie } from "@/lib/types"
import { tmdbService } from "@/services/tmdb.service"

export async function getOrCreateMovie(tmdbId: number) {
  let movie = await db
    .select()
    .from(movies)
    .where(eq(movies.tmdbId, tmdbId))
    .limit(1)

  if (movie.length === 0) {
    const tmdbMovie = (await tmdbService.getMovieDetails(tmdbId)) as Movie
    if (!tmdbMovie) {
      throw new Error("Movie not found in TMDB")
    }

    const [newMovie] = await db
      .insert(movies)
      .values({
        tmdbId,
        title: tmdbMovie.title,
        year: tmdbMovie.release_date
          ? new Date(tmdbMovie.release_date).getFullYear()
          : null,
        metadata: {
          poster_path: tmdbMovie.poster_path,
          backdrop_path: tmdbMovie.backdrop_path,
          vote_average: tmdbMovie.vote_average,
          release_date: tmdbMovie.release_date,
        },
      })
      .onConflictDoNothing()
      .returning()

    if (newMovie) {
      movie = [newMovie]
    } else {
      const existingMovie = await db
        .select()
        .from(movies)
        .where(eq(movies.tmdbId, tmdbId))
        .limit(1)
      movie = existingMovie
    }
  }

  return movie[0]
}
