"use client"

import { Plus } from "lucide-react"
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
import { useLists } from "@/hooks/use-lists"

interface CreateListDialogProps {
  children?: React.ReactNode
}

export function CreateListDialog({ children }: CreateListDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const { createCustom, isCreatingCustom } = useLists()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    createCustom(
      {
        title: title.trim(),
        slug: title.trim().toLowerCase().replace(/ /g, "-"),
      },
      {
        onSuccess: () => {
          setTitle("")
          setOpen(false)
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Create List
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New List</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">List Name</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter list name..."
                disabled={isCreatingCustom}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isCreatingCustom}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || isCreatingCustom}>
              {isCreatingCustom ? (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-current"></div>
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create List
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
