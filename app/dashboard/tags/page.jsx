'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, X } from 'lucide-react'
import slugify from 'slugify'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'

export default function TagsPage() {
  const [tags, setTags] = useState([])
  const [showDialog, setShowDialog] = useState(false)
  const [name, setName] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadTags()
  }, [])

  const loadTags = async () => {
    const { data } = await supabase
      .from('tags')
      .select('*')
      .order('name')
    
    setTags(data || [])
  }

  const handleCreate = async () => {
    if (!name) return

    const { error } = await supabase.from('tags').insert({
      name,
      slug: slugify(name, { lower: true, strict: true }),
    })

    if (!error) {
      setShowDialog(false)
      setName('')
      loadTags()
    }
  }

  const handleDelete = async (id) => {
    await supabase.from('tags').delete().eq('id', id)
    loadTags()
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tags</h1>
          <p className="text-gray-600 mt-2">Manage content tags</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Tag</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tag name"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate}>Create Tag</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge key={tag.id} variant="secondary" className="text-base px-4 py-2">
            {tag.name}
            <button
              onClick={() => handleDelete(tag.id)}
              className="ml-2 hover:text-red-600"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  )
}