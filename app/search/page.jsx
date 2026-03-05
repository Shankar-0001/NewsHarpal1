import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PublicHeader from '@/components/layout/PublicHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { Calendar, User } from 'lucide-react'

export const revalidate = 120

function escapeLike(value) {
  return value.replace(/[%_]/g, '').trim()
}

export async function generateMetadata({ searchParams }) {
  const q = (searchParams?.q || '').toString().trim()
  return {
    title: q ? `Search: ${q} - NewsHarpal` : 'Search - NewsHarpal',
    description: q ? `Search results for "${q}" on NewsHarpal.` : 'Search published news articles on NewsHarpal.',
  }
}

export default async function SearchPage({ searchParams }) {
  const supabase = await createClient()
  const rawQuery = (searchParams?.q || '').toString()
  const query = escapeLike(rawQuery)

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('name')

  let results = []

  if (query) {
    const { data } = await supabase
      .from('articles')
      .select('id, title, slug, excerpt, published_at, categories(name, slug), authors(name)')
      .eq('status', 'published')
      .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%`)
      .order('published_at', { ascending: false })
      .limit(30)
    results = data || []
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PublicHeader categories={categories || []} />

      <main className="w-full max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Search</h1>
        {query ? (
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Results for: <span className="font-semibold">{query}</span>
          </p>
        ) : (
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Enter a keyword in the search bar to find articles.
          </p>
        )}

        <div className="mt-8 space-y-5">
          {query && results.length === 0 && (
            <p className="text-gray-600 dark:text-gray-400">No matching articles found.</p>
          )}

          {results.map((article) => (
            <Link key={article.id} href={`/${article.categories?.slug || 'news'}/${article.slug}`}>
              <Card className="hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    {article.categories?.name && <Badge variant="secondary">{article.categories.name}</Badge>}
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{article.title}</h2>
                  {article.excerpt && (
                    <p className="mt-2 text-gray-600 dark:text-gray-400 line-clamp-2">{article.excerpt}</p>
                  )}
                  <div className="mt-3 flex items-center gap-5 text-sm text-gray-500 dark:text-gray-400">
                    <span className="inline-flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {article.authors?.name || 'NewsHarpal'}
                    </span>
                    {article.published_at && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}

