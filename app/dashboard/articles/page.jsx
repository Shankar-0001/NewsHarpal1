import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default async function ArticlesPage() {
  const supabase = await createClient()
  
  const { data: articles } = await supabase
    .from('articles')
    .select(`
      *,
      authors (name),
      categories (name)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Articles</h1>
          <p className="text-gray-600 mt-2">Manage your articles</p>
        </div>
        <Link href="/dashboard/articles/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Article
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {articles?.map((article) => (
          <Card key={article.id} className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h2 className="text-xl font-semibold">{article.title}</h2>
                  <Badge
                    variant={article.status === 'published' ? 'default' : article.status === 'pending' ? 'secondary' : 'outline'}
                  >
                    {article.status}
                  </Badge>
                </div>
                <p className="text-gray-600 mb-3">{article.excerpt}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>By {article.authors?.name}</span>
                  {article.categories && (
                    <span className="flex items-center">
                      <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                      {article.categories.name}
                    </span>
                  )}
                  <span className="flex items-center">
                    <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                    {formatDistanceToNow(new Date(article.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
              <div className="flex space-x-2 ml-4">
                <Link href={`/dashboard/articles/${article.id}/edit`}>
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4" />
                  </Button>
                </Link>
                <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {!articles || articles.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No articles yet. Create your first article!</p>
          </div>
        )}
      </div>
    </div>
  )
}