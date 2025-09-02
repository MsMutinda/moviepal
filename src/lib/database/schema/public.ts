import { sql } from "drizzle-orm"
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core"

import { users } from "@/lib/database/schema/auth"

//#region Built-in list types
export const builtinListType = pgEnum("builtin_list_type", [
  "favorites",
  "watch_later",
])
//#endregion

//#region Lists
export const lists = pgTable(
  "lists",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuid_generate_v7()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    isBuiltin: boolean("is_builtin").default(false),
    builtinType: builtinListType("builtin_type"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    userIdx: index("lists_user_id_idx").on(t.userId),
    uniquePerUser: unique("lists_user_slug_unique").on(t.userId, t.slug),
  }),
)

export const listItems = pgTable(
  "list_items",
  {
    listId: uuid("list_id")
      .notNull()
      .references(() => lists.id, { onDelete: "cascade" }),
    movieId: uuid("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    pk: primaryKey(t.listId, t.movieId),
    listIdx: index("list_items_list_id_idx").on(t.listId),
    movieIdx: index("list_items_movie_id_idx").on(t.movieId),
  }),
)
//#endregion

//#region Movies
export const movies = pgTable(
  "movies",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuid_generate_v7()`),
    tmdbId: integer("tmdb_id").notNull().unique(),
    title: text("title").notNull(),
    year: integer("year"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    tmdbIdx: index("movies_tmdb_id_idx").on(t.tmdbId),
  }),
)
//#endregion

//#region Likes
export const likes = pgTable(
  "likes",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    movieId: uuid("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.movieId] }),
    userIdx: index("likes_user_id_idx").on(t.userId),
    movieIdx: index("likes_movie_id_idx").on(t.movieId),
  }),
)
//#endregion

//#region Ratings
export const ratings = pgTable(
  "ratings",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    movieId: uuid("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    score: integer("score").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.movieId] }),
    userIdx: index("ratings_user_id_idx").on(t.userId),
    movieIdx: index("ratings_movie_id_idx").on(t.movieId),
  }),
)
//#endregion
