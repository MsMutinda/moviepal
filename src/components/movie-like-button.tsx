"use client"

import { Heart } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useMovieLike } from "@/hooks/use-movie-likes"

interface MovieLikeButtonProps {
  movieId: string
  className?: string
}

export function MovieLikeButton({ movieId, className }: MovieLikeButtonProps) {
  const { liked, toggleLike, isToggling, isLoading } = useMovieLike(movieId)

  if (isLoading) {
    return (
      <Button
        variant="outline"
        size="icon"
        disabled
        className={className}
        aria-label="Loading like status"
      >
        <Heart className="size-4" />
      </Button>
    )
  }

  return (
    <Button
      variant="secondary"
      size="icon"
      onClick={() => toggleLike(liked)}
      disabled={isToggling}
      className={`${className} ${
        liked
          ? "bg-pink-100 hover:bg-pink-200 dark:bg-pink-900/20 dark:hover:bg-pink-900/30"
          : ""
      }`}
      aria-label={liked ? "Unlike movie" : "Like movie"}
    >
      <Heart
        className={`size-4 transition-colors ${
          liked ? "fill-pink-500 text-pink-500" : "text-muted-foreground"
        }`}
      />
    </Button>
  )
}
