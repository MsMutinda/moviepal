"use client"

import { Bookmark, Plus } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useListItemsMutations } from "@/hooks/use-list-items"
import { useLists } from "@/hooks/use-lists"
import type { List } from "@/lib/types"

interface AddListItemDialogProps {
  children: React.ReactNode
  movieId: string | number
  movieTitle: string
  isAuthenticated?: boolean
}

export function AddListItemDialog({
  children,
  movieId,
  movieTitle,
  isAuthenticated = false,
}: AddListItemDialogProps) {
  if (!isAuthenticated) return null
  if (typeof movieId !== "string") {
    movieId = movieId.toString()
  }

  const [open, setOpen] = useState(false)
  const [newListTitle, setNewListTitle] = useState("")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [addingToListId, setAddingToListId] = useState<string | null>(null)

  const { data: lists, isLoading } = useLists()
  const {
    addListItem,
    createListAndAddItem,
    isAddingListItem,
    isCreatingListAndAddingItem,
  } = useListItemsMutations()

  const handleAddToExistingList = (list: List) => {
    setAddingToListId(list.id)
    addListItem(
      { listId: list.id, movieId, movieTitle },
      {
        onSuccess: () => {
          setOpen(false)
          setAddingToListId(null)
        },
        onError: () => {
          setAddingToListId(null)
        },
      },
    )
  }

  const handleCreateListAndAddItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newListTitle.trim()) return

    createListAndAddItem(
      { title: newListTitle.trim(), movieId, movieTitle },
      {
        onSuccess: () => {
          setNewListTitle("")
          setShowCreateForm(false)
          setOpen(false)
        },
      },
    )
  }

  const isAnyLoading = isAddingListItem || isCreatingListAndAddingItem

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add "{movieTitle}" to List</DialogTitle>
        </DialogHeader>

        {!showCreateForm ? (
          <div className="space-y-4 py-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="border-primary h-6 w-6 animate-spin rounded-full border-b-2"></div>
              </div>
            ) : lists && lists.length > 0 ? (
              <div className="space-y-2">
                <Label>Choose a list:</Label>
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {lists.map((list) => {
                    const isThisListLoading = addingToListId === list.id
                    return (
                      <Button
                        key={list.id}
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => handleAddToExistingList(list)}
                        disabled={isAnyLoading}
                      >
                        {isThisListLoading ? (
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-current"></div>
                        ) : (
                          <Bookmark className="mr-2 h-4 w-4" />
                        )}
                        {isThisListLoading ? "Adding..." : list.title}
                        {list.isBuiltin && !isThisListLoading && (
                          <span className="text-muted-foreground ml-auto text-xs">
                            {list.builtinType === "favorites"
                              ? "Favorites"
                              : "Watch Later"}
                          </span>
                        )}
                      </Button>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="text-muted-foreground mb-4">No lists found</p>
              </div>
            )}

            <div className="border-t pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(true)}
                disabled={isAnyLoading}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New List
              </Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleCreateListAndAddItem}
            className="space-y-4 py-4"
          >
            <div className="space-y-2">
              <Label htmlFor="newListTitle">List Title</Label>
              <Input
                id="newListTitle"
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                placeholder="Enter list name..."
                disabled={isAnyLoading}
                autoFocus
              />
            </div>
          </form>
        )}

        <DialogFooter>
          {showCreateForm && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCreateForm(false)
                setNewListTitle("")
              }}
              disabled={isAnyLoading}
            >
              Back
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isAnyLoading}
          >
            Cancel
          </Button>
          {showCreateForm && (
            <Button
              type="submit"
              onClick={handleCreateListAndAddItem}
              disabled={!newListTitle.trim() || isAnyLoading}
            >
              {isCreatingListAndAddingItem ? (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-current"></div>
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create & Add
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
