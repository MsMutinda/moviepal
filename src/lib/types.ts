export type Genre = {
  id: number
  name: string
}

export type Movie = {
  id: number
  title: string
  tagline?: string
  status?: string
  homepage?: string
  original_language?: string
  overview: string
  poster_path: string
  backdrop_path: string
  release_date: string
  runtime?: number
  vote_average: number
  vote_count: number
  genre_ids: number[]
  popularity: number
  keywords?: string[]
  genres?: Genre[]
  credits?: Credits
  production_companies?: ProductionCompany[]
  spoken_languages?: SpokenLanguage[]
}

export type Keyword = {
  id: number
  name: string
}

export type Trailer = {
  id: number
  key: string
  official: boolean
  name: string
  type: string
  site: string
}

export type TrailerResponse = {
  id: number
  results: Trailer[]
}

export type ProductionCompany = {
  id: number
  name: string
  logo_path: string | null
}

export type Credits = {
  cast: CastMember[]
  crew: CrewMember[]
}

export type CastMember = {
  id: number
  name: string
  character: string
  profile_path: string | null
}

export type CrewMember = {
  id: number
  name: string
  job: string
  profile_path: string | null
}

export type SpokenLanguage = {
  english_name: string
  iso_639_1: string
  name: string
}

export type MovieTab = "trending" | "popular" | "top_rated"

export type ApiResponse = {
  page?: number
  results: Movie[] | Region[] | SpokenLanguage[]
  total_pages?: number
  total_results?: number
}

export type TMDBRequestOpts = {
  revalidate?: number // seconds
  tags?: string[]
  signal?: AbortSignal
  query?: Record<string, string | number | boolean | undefined>
  language?: string // defaults to en-US
  retries?: number
}

export type Region = {
  iso_3166_1: string
  english_name: string
  native_name: string
}

export type UserPreferences = {
  language: string // ISO-639-1 like 'en', 'pt-BR'
  region?: string // ISO-3166-1 alpha-2 like 'US', 'GB'
  genres?: number[]
}

export type List = {
  id: string
  title: string
  slug: string
  isBuiltin: boolean
  builtinType: string
}

export type LocalMovie = {
  id: string
  tmdbId: number
  title: string
  year: number | null
  metadata: MovieMetadata
  createdAt: Date | null
  updatedAt: Date | null
}

export type MovieMetadata = {
  poster_path: string
  backdrop_path: string
  release_date: string
  vote_average: number
}

export type ListItem = {
  id: string
  movieId: string
  addedAt: string
  movie: LocalMovie
}

export type ListItemsResponse = {
  items: ListItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export type LikeResponse = {
  liked: boolean
}

export type RatingResponse = {
  rating: number | null
}

export type Rating = {
  userId: string
  movieId: string
  score: number
  createdAt: string
  updatedAt: string
}
