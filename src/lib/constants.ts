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
    movies: {
      popular: "/api/movies/popular",
      trending: "/api/movies/trending",
      topRated: "/api/movies/top_rated",
      discover: "/api/movies/discover",
      search: "/api/movies/search",
      details: (id: string | number) => `/api/movies/${id}`,
      videos: (id: string | number) => `/api/movies/${id}/videos`,
    },
  },
  auth: {
    signup: "/auth/signup",
    signin: "/auth/signin",
  },
  user: {
    profile: "/user/profile",
  },
}
