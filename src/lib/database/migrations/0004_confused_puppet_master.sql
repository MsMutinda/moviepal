CREATE TABLE "dismissed_movies" (
	"user_id" uuid NOT NULL,
	"movie_id" uuid NOT NULL,
	"dismissed_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "dismissed_movies_user_id_movie_id_pk" PRIMARY KEY("user_id","movie_id")
);
--> statement-breakpoint
ALTER TABLE "dismissed_movies" ADD CONSTRAINT "dismissed_movies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dismissed_movies" ADD CONSTRAINT "dismissed_movies_movie_id_movies_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dismissed_movies_user_id_idx" ON "dismissed_movies" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "dismissed_movies_movie_id_idx" ON "dismissed_movies" USING btree ("movie_id");