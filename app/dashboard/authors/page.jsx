'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Plus, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'

export default function AuthorsPage() {
  const [authors, setAuthors] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadAuthors()
  }, [])

  const loadAuthors = async () => {
    const { data } = await supabase
      .from('authors')
      .select(`
        *,
        users (email, role)
      `)
      .order('name')

    setAuthors(data || [])
    setLoading(false)
  }

  const deleteAuthor = async (authorId, authorName) => {
    if (!confirm(`Are you sure you want to delete ${authorName}? This cannot be undone.`)) {
      return
    }

    try {
      // Use API proxy instead of direct Supabase client
      const response = await fetch('/api/authors', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: authorId }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to delete author')

      alert('Author deleted successfully!')
      loadAuthors()
    } catch (error) {
      console.error('Error deleting author:', error)
      alert('Failed to delete author: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Authors</h1>
          <p className="text-gray-600 mt-2">Manage content creators on your platform</p>
        </div>
        <Link href="/dashboard/authors/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Author
          </Button>
        </Link>
      </div>

      {authors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {authors.map((author) => (
            <Card key={author.id}>
              <CardHeader>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3 flex-1">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={author.avatar_url} />
                      <AvatarFallback>
                        {author.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{author.name}</CardTitle>
                      {author.title && (
                        <p className="text-xs text-gray-500">{author.title}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Link href={`/dashboard/authors/${author.id}/edit`}>
                      <Button size="sm" variant="ghost">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => deleteAuthor(author.id, author.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {author.bio && (
                <CardContent>
                  <p className="text-sm text-gray-600 line-clamp-2">{author.bio}</p>
                </CardContent>
              )}
              {author.email && (
                <CardContent>
                  <p className="text-xs text-gray-500">{author.email}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">No authors found.</p>
            <Link href="/dashboard/authors/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create First Author
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}