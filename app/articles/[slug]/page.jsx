import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, User, ArrowLeft } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { generateArticleMetadata, generateArticleSchemas } from '@/lib/seo-utils'
import Script from 'next/script'
import { calculateReadingTime, generateSixtySecondSummary } from '@/lib/content-utils'
import ArticleSummary from '@/components/article/ArticleSummary'
import ArticleEngagementBar from '@/components/article/ArticleEngagementBar'
import ArticleMiniCard from '@/components/content/ArticleMiniCard'
import Image from 'next/image'

// Revalidate every 10 minutes (ISR)
export const revalidate = 600

export async function generateMetadata({ params }) {
  const supabase = await createClient()
  const { slug } = params

  const { data: article } = await supabase
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

  if (!article) {
    return {
      title: 'Article Not Found - NewsHarpal',
      description: 'The article you are looking for does not exist.',
    }
  }

  return generateArticleMetadata(article)
}

export default async function ArticlePage({ params }) {
  try {
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

  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://newsharpal.com'
  const articleUrl = `${siteUrl}/articles/${article.slug}`
  const readingTimeMinutes = calculateReadingTime(article.content || '')
  const summaryPoints = generateSixtySecondSummary(article)

  const { data: relatedArticles } = await supabase
    .from('articles')
    .select('id, title, slug, excerpt, published_at, categories(slug)')
    .eq('status', 'published')
    .eq('category_id', article.category_id)
    .neq('id', article.id)
    .order('published_at', { ascending: false })
    .limit(4)

  const { data: engagementRows } = await supabase
    .from('article_engagement')
    .select('article_id, views, likes, shares')
    .limit(100)

  const scoreMap = new Map(
    (engagementRows || []).map((row) => [
      row.article_id,
      (row.views || 0) + (row.likes || 0) * 3 + (row.shares || 0) * 5,
    ])
  )
  const { data: trendingCandidates } = await supabase
    .from('articles')
    .select('id, title, slug, excerpt, categories(slug)')
    .eq('status', 'published')
    .neq('id', article.id)
    .order('published_at', { ascending: false })
    .limit(20)

  const trendingArticles = (trendingCandidates || [])
    .map((item) => ({ ...item, _score: scoreMap.get(item.id) || 0 }))
    .sort((a, b) => b._score - a._score)
    .slice(0, 5)

  const { data: latestArticles } = await supabase
    .from('articles')
    .select('id, title, slug, excerpt, categories(slug)')
    .eq('status', 'published')
    .neq('id', article.id)
    .order('published_at', { ascending: false })
    .limit(6)
  const schemas = generateArticleSchemas({
    article,
    articleUrl,
    readingTimeMinutes,
    breadcrumbs: [
      { name: 'Home', url: siteUrl },
      { name: article.categories?.name || 'News', url: `${siteUrl}/${article.categories?.slug || 'news'}` },
      { name: article.title, url: articleUrl },
    ],
    faqItems: [
      { question: 'What is this article about?', answer: article.excerpt || article.title },
      { question: 'How long does this article take to read?', answer: `About ${readingTimeMinutes} minutes.` },
    ],
  })

    return (
    <>
      {/* Structured Data */}
      <Script
        id="article-news-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas.newsArticle) }}
      />
      <Script id="article-blog-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas.blogPosting) }} />
      <Script id="article-breadcrumb-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas.breadcrumbList) }} />
      <Script id="article-faq-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas.faqPage) }} />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="container mx-auto max-w-6xl px-4 py-4">
            <Link href="/">
              <Button variant="ghost">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>

        {/* Article Content */}
        <article className="container mx-auto px-4 py-12 max-w-6xl">
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
            {/* Featured Image */}
            {article.featured_image_url && (
              <div className="mb-8 rounded-lg overflow-hidden">
                <Image
                  src={article.featured_image_url}
                  alt={article.title}
                  width={1200}
                  height={675}
                  className="w-full h-auto object-cover"
                  priority
                  sizes="(max-width: 1200px) 100vw, 1200px"
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
            <ArticleSummary points={summaryPoints} />
            <ArticleEngagementBar articleId={article.id} articleUrl={articleUrl} articleTitle={article.title} />
            <p className="text-sm text-gray-600 mb-4">{readingTimeMinutes} min read</p>
            <div
              className="article-content prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {/* Tags */}
            {article.article_tags && article.article_tags.length > 0 && (
              <div className="mt-12 pt-8 border-t">
                <h3 className="text-sm font-semibold text-gray-500 mb-3">TAGS</h3>
                <div className="flex flex-wrap gap-2">
                  {article.article_tags.map((at) => (
                    <Link key={at.tags.slug} href={`/tags/${at.tags.slug}`}>
                      <Badge variant="outline">
                        {at.tags.name}
                      </Badge>
                    </Link>
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

        {relatedArticles && relatedArticles.length > 0 && (
          <section className="container mx-auto px-4 max-w-6xl pb-8">
            <h2 className="text-2xl font-bold mb-4">You May Also Like</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatedArticles.map((item) => (
                <ArticleMiniCard key={item.id} article={item} compact />
              ))}
            </div>
          </section>
        )}

        {trendingArticles && trendingArticles.length > 0 && (
          <section className="container mx-auto px-4 max-w-6xl pb-12">
            <h2 className="text-2xl font-bold mb-4">Trending Now</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {trendingArticles.map((item) => (
                <ArticleMiniCard key={item.id} article={item} compact />
              ))}
            </div>
          </section>
        )}

        {latestArticles && latestArticles.length > 0 && (
          <section className="container mx-auto px-4 max-w-6xl pb-12">
            <h2 className="text-2xl font-bold mb-4">Latest News</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {latestArticles.map((item) => (
                <ArticleMiniCard key={item.id} article={item} compact />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
    )
  } catch (error) {
    console.error('Legacy article page SSR failed:', error)
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto max-w-6xl px-4 py-12">
          <p className="text-gray-700">Article is temporarily unavailable. Please try again.</p>
        </div>
      </div>
    )
  }
}
