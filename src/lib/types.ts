export type Genre = {
  id: number
  name: string
}

export type Movie = {
  id: number
  title: string
  overview: string
  poster_path: string
  backdrop_path: string
  release_date: string
  runtime?: number
  vote_average: number
  genre_ids: number[]
  popularity: number
  keywords?: string[]
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

export type MovieTab = "trending" | "popular" | "top_rated"

export type ApiResponse = {
  page?: number
  results: Movie[]
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
