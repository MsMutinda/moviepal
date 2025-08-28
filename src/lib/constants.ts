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
      popular: "/api/popular",
      trending: "/api/trending",
      topRated: "/api/top_rated",
      discover: "/api/discover",
      search: "/api/search",
    },
  },
  auth: {
    signup: "/auth/signup",
    signin: "/auth/signin",
  },
}
