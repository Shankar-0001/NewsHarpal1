import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, User, Clock, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import PublicHeader from '@/components/layout/PublicHeader'
import Breadcrumb from '@/components/common/Breadcrumb'
import StructuredData, { NewsArticleSchema } from '@/components/seo/StructuredData'
import { InArticleAd, MobileStickyAd } from '@/components/ads/AdComponent'

// ISR Configuration - Revalidate every 60 seconds
export const revalidate = 60

// Generate static params for published articles
export async function generateStaticParams() {
  // Use direct Supabase client without cookies for static generation
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  const { data: articles } = await supabase
    .from('articles')
    .select('slug, categories(slug)')
    .eq('status', 'published')
    .limit(100)

  return articles?.map((article) => ({
    categorySlug: article.categories?.slug || 'news',
    articleSlug: article.slug,
  })) || []
}

// Generate metadata for SEO
export async function generateMetadata({ params }) {
  const supabase = await createClient()
  const { categorySlug, articleSlug } = params

  const { data: article } = await supabase
    .from('articles')
    .select(`
      *,
      authors (name),
      categories (name, slug)
    `)
    .eq('slug', articleSlug)
    .eq('status', 'published')
    .single()

  if (!article) {
    return {
      title: 'Article Not Found',
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://publish-pro-20.preview.emergentagent.com'
  const articleUrl = `${siteUrl}/${article.categories?.slug || 'news'}/${article.slug}`

  return {
    title: article.seo_title || article.title,
    description: article.seo_description || article.excerpt,
    openGraph: {
      title: article.seo_title || article.title,
      description: article.seo_description || article.excerpt,
      type: 'article',
      publishedTime: article.published_at,
      modifiedTime: article.updated_at,
      authors: [article.authors?.name],
      images: article.featured_image_url ? [{
        url: article.featured_image_url,
        width: 1200,
        height: 630,
        alt: article.title,
      }] : [],
      url: articleUrl,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.seo_title || article.title,
      description: article.seo_description || article.excerpt,
      images: article.featured_image_url ? [article.featured_image_url] : [],
    },
    alternates: {
      canonical: articleUrl,
    },
    robots: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
    },
  }
}

export default async function ArticlePage({ params }) {
  const supabase = await createClient()
  const { categorySlug, articleSlug } = params
  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://publish-pro-20.preview.emergentagent.com'

  // Fetch article
  const { data: article } = await supabase
    .from('articles')
    .select(`
      *,
      authors (id, slug, name, bio, avatar_url),
      categories (name, slug),
      article_tags (tags (name, slug))
    `)
    .eq('slug', articleSlug)
    .eq('status', 'published')
    .single()

  if (!article) {
    notFound()
  }

  // Get related articles
  const { data: relatedArticles } = await supabase
    .from('articles')
    .select('id, title, slug, excerpt, featured_image_url, published_at, categories(slug), authors(name)')
    .eq('category_id', article.category_id)
    .eq('status', 'published')
    .neq('id', article.id)
    .limit(3)

  // Get categories for header
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .limit(6)

  const articleUrl = `${siteUrl}/${article.categories?.slug || 'news'}/${article.slug}`
  const breadcrumbItems = [
    { label: article.categories?.name || 'News', href: `/${article.categories?.slug || 'news'}` },
    { label: article.title, href: `/${article.categories?.slug || 'news'}/${article.slug}` },
  ]

  // JSON-LD Schema
  const newsArticleSchema = NewsArticleSchema({
    title: article.title,
    description: article.excerpt,
    image: article.featured_image_url,
    datePublished: article.published_at,
    dateModified: article.updated_at,
    authorName: article.authors?.name,
    url: articleUrl,
    category: article.categories?.name,
  })

  return (
    <>
      <StructuredData data={newsArticleSchema} />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <PublicHeader categories={categories || []} />

        {/* Article Content */}
        <article className="container mx-auto px-4 py-8 max-w-4xl">
          <Breadcrumb items={breadcrumbItems} />

          <Card className="p-8 md:p-12 dark:bg-gray-800 dark:border-gray-700">
            {/* Category Badge */}
            {article.categories && (
              <Link href={`/${article.categories.slug}`}>
                <Badge variant="secondary" className="mb-4 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600">
                  {article.categories.name}
                </Badge>
              </Link>
            )}

            {/* Title - H1 for SEO */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              {article.title}
            </h1>

            {/* Excerpt */}
            {article.excerpt && (
              <p className="text-xl text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                {article.excerpt}
              </p>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-6 mb-8 pb-8 border-b dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>By </span>
                <Link href={`/authors/${article.authors?.slug || article.authors?.id}`}>
                  <strong className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:underline cursor-pointer">{article.authors?.name}</strong>
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <time dateTime={article.published_at}>
                  Published {format(new Date(article.published_at), 'MMMM d, yyyy')}
                </time>
              </div>
              {article.updated_at !== article.published_at && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <time dateTime={article.updated_at}>
                    Updated {format(new Date(article.updated_at), 'MMMM d, yyyy')}
                  </time>
                </div>
              )}
            </div>

            {/* Featured Image - Optimized for Google Discover */}
            {article.featured_image_url && (
              <div className="mb-8 rounded-lg overflow-hidden relative w-full aspect-video md:aspect-[21/9]">
                <Image
                  src={article.featured_image_url}
                  alt={article.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                />
              </div>
            )}

            {/* Article Content */}
            <div
              className="prose prose-lg dark:prose-invert max-w-none mb-8"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {/* In-Article Ad */}
            <InArticleAd />

            {/* Tags */}
            {article.article_tags && article.article_tags.length > 0 && (
              <div className="mt-12 pt-8 border-t dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase">Tagged</h3>
                <div className="flex flex-wrap gap-2">
                  {article.article_tags.map((at) => (
                    <Link key={at.tags.slug} href={`/tag/${at.tags.slug}`}>
                      <Badge variant="outline" className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                        {at.tags.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Author Bio - Author Credibility */}
            {article.authors && (
              <div className="mt-12 pt-8 border-t dark:border-gray-700">
                <h3 className="text-lg font-bold mb-4 dark:text-white">About the Author</h3>
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xl font-bold text-gray-600 dark:text-gray-300 flex-shrink-0">
                    {article.authors.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg dark:text-white">{article.authors.name}</h4>
                    {article.authors.bio && (
                      <p className="text-gray-600 dark:text-gray-400 mt-2">{article.authors.bio}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Related Articles */}
          {relatedArticles && relatedArticles.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6 dark:text-white">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedArticles.map((related) => (
                  <Link
                    key={related.id}
                    href={`/${related.categories?.slug || 'news'}/${related.slug}`}
                  >
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full dark:bg-gray-800 dark:border-gray-700">
                      {related.featured_image_url && (
                        <div className="relative w-full aspect-video">
                          <Image
                            src={related.featured_image_url}
                            alt={related.title}
                            fill
                            className="object-cover rounded-t-lg"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-bold mb-2 line-clamp-2 dark:text-white">{related.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {related.excerpt}
                        </p>
                        <div className="flex items-center gap-2 mt-3 text-xs text-gray-500 dark:text-gray-500">
                          <span>{related.authors?.name}</span>
                          <span>•</span>
                          <time>{format(new Date(related.published_at), 'MMM d, yyyy')}</time>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* Mobile Sticky Ad */}
        <MobileStickyAd />
      </div>
    </>
  )
}