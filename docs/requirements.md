# MoviePal App - Requirements

## 1. Overview

MoviePal is an application where people can browse, search, and get personalized movie recommendations using data from TMDB. 
Visitors can check out trending and popular movies right away, while logged-in users get to like, rate, and save movies to private lists. 
The more users interact with the app, the better their recommendations get.

---

## 2. Functional Requirements

### Browsing & Discovery
- Show trending, popular, and top-rated movies
- Let users apply sorting based on relevance, rating, release date
- Let people search by title, keyword, or genre
- Show a full movie page with title, year, poster, trailer, cast/crew, runtime, and overview
- Support infinite scrolling

### Accounts & Profiles
- Sign up and log in with email/password
- Require email verification
- Stay logged in across sessions
- Edit profile info

### Interactions & Lists
- Like movies to build a preference profile
- Rate movies from 1–10
- Save movies to built-in lists (Favorites, Watch Later)
- Create custom lists, rename or delete them
- See all liked/rated/saved movies in the profile
- Lists are private by default

### Recommendations
- Get recommendations based on likes/ratings
- Recommendations refresh within 5s of a like/rating
- Dismiss/hide movies you don’t like from the feed

### UX
- Work smoothly on mobile, tablet, and desktop
- Show skeleton loaders with meaningful empty/error states

---

## 3. Non-Functional Requirements

### Code quality
- Use TypeScript in strict mode
- ESLint + Prettier for consistency
- Follow conventional commit rules for commit messages
- Keep code modular and easy to follow

### Database
- Use Drizzle ORM + Postgres for user data, lists, and preferences
- Keep schema versioned with Drizzle Kit migrations (`drizzle-kit generate`)
- Tables:
  - `users` (id, email, username, password_hash, avatar_url, preferences, created_at, updated_at)
  - `movies` (id, tmdb_id, title, year, metadata, created_at, updated_at)
  - `likes` (user_id, movie_id, created_at)
  - `ratings` (user_id, movie_id, score, created_at, updated_at)
  - `lists` (id, user_id, title, is_builtin, created_at, updated_at)
  - `list_items` (list_id, movie_id, sort_order, created_at, updated_at)
- Add indexes for frequently queried columns such as user_id & movie_id

### Testing
- Unit tests for helpers (like recommendation scoring)
- Integration tests for API + DB interactions
- Component tests for UI
- E2E tests for key flows (login, liking, getting recommendations)
- Target: ~90% line coverage, ~80% branch coverage

### Performance
- Pages load quickly and are responsive
- Cache common API calls
- Use Postgres indexes for fast lookups
- Apply lazy loading and use `next/image` for optimized images

### Security
- Secrets in `.env`, not in code
- Use secure HTTP-only cookies for auth
- Validate all inputs/outputs
- Hash passwords
- Apply rate limiting for like/rate actions

### Reliability
- Retry TMDB requests with exponential backoff if they fail
- Show friendly error states
- Handle cold-start users (recommend trending movies if no data)
- Structured logs (no sensitive data)

### Deployment
- CI pipeline runs lint, typecheck, tests, build
- Preview environments on every PR (Vercel)
- Auto-deploy to production on `main` branch merges
- Run `drizzle-kit migrate deploy` in production
- Semantic release for auto changelogs

---

## 4. Acceptance Criteria

- Guests see popular movies on the home page
- Logged-in users can like a movie and have their recommendations updated within 5s
- Liking the same movie twice is idempotent; total likes do not increase
- Spamming “like” too many times in a minute gets blocked
- Search supports sorting and filtering, with working pagination
- `pnpm lint && pnpm test` runs clean locally and in CI
- Pages load quickly and smoothly across devices
