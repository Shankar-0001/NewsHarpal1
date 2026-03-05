import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import PublicHeader from '@/components/layout/PublicHeader'

export const revalidate = 300

export default async function TagPage({ params }) {
  try {
    const supabase = await createClient()
    const { slug } = params

  const { data: tag } = await supabase
    .from('tags')
    .select('id, name, slug')
    .eq('slug', slug)
    .single()

    if (!tag) notFound()

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('name')

  const { data: links } = await supabase
    .from('article_tags')
    .select(`
      article_id,
      articles (
        id,
        title,
        slug,
        excerpt,
        published_at,
        categories (slug, name),
        authors (name, slug)
      )
    `)
    .eq('tag_id', tag.id)

  const articles = (links || [])
    .map((item) => item.articles)
    .filter((article) => article?.published_at)
    .sort((a, b) => new Date(b.published_at) - new Date(a.published_at))

    return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PublicHeader categories={categories || []} />
      <main className="container mx-auto px-4 py-10">
        <div className="mb-6">
          <Badge variant="secondary" className="mb-2">Tag</Badge>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{tag.name}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{articles.length} article(s)</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {articles.map((article) => (
            <Link key={article.id} href={`/${article.categories?.slug || 'news'}/${article.slug}`}>
              <Card className="p-5 h-full hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700">
                <h2 className="font-semibold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2">
                  {article.title}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                  {article.excerpt || 'No excerpt available.'}
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
    )
  } catch (error) {
    console.error('Tag page SSR failed:', error)
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-12">
          <p className="text-gray-700 dark:text-gray-300">Tag page is temporarily unavailable. Please try again.</p>
        </div>
      </div>
    )
  }
}
