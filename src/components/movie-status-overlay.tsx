"use client"

import { Heart, Star } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { useMovieLike } from "@/hooks/use-movie-likes"
import { useMovieRating } from "@/hooks/use-movie-ratings"

interface MovieStatusOverlayProps {
  movieId: string
  liked: boolean
  rating: number | null
  onStatusUpdate: (_updates: {
    liked?: boolean
    rating?: number | null
  }) => void
}

export function MovieStatusOverlay({
  movieId,
  liked,
  rating,
  onStatusUpdate,
}: MovieStatusOverlayProps) {
  const [localLiked, setLocalLiked] = useState(liked)
  const [localRating, setLocalRating] = useState(rating)
  const [showRatingPopup, setShowRatingPopup] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)

  const { toggleLike, isToggling } = useMovieLike(movieId)
  const { setRating, removeRating, isSettingRating, isRemovingRating } =
    useMovieRating(movieId)

  useEffect(() => {
    setLocalLiked(liked)
    setLocalRating(rating)
  }, [liked, rating])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        setShowRatingPopup(false)
      }
    }

    if (showRatingPopup) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showRatingPopup])

  const handleLikeClick = async () => {
    const newLiked = !localLiked
    setLocalLiked(newLiked)
    onStatusUpdate({ liked: newLiked })

    try {
      await toggleLike(liked)
    } catch {
      setLocalLiked(liked)
      onStatusUpdate({ liked })
    }
  }

  const handleRatingClick = async (score: number) => {
    const newRating = localRating === score ? null : score
    setLocalRating(newRating)
    onStatusUpdate({ rating: newRating })
    setShowRatingPopup(false)

    try {
      if (newRating === null) {
        await removeRating()
      } else {
        await setRating(score)
      }
    } catch {
      setLocalRating(rating)
      onStatusUpdate({ rating })
    }
  }

  return (
    <div className="flex gap-1">
      <Button
        variant="secondary"
        size="icon"
        onClick={handleLikeClick}
        disabled={isToggling}
        className={`h-8 w-8 shadow-lg ${
          localLiked
            ? "bg-pink-100 hover:bg-pink-200 dark:bg-pink-900/20 dark:hover:bg-pink-900/30"
            : ""
        }`}
        aria-label={localLiked ? "Unlike movie" : "Like movie"}
      >
        <Heart
          className={`size-4 transition-colors ${
            localLiked ? "fill-pink-500 text-pink-500" : "text-muted-foreground"
          }`}
        />
      </Button>

      <div className="relative" ref={popupRef}>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setShowRatingPopup(!showRatingPopup)}
          disabled={isSettingRating || isRemovingRating}
          className={`h-8 w-8 shadow-lg ${
            localRating
              ? "bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/30"
              : ""
          }`}
          aria-label={localRating ? `Rated ${localRating}/10` : "Rate movie"}
        >
          <Star
            className={`size-4 transition-colors ${
              localRating
                ? "fill-blue-500 text-blue-500"
                : "text-muted-foreground"
            }`}
          />
          {localRating && (
            <span className="bg-background absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full border text-xs font-medium">
              {localRating}
            </span>
          )}
        </Button>

        {showRatingPopup && (
          <div className="bg-background absolute top-full right-0 z-[9999] mt-2 min-w-[220px] rounded-lg border p-4 shadow-xl">
            <div className="mb-2 text-sm font-medium">Rate this movie</div>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                <Button
                  key={score}
                  variant={localRating === score ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleRatingClick(score)}
                  className="h-10 w-10 p-0"
                >
                  {score}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
