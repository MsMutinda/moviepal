import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Genre } from "@/lib/types"

type FiltersDialogProps = {
  showFilters: boolean
  setShowFilters: (_show: boolean) => void
  sortBy: string
  setSortBy: (_sortBy: string) => void
  yearFrom: string
  setYearFrom: (_yearFrom: string) => void
  yearTo: string
  setYearTo: (_yearTo: string) => void
  minRating: string
  setMinRating: (_minRating: string) => void
  genre: string
  setGenre: (_genre: string) => void
  genres: Genre[]
  refetchDiscover: () => void
  isDiscoverLoading: boolean
  clearFilters: () => void
}

export default function FiltersDialog(props: FiltersDialogProps) {
  const {
    showFilters,
    setShowFilters,
    sortBy,
    setSortBy,
    yearFrom,
    setYearFrom,
    yearTo,
    setYearTo,
    minRating,
    setMinRating,
    genre,
    setGenre,
    genres,
    refetchDiscover,
    isDiscoverLoading,
    clearFilters,
  } = props

  return (
    <Dialog open={showFilters} onOpenChange={setShowFilters}>
      <DialogContent aria-describedby="filters-dialog-content">
        <DialogHeader>
          <DialogTitle>Filters</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
            <div className="space-y-2">
              <label className="text-muted-foreground text-sm font-medium">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-background w-full rounded-md border border-[#CCCCCC]/50 px-3 py-2 text-sm focus:border-[#009A9C] focus:ring-1 focus:ring-[#009A9C] focus:outline-none"
              >
                <option value="popularity.desc">
                  Popularity (High to Low)
                </option>
                <option value="popularity.asc">Popularity (Low to High)</option>
                <option value="vote_average.desc">Rating (High to Low)</option>
                <option value="vote_average.asc">Rating (Low to High)</option>
                <option value="release_date.desc">Release Date (Newest)</option>
                <option value="release_date.asc">Release Date (Oldest)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-muted-foreground text-sm font-medium">
                Year From
              </label>
              <Input
                type="number"
                placeholder="2020"
                value={yearFrom}
                onChange={(e) => setYearFrom(e.target.value)}
                min="1900"
                max="2030"
                className="h-9 border-[#CCCCCC]/50 focus:border-[#009A9C] focus:ring-1 focus:ring-[#009A9C]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-muted-foreground text-sm font-medium">
                Year To
              </label>
              <Input
                type="number"
                placeholder="2024"
                value={yearTo}
                onChange={(e) => setYearTo(e.target.value)}
                min="1900"
                max="2030"
                className="h-9 border-[#CCCCCC]/50 focus:border-[#009A9C] focus:ring-1 focus:ring-[#009A9C]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-muted-foreground text-sm font-medium">
                Min Rating
              </label>
              <Input
                type="number"
                placeholder="7.0"
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
                min="0"
                max="10"
                step="0.1"
                className="h-9 border-[#CCCCCC]/50 focus:border-[#009A9C] focus:ring-1 focus:ring-[#009A9C]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-muted-foreground text-sm font-medium">
                Genre
              </label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="bg-background w-full rounded-md border border-[#CCCCCC]/50 px-3 py-2 text-sm focus:border-[#009A9C] focus:ring-1 focus:ring-[#009A9C] focus:outline-none"
              >
                <option value="">All Genres</option>
                {genres.map((genre) => (
                  <option key={genre.id} value={genre.id.toString()}>
                    {genre.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4 sm:flex-row">
            <Button
              onClick={() => {
                setShowFilters(false)
                refetchDiscover()
              }}
              disabled={isDiscoverLoading}
              className="w-full bg-[#009A9C] hover:bg-[#009A9C]/90 sm:w-auto"
            >
              {isDiscoverLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                "Apply Filters"
              )}
            </Button>

            <Button
              onClick={clearFilters}
              className="w-full bg-gray-200 hover:bg-gray-400 sm:w-auto"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
