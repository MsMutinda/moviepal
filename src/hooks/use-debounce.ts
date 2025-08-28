import { useEffect, useState } from "react"

export function useDebouncedValue<TValue>(
  value: TValue,
  delay: number,
): TValue {
  const [debouncedValue, setDebouncedValue] = useState<TValue>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
