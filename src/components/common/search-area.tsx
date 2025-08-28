import { Filter, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type SearchAreaProps = {
  searchQuery: string
  setSearchQuery: (_value: string) => void
  loadDiscover: () => void
  toggleFilters: () => void
}

export default function SearchArea(props: SearchAreaProps) {
  const { searchQuery, setSearchQuery, loadDiscover, toggleFilters } = props

  return (
    <div className="container mx-auto flex justify-center">
      <div className="flex w-full max-w-lg gap-2">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
          <Input
            placeholder="Search movies by title, year, genre, cast..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                loadDiscover()
              }
            }}
            className="bg-card/80 h-12 border-[#CCCCCC]/50 pl-10"
          />
        </div>
        <Button
          size="lg"
          variant="outline"
          className="bg-card/80 h-12 border-[#CCCCCC]/50 px-4 backdrop-blur-sm hover:border-[#009A9C]/50 hover:bg-[#009A9C]/10"
          onClick={toggleFilters}
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
