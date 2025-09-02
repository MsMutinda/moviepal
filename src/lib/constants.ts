export const appInfo = {
  name: "Moviebox",
  description:
    "Moviebox is a platform where users can browse, search, and get personalized movie recommendations.",
}

export const tmdbBaseUrl = "https://api.themoviedb.org/3"
export const tmdbBaseImageUrl = "https://image.tmdb.org/t/p/"
export const tmdbApiKey = process.env.TMDB_API_KEY

export const routes = {
  home: "/",
  api: {
    genres: "/api/genres",
    languages: "/api/languages",
    regions: "/api/regions",
    movies: {
      popular: "/api/movies/popular",
      trending: "/api/movies/trending",
      topRated: "/api/movies/top_rated",
      discover: "/api/movies/discover",
      search: "/api/movies/search",
      details: (id: string | number) => `/api/movies/${id}`,
      videos: (id: string | number) => `/api/movies/${id}/videos`,
    },
    account: {
      preferences: "/api/account/preferences",
    },
    lists: {
      builtin: "/api/lists/builtin",
      custom: "/api/lists",
      items: (identifier: string) => `/api/lists/${identifier}/items`,
      item: (identifier: string, movieId: string) =>
        `/api/lists/${identifier}/items/${movieId}`,
    },
    auth: {
      all: "/api/auth/[...all]",
    },
  },
  auth: {
    signup: "/auth/signup",
    signin: "/auth/signin",
  },
  account: {
    profile: "/account/profile",
    lists: "/account/lists",
    listBySlug: (slug: string) => `/account/lists/${slug}`,
  },
  movies: {
    details: (id: string | number) => `/movies/${id}`,
  },
}
