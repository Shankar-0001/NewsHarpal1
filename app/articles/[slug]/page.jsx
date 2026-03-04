import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, User, ArrowLeft } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function ArticlePage({ params }) {
  const supabase = await createClient()
  const { slug } = params

  // First try to find by current slug
  let { data: article } = await supabase
    .from('articles')
    .select(`
      *,
      authors (id, slug, name, bio, avatar_url),
      categories (name, slug),
      article_tags (tags (name, slug))
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  // If not found, check slug history for 301 redirect
  if (!article) {
    const { data: slugHistory } = await supabase
      .from('slug_history')
      .select('new_slug')
      .eq('old_slug', slug)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (slugHistory) {
      // In a real app, you'd use Next.js redirect here
      // For now, fetch the article with new slug
      const { data: redirectedArticle } = await supabase
        .from('articles')
        .select(`
          *,
          authors (id, slug, name, bio, avatar_url),
          categories (name, slug),
          article_tags (tags (name, slug))
        `)
        .eq('slug', slugHistory.new_slug)
        .eq('status', 'published')
        .single()

      article = redirectedArticle
    }
  }

  if (!article) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>

      {/* Article Content */}
      <article className="container mx-auto px-4 py-12 max-w-4xl">
        <Card className="p-8 md:p-12">
          {/* Category Badge */}
          {article.categories && (
            <Badge variant="secondary" className="mb-4">
              {article.categories.name}
            </Badge>
          )}

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {article.title}
          </h1>

          {/* Meta Info */}
          <div className="flex items-center gap-6 mb-8 pb-8 border-b">
            <div className="flex items-center gap-2 text-gray-600">
              <User className="h-5 w-5" />
              <Link href={`/authors/${article.authors?.slug || article.authors?.id}`}>
                <span className="hover:text-blue-600 hover:underline cursor-pointer">{article.authors?.name}</span>
              </Link>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="h-5 w-5" />
              <span>
                {formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
              </span>
            </div>
          </div>

          {/* Featured Image */}
          {article.featured_image_url && (
            <div className="mb-8 rounded-lg overflow-hidden">
              <img
                src={article.featured_image_url}
                alt={article.title}
                className="w-full h-auto"
              />
            </div>
          )}

          {/* Excerpt */}
          {article.excerpt && (
            <p className="text-xl text-gray-700 mb-8 leading-relaxed">
              {article.excerpt}
            </p>
          )}

          {/* Content */}
          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {/* Tags */}
          {article.article_tags && article.article_tags.length > 0 && (
            <div className="mt-12 pt-8 border-t">
              <h3 className="text-sm font-semibold text-gray-500 mb-3">TAGS</h3>
              <div className="flex flex-wrap gap-2">
                {article.article_tags.map((at) => (
                  <Badge key={at.tags.slug} variant="outline">
                    {at.tags.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Author Bio */}
          {article.authors && (
            <div className="mt-12 pt-8 border-t">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-600">
                  {article.authors.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{article.authors.name}</h3>
                  {article.authors.bio && (
                    <p className="text-gray-600 mt-1">{article.authors.bio}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </Card>
      </article>
    </div>
  )
}