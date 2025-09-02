"use client"

import { Star } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { useMovieRating } from "@/hooks/use-movie-ratings"

interface MovieRatingButtonProps {
  movieId: string
  className?: string
}

export function MovieRatingButton({
  movieId,
  className,
}: MovieRatingButtonProps) {
  const {
    rating,
    setRating,
    removeRating,
    isSettingRating,
    isRemovingRating,
    isLoading,
  } = useMovieRating(movieId)
  const [isOpen, setIsOpen] = useState(false)

  if (isLoading) {
    return (
      <Button
        variant="outline"
        size="icon"
        disabled
        className={className}
        aria-label="Loading rating"
      >
        <Star className="size-4" />
      </Button>
    )
  }

  const handleRatingClick = (score: number) => {
    if (rating === score) {
      removeRating()
    } else {
      setRating(score)
    }
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <Button
        variant="secondary"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSettingRating || isRemovingRating}
        className={`${className} ${
          rating
            ? "bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/30"
            : ""
        }`}
        aria-label={rating ? `Rated ${rating}/10` : "Rate movie"}
      >
        <Star
          className={`size-4 transition-colors ${
            rating ? "fill-blue-500 text-blue-500" : "text-muted-foreground"
          }`}
        />
        {rating && (
          <span className="bg-background absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full border text-xs font-medium">
            {rating}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="bg-background absolute top-full right-0 z-50 mt-2 min-w-[220px] rounded-md border p-4 shadow-xl">
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
              <Button
                key={score}
                variant={rating === score ? "default" : "ghost"}
                size="sm"
                onClick={() => handleRatingClick(score)}
                className="h-10 w-10 p-0 text-sm font-medium"
                aria-label={`Rate ${score}/10`}
              >
                {score}
              </Button>
            ))}
          </div>
          {rating && (
            <div className="mt-4 border-t pt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  removeRating()
                  setIsOpen(false)
                }}
                className="text-muted-foreground w-full text-sm"
              >
                Remove rating
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
