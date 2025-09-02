import { http, HttpResponse } from "msw"

// TMDB API mock handlers
export const tmdbHandlers = [
  // Get movie details
  http.get("https://api.themoviedb.org/3/movie/:id", ({ params }) => {
    const { id } = params
    return HttpResponse.json({
      id: Number(id),
      title: "Test Movie",
      overview: "A test movie for testing purposes",
      release_date: "2023-01-01",
      poster_path: "/test-poster.jpg",
      backdrop_path: "/test-backdrop.jpg",
      vote_average: 8.5,
      vote_count: 1000,
      adult: false,
      genre_ids: [28, 12],
      original_language: "en",
      original_title: "Test Movie",
      popularity: 100,
      video: false,
    })
  }),

  // Search movies
  http.get("https://api.themoviedb.org/3/search/movie", ({ request }) => {
    const url = new URL(request.url)
    const query = url.searchParams.get("query")

    return HttpResponse.json({
      page: 1,
      results: [
        {
          id: 12345,
          title: query ? `Search result for ${query}` : "Test Movie",
          overview: "A test movie for testing purposes",
          release_date: "2023-01-01",
          poster_path: "/test-poster.jpg",
          backdrop_path: "/test-backdrop.jpg",
          vote_average: 8.5,
          vote_count: 1000,
          adult: false,
          genre_ids: [28, 12],
          original_language: "en",
          original_title: "Test Movie",
          popularity: 100,
          video: false,
        },
      ],
      total_pages: 1,
      total_results: 1,
    })
  }),

  // Get popular movies
  http.get("https://api.themoviedb.org/3/movie/popular", () => {
    return HttpResponse.json({
      page: 1,
      results: [
        {
          id: 12345,
          title: "Popular Test Movie",
          overview: "A popular test movie",
          release_date: "2023-01-01",
          poster_path: "/test-poster.jpg",
          backdrop_path: "/test-backdrop.jpg",
          vote_average: 8.5,
          vote_count: 1000,
          adult: false,
          genre_ids: [28, 12],
          original_language: "en",
          original_title: "Popular Test Movie",
          popularity: 100,
          video: false,
        },
      ],
      total_pages: 1,
      total_results: 1,
    })
  }),

  // Get trending movies
  http.get("https://api.themoviedb.org/3/trending/movie/day", () => {
    return HttpResponse.json({
      page: 1,
      results: [
        {
          id: 12345,
          title: "Trending Test Movie",
          overview: "A trending test movie",
          release_date: "2023-01-01",
          poster_path: "/test-poster.jpg",
          backdrop_path: "/test-backdrop.jpg",
          vote_average: 8.5,
          vote_count: 1000,
          adult: false,
          genre_ids: [28, 12],
          original_language: "en",
          original_title: "Trending Test Movie",
          popularity: 100,
          video: false,
        },
      ],
      total_pages: 1,
      total_results: 1,
    })
  }),

  // Get genres
  http.get("https://api.themoviedb.org/3/genre/movie/list", () => {
    return HttpResponse.json({
      genres: [
        { id: 28, name: "Action" },
        { id: 12, name: "Adventure" },
        { id: 16, name: "Animation" },
        { id: 35, name: "Comedy" },
        { id: 80, name: "Crime" },
        { id: 99, name: "Documentary" },
        { id: 18, name: "Drama" },
        { id: 10751, name: "Family" },
        { id: 14, name: "Fantasy" },
        { id: 36, name: "History" },
        { id: 27, name: "Horror" },
        { id: 10402, name: "Music" },
        { id: 9648, name: "Mystery" },
        { id: 10749, name: "Romance" },
        { id: 878, name: "Science Fiction" },
        { id: 10770, name: "TV Movie" },
        { id: 53, name: "Thriller" },
        { id: 10752, name: "War" },
        { id: 37, name: "Western" },
      ],
    })
  }),

  // Get languages
  http.get("https://api.themoviedb.org/3/configuration/languages", () => {
    return HttpResponse.json([
      { iso_639_1: "en", english_name: "English", name: "English" },
      { iso_639_1: "es", english_name: "Spanish", name: "Español" },
      { iso_639_1: "fr", english_name: "French", name: "Français" },
    ])
  }),

  // Get regions
  http.get("https://api.themoviedb.org/3/configuration/countries", () => {
    return HttpResponse.json([
      {
        iso_3166_1: "US",
        english_name: "United States of America",
        native_name: "United States of America",
      },
      {
        iso_3166_1: "GB",
        english_name: "United Kingdom",
        native_name: "United Kingdom",
      },
      { iso_3166_1: "CA", english_name: "Canada", native_name: "Canada" },
    ])
  }),
]
