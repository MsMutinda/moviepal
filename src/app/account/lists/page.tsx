"use client"

import { Bookmark, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { CreateListDialog } from "@/components/create-list-dialog"
import { DeleteListDialog } from "@/components/delete-list-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useLists } from "@/hooks/use-lists"

export default function ListsPage() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [listToDelete, setListToDelete] = useState<{
    id: string
    title: string
  } | null>(null)

  const {
    data: lists,
    isLoading,
    error,
    delete: deleteList,
    isDeleting,
  } = useLists()

  const handleDeleteClick = (list: { id: string; title: string }) => {
    setListToDelete(list)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (listToDelete) {
      deleteList(listToDelete.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false)
          setListToDelete(null)
        },
      })
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#009A9C]"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="space-y-4 text-center">
            <h1 className="text-foreground text-2xl font-bold">
              Error Loading Lists
            </h1>
            <p className="text-muted-foreground">
              {error?.message || "Failed to load lists. Please try again."}
            </p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-foreground text-xl font-semibold">My Lists</h2>
          <CreateListDialog>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Create List
            </Button>
          </CreateListDialog>
        </div>

        {lists && lists.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lists.map((list) => (
              <Card key={list.id} className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{list.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      {list.isBuiltin ? (
                        <Badge variant="secondary" className="text-xs">
                          Built-in
                        </Badge>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(list)}
                            disabled={isDeleting}
                            className="text-destructive hover:text-destructive h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <CardDescription>
                    {list.isBuiltin
                      ? list.builtinType === "favorites"
                        ? "Your favorite movies"
                        : "Movies you want to watch later"
                      : "Custom movie collection"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={`/account/lists/${list.slug}`}>
                    <Button variant="outline" className="w-full">
                      View List
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="space-y-4 text-center">
                <Bookmark className="text-muted-foreground mx-auto h-12 w-12" />
                <div>
                  <h3 className="text-foreground mb-2 text-lg font-medium">
                    No Lists Yet
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first movie collection to get started
                  </p>
                  <CreateListDialog>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First List
                    </Button>
                  </CreateListDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {listToDelete && (
        <DeleteListDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteConfirm}
          listTitle={listToDelete.title}
          isDeleting={isDeleting}
        />
      )}
    </div>
  )
}
