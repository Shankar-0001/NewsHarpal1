'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardWebStoriesPage() {
  const supabase = createClient()
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('web_stories')
      .select('id, title, slug, created_at, authors(name), categories(name)')
      .order('created_at', { ascending: false })
    setStories(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const deleteStory = async (id) => {
    if (!confirm('Delete this story?')) return
    await fetch(`/api/web-stories/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Web Stories</h1>
        <Link href="/dashboard/web-stories/new">
          <Button>Create Story</Button>
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      ) : stories.length === 0 ? (
        <Card><CardContent className="p-6">No stories yet.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stories.map((story) => (
            <Card key={story.id} className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg dark:text-white">{story.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-gray-600 dark:text-gray-300">/{story.slug}</p>
                <p className="text-gray-500 dark:text-gray-400">Author: {story.authors?.name || '-'}</p>
                <p className="text-gray-500 dark:text-gray-400">Category: {story.categories?.name || '-'}</p>
                <div className="flex gap-2">
                  <Link href={`/dashboard/web-stories/${story.id}/edit`}><Button size="sm" variant="outline">Edit</Button></Link>
                  <Button size="sm" variant="destructive" onClick={() => deleteStory(story.id)}>Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
