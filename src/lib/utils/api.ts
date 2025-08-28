import { Credits, CrewMember, TMDBRequestOpts } from "@/lib/types"

export const buildQueryString = (params?: TMDBRequestOpts["query"]) => {
  const query = new URLSearchParams()
  if (!params) return ""
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return
    query.set(k, String(v))
  })
  const s = query.toString()
  return s ? `&${s}` : ""
}

export const formatRuntime = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

export const getDirector = (credits: Credits) => {
  return (
    credits?.crew?.find((member: CrewMember) => member.job === "Director") || {
      name: "N/A",
    }
  )
}
