"use client"

import { useCallback, useEffect, useMemo, useRef } from "react"

export interface IntersectionObserverOptions {
  root?: Element | null
  rootMargin?: string
  threshold?: number | number[]
}

export interface UseIntersectionObserverOptions
  extends IntersectionObserverOptions {
  enabled?: boolean
  onIntersect?: () => void
  onLeave?: () => void
}

export interface UseIntersectionObserverReturn {
  ref: React.RefObject<HTMLElement>
  isIntersecting: boolean
  entry: IntersectionObserverEntry | null
}

export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {},
): UseIntersectionObserverReturn {
  const {
    root = null,
    rootMargin = "0px",
    threshold = 0,
    enabled = true,
    onIntersect,
    onLeave,
  } = options

  const ref = useRef<HTMLElement>(null)
  const isIntersectingRef = useRef(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const intersectionObserverOptions = useMemo(
    () => ({ root, rootMargin, threshold }),
    [root, rootMargin, threshold],
  )

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      const isIntersecting = entry.isIntersecting

      if (isIntersecting && !isIntersectingRef.current) {
        isIntersectingRef.current = true

        if (onIntersect) {
          onIntersect()
        }
      } else if (!isIntersecting && isIntersectingRef.current) {
        isIntersectingRef.current = false

        if (onLeave) {
          onLeave()
        }
      }
    },
    [onIntersect, onLeave],
  )

  useEffect(() => {
    if (!enabled || !ref.current) return

    const element = ref.current

    const intersectionObserver = new IntersectionObserver(
      handleIntersection,
      intersectionObserverOptions,
    )
    observerRef.current = intersectionObserver

    intersectionObserver.observe(element)

    return () => {
      intersectionObserver.unobserve(element)
      intersectionObserver.disconnect()
      observerRef.current = null

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      isIntersectingRef.current = false
    }
  }, [enabled, handleIntersection, intersectionObserverOptions])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  return {
    ref: ref as React.RefObject<HTMLElement>,
    isIntersecting: isIntersectingRef.current,
    entry: null,
  }
}

export function useInfiniteScroll(
  onIntersect: () => void,
  hasMore: boolean,
  isFetching: boolean,
  options: Omit<UseIntersectionObserverOptions, "onIntersect" | "enabled"> = {},
): React.RefObject<HTMLElement> {
  const isProcessingRef = useRef(false)

  const { ref } = useIntersectionObserver({
    ...options,
    rootMargin: "200px",
    enabled: hasMore && !isFetching,
    onIntersect:
      hasMore && !isFetching
        ? () => {
            if (isProcessingRef.current || isFetching) {
              return
            }

            isProcessingRef.current = true

            onIntersect()

            setTimeout(() => {
              isProcessingRef.current = false
            }, 1000)
          }
        : undefined,
  })

  return ref
}

export function useOnEnter(
  onEnter: () => void,
  options: Omit<UseIntersectionObserverOptions, "onIntersect"> = {},
): React.RefObject<HTMLElement> {
  const { ref } = useIntersectionObserver({
    ...options,
    onIntersect: onEnter,
  })

  return ref
}

export function useOnLeave(
  onLeave: () => void,
  options: Omit<UseIntersectionObserverOptions, "onLeave"> = {},
): React.RefObject<HTMLElement> {
  const { ref } = useIntersectionObserver({
    ...options,
    onLeave,
  })

  return ref
}
