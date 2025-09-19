"use client"

import {
  ArrowLeft,
  Bookmark,
  Calendar,
  Clock,
  Globe,
  Play,
  Star,
  Users,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

import { AddListItemDialog } from "@/components/add-to-list-dialog"
import { MovieStatusOverlay } from "@/components/movie-status-overlay"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useListItemsMutations } from "@/hooks/use-list-items"
import { useMovieBatchStatus } from "@/hooks/use-movie-batch-status"
import { useMovieDetails } from "@/hooks/use-tmdb-data"
import { tmdbBaseImageUrl } from "@/lib/constants"
import {
  CastMember,
  Genre,
  ProductionCompany,
  SpokenLanguage,
} from "@/lib/types"
import { formatRuntime, getDirector } from "@/lib/utils/api"

export default function MovieDetailPage() {
  const params = useParams()
  const router = useRouter()
  const movieId = params.id as string

  const { movie, trailer, isLoading, isError, error } = useMovieDetails(movieId)
  const { isAddingListItem } = useListItemsMutations()
  const director = movie?.credits ? getDirector(movie.credits) : null

  const { getMovieStatus, updateMovieStatus } = useMovieBatchStatus([movieId])

  const showLoader = isLoading || (!movie && !isError)

  return (
    <div className="bg-background min-h-screen">
      <div className="relative z-20 px-6 pt-20">
        <Button
          onClick={() => router.back()}
          variant="ghost"
          size="sm"
          className="bg-background/80 hover:bg-background/90 backdrop-blur-sm"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      {showLoader ? (
        <div className="bg-background flex min-h-screen items-center justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-[#009A9C]"></div>
        </div>
      ) : isError ? (
        <div className="bg-background flex min-h-screen items-center justify-center">
          <div className="space-y-4 text-center">
            <h1 className="text-foreground text-2xl font-bold">
              Error Loading Movie
            </h1>
            <p className="text-muted-foreground">
              {error?.message ||
                "Failed to load movie details. Please try again."}
            </p>
          </div>
        </div>
      ) : movie ? (
        <>
          <section className="relative overflow-visible">
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: movie.backdrop_path
                  ? `url(${tmdbBaseImageUrl}w1280${movie.backdrop_path})`
                  : "none",
              }}
            >
              {!movie.backdrop_path && (
                <div className="from-primary/20 to-secondary/20 absolute inset-0 bg-gradient-to-br" />
              )}
              <div className="from-background/95 via-background/70 to-background/30 absolute inset-0 bg-gradient-to-r" />
              <div className="from-background absolute inset-0 bg-gradient-to-t via-transparent to-transparent" />
            </div>

            <div className="relative z-10 py-16">
              <div className="container mx-auto px-6">
                <div className="flex flex-col items-start gap-8 lg:flex-row">
                  <div className="flex-shrink-0">
                    {movie.poster_path ? (
                      <Image
                        width={500}
                        height={750}
                        src={`${tmdbBaseImageUrl}w500${movie.poster_path}`}
                        alt={movie.title || "Movie poster"}
                        className="w-64 rounded-lg object-cover shadow-2xl"
                      />
                    ) : (
                      <div
                        className="bg-muted flex w-64 items-center justify-center rounded-lg shadow-2xl"
                        style={{ aspectRatio: "2/3" }}
                      >
                        <span className="text-muted-foreground text-center">
                          No poster available
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="max-w-2xl flex-1 space-y-6">
                    <div className="space-y-2">
                      {movie.tagline ? (
                        <p className="text-primary font-medium italic">
                          {movie.tagline}
                        </p>
                      ) : (
                        <p className="text-muted-foreground italic">
                          No tagline available
                        </p>
                      )}
                      <h1 className="text-foreground text-4xl leading-tight font-bold md:text-5xl">
                        {movie.title || "Untitled Movie"}
                      </h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">
                          {movie.vote_average
                            ? movie.vote_average.toFixed(1)
                            : "N/A"}
                        </span>
                      </div>
                      <div className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {movie.release_date
                            ? new Date(movie.release_date).getFullYear()
                            : "N/A"}
                        </span>
                      </div>
                      <div className="text-muted-foreground flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          {movie.runtime ? formatRuntime(movie.runtime) : "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {movie.genres && movie.genres.length > 0 ? (
                        movie.genres.map((genre: Genre) => (
                          <Badge
                            key={genre.id}
                            variant="secondary"
                            className="bg-primary/20 text-primary border-primary/30"
                          >
                            {genre.name || "Unknown"}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground">
                          No genres available
                        </span>
                      )}
                    </div>

                    <p className="text-foreground/90 text-lg leading-relaxed">
                      {movie.overview || "No overview available."}
                    </p>

                    {director ? (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">
                          Directed by:
                        </span>
                        <span className="text-foreground font-semibold">
                          {director.name}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">
                          Directed by:
                        </span>
                        <span className="text-foreground font-medium">N/A</span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3 pt-4">
                      {trailer && trailer.key && (
                        <Link
                          href={`https://www.youtube.com/watch?v=${trailer.key}`}
                          target="_blank"
                        >
                          <Button
                            size="lg"
                            variant="outline"
                            className="w-full border-[#CCCCCC]/50 bg-[#009A9C] text-white backdrop-blur-sm hover:bg-[#009A9C]/70 sm:w-auto"
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Watch Trailer
                          </Button>
                        </Link>
                      )}

                      <AddListItemDialog
                        movieId={movieId}
                        movieTitle={movie.title || "Untitled Movie"}
                      >
                        <Button
                          size="lg"
                          variant="outline"
                          className="bg-background/80 text-foreground hover:bg-background/90 border-[#CCCCCC]/50 backdrop-blur-sm sm:w-auto"
                          disabled={isAddingListItem}
                        >
                          {isAddingListItem ? (
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-current"></div>
                          ) : (
                            <Bookmark className="mr-2 h-4 w-4" />
                          )}
                          {isAddingListItem ? "Adding..." : "Add to List"}
                        </Button>
                      </AddListItemDialog>

                      <MovieStatusOverlay
                        movieId={movieId}
                        {...getMovieStatus(movieId)}
                        onStatusUpdate={(updates) =>
                          updateMovieStatus(movieId, updates)
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="px-6 pt-16 pb-8">
            <div className="mx-3 space-y-12">
              {movie?.credits?.cast && movie.credits.cast.length > 0 ? (
                <div className="space-y-6">
                  <h2 className="text-foreground flex items-center gap-2 text-2xl font-bold">
                    <Users className="h-6 w-6" />
                    Cast
                  </h2>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
                    {movie.credits.cast
                      ?.slice(0, 12)
                      .map((actor: CastMember) => (
                        <Card
                          key={actor.id}
                          className="border-border/50 overflow-hidden py-0"
                        >
                          <CardContent className="p-0">
                            <div className="aspect-[3/4] overflow-hidden">
                              {actor.profile_path ? (
                                <Image
                                  width={500}
                                  height={750}
                                  src={`${tmdbBaseImageUrl}w185${actor.profile_path}`}
                                  alt={actor.name || "Actor"}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="bg-muted flex h-full w-full items-center justify-center">
                                  <span className="text-muted-foreground text-center text-xs">
                                    No photo
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="space-y-1 p-3">
                              <h3 className="text-foreground line-clamp-1 text-sm font-semibold">
                                {actor.name || "Unknown"}
                              </h3>
                              <p className="text-muted-foreground line-clamp-2 text-xs">
                                {actor.character || "Unknown character"}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <h2 className="text-foreground flex items-center gap-2 text-2xl font-bold">
                    <Users className="h-6 w-6" />
                    Cast
                  </h2>
                  <p className="text-muted-foreground">
                    No cast information available.
                  </p>
                </div>
              )}

              <div className="grid gap-8 md:grid-cols-2">
                <Card className="border-border/50">
                  <CardContent className="space-y-4 p-4">
                    <h3 className="text-foreground text-xl font-bold">
                      Production Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <span className="text-foreground font-medium">
                          {movie.status || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Original Language:
                        </span>
                        <span className="text-foreground font-medium uppercase">
                          {movie.original_language || "N/A"}
                        </span>
                      </div>
                      {movie.homepage ? (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Homepage:
                          </span>
                          <Button variant="ghost" size="sm" asChild>
                            <a
                              href={movie.homepage}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Globe className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Homepage:
                          </span>
                          <span className="text-foreground font-medium">
                            N/A
                          </span>
                        </div>
                      )}
                      {movie.spoken_languages &&
                      movie.spoken_languages.length > 0 ? (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Spoken Languages:
                          </span>
                          <span className="text-foreground font-medium">
                            {movie.spoken_languages
                              .map((language: SpokenLanguage) => language.name)
                              .join(", ")}
                          </span>
                        </div>
                      ) : (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Spoken Languages:
                          </span>
                          <span className="text-foreground font-medium">
                            N/A
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {movie.production_companies &&
                movie.production_companies.length > 0 ? (
                  <Card className="border-border/50">
                    <CardContent className="space-y-4 p-4">
                      <h3 className="text-foreground text-xl font-bold">
                        Production Companies
                      </h3>
                      <div className="flex flex-wrap gap-2 space-y-3">
                        {movie.production_companies
                          ?.filter((company: ProductionCompany) => company.name)
                          .map((company: ProductionCompany) => (
                            <div
                              key={company.id}
                              className="flex items-center gap-3"
                            >
                              {company.logo_path ? (
                                <Image
                                  width={500}
                                  height={750}
                                  src={`${tmdbBaseImageUrl}w92${company.logo_path}`}
                                  alt={company.name || "Company logo"}
                                  className="h-8 w-8 object-contain"
                                />
                              ) : (
                                <div className="bg-muted flex h-8 w-8 items-center justify-center rounded">
                                  <span className="text-muted-foreground text-xs">
                                    N/A
                                  </span>
                                </div>
                              )}
                              <span className="text-foreground">
                                {company.name || "Unknown company"}
                              </span>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-border/50">
                    <CardContent className="space-y-4 p-6">
                      <h3 className="text-foreground text-xl font-bold">
                        Production Companies
                      </h3>
                      <p className="text-muted-foreground">
                        No production company information available.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}
