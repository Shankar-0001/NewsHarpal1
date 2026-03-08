import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, User, Clock, ArrowLeft } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import PublicHeader from '@/components/layout/PublicHeader'
import Breadcrumb from '@/components/common/Breadcrumb'
import StructuredData, { NewsArticleSchema } from '@/components/seo/StructuredData'
import { InArticleAd, MobileStickyAd } from '@/components/ads/AdComponent'
import { generateArticleSchemas } from '@/lib/seo-utils'
import { calculateReadingTime, generateSixtySecondSummary, generateAeoSnapshot } from '@/lib/content-utils'
import ArticleSummary from '@/components/article/ArticleSummary'
import ArticleEngagementBar from '@/components/article/ArticleEngagementBar'
import ArticleMiniCard from '@/components/content/ArticleMiniCard'
import { applyLinkPolicyToHtml } from '@/lib/link-policy'
import { buildLanguageAlternates } from '@/lib/site-config'
import { buildArticleKeywords, keywordsToMetadataValue, keywordsToTopicLinks } from '@/lib/keywords'

// ISR Configuration - Revalidate every 30 minutes
export const revalidate = 1800

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
  try {
    const supabase = await createClient()
    const { articleSlug } = params

    const { data: article } = await supabase
      .from('articles')
      .select(`
        *,
        authors (name, slug),
        categories (name, slug),
        article_tags (tags (name, slug))
      `)
      .eq('slug', articleSlug)
      .eq('status', 'published')
      .single()

    if (!article) {
      return {
        title: 'Article Not Found',
      }
    }

    const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://newsharpal.com'
    const articleUrl = `${siteUrl}/${article.categories?.slug || 'news'}/${article.slug}`
    const keywords = buildArticleKeywords(article)

    return {
      title: article.seo_title || article.title,
      description: article.seo_description || article.excerpt,
      keywords: keywordsToMetadataValue(keywords),
      authors: article.authors ? [{ name: article.authors.name, url: `${siteUrl}/authors/${article.authors.slug}` }] : [],
      openGraph: {
        title: article.seo_title || article.title,
        description: article.seo_description || article.excerpt,
        type: 'article',
        publishedTime: article.published_at,
        modifiedTime: article.updated_at,
        authors: article.authors?.name ? [article.authors.name] : [],
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
        languages: buildLanguageAlternates(`/${article.categories?.slug || 'news'}/${article.slug}`),
      },
      robots: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    }
  } catch {
    return {
      title: 'Article - NewsHarpal',
    }
  }
}

export default async function ArticlePage({ params }) {
  try {
    const supabase = await createClient()
    const { categorySlug, articleSlug } = params
    const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://newsharpal.com'

  // Fetch article
  const { data: article } = await supabase
    .from('articles')
    .select(`
      *,
      authors (id, slug, name, bio, avatar_url),
      categories (name, slug),
      article_tags (tags (id, name, slug))
    `)
    .eq('slug', articleSlug)
    .eq('status', 'published')
    .single()

  if (!article) {
    notFound()
  }

  if (article.categories?.slug && article.categories.slug !== categorySlug) {
    notFound()
  }

  // Related: same tags
  const tagIds = (article.article_tags || [])
    .map((at) => at.tags?.id)
    .filter(Boolean)

  const [
    { data: relatedByCategory },
    { data: latestArticles },
    { data: engagementRows },
    { data: trendingCandidates },
    { data: categories },
    { data: linkRows },
  ] = await Promise.all([
    supabase
      .from('articles')
      .select('id, title, slug, excerpt, featured_image_url, published_at, categories(slug), authors(name)')
      .eq('category_id', article.category_id)
      .eq('status', 'published')
      .neq('id', article.id)
      .order('published_at', { ascending: false })
      .limit(4),
    supabase
      .from('articles')
      .select('id, title, slug, excerpt, featured_image_url, published_at, categories(slug), authors(name)')
      .eq('status', 'published')
      .neq('id', article.id)
      .order('published_at', { ascending: false })
      .limit(10),
    supabase
      .from('article_engagement')
      .select('article_id, views, likes, shares')
      .limit(100),
    supabase
      .from('articles')
      .select('id, title, slug, excerpt, featured_image_url, published_at, categories(slug), authors(name)')
      .eq('status', 'published')
      .neq('id', article.id)
      .order('published_at', { ascending: false })
      .limit(20),
    supabase
      .from('categories')
      .select('*')
      .order('name'),
    tagIds.length > 0
      ? supabase
        .from('article_tags')
        .select('article_id')
        .neq('article_id', article.id)
        .in('tag_id', tagIds)
        .limit(20)
      : Promise.resolve({ data: [] }),
  ])

  let relatedByTag = []
  if (tagIds.length > 0 && (linkRows || []).length > 0) {
    const ids = [...new Set((linkRows || []).map((r) => r.article_id).filter(Boolean))]
    if (ids.length > 0) {
      const { data: taggedArticles } = await supabase
        .from('articles')
        .select('id, title, slug, excerpt, featured_image_url, published_at, categories(slug), authors(name)')
        .in('id', ids)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(4)
      relatedByTag = taggedArticles || []
    }
  }

  const relatedMap = new Map()
  ;[...(relatedByCategory || []), ...relatedByTag, ...(latestArticles || [])].forEach((item) => {
    if (!item?.id || item.id === article.id || relatedMap.has(item.id)) return
    relatedMap.set(item.id, item)
  })
  const relatedArticles = Array.from(relatedMap.values()).slice(0, 4)

  const scoreMap = new Map(
    (engagementRows || []).map((row) => [
      row.article_id,
      (row.views || 0) + (row.likes || 0) * 3 + (row.shares || 0) * 5,
    ])
  )

  const trendingArticles = (trendingCandidates || [])
    .map((item) => ({ ...item, _score: scoreMap.get(item.id) || 0 }))
    .sort((a, b) => b._score - a._score)
    .slice(0, 5)

  const articleUrl = `${siteUrl}/${article.categories?.slug || 'news'}/${article.slug}`
  const breadcrumbItems = [
    { label: article.categories?.name || 'News', href: `/category/${article.categories?.slug || 'news'}` },
    { label: article.title, href: `/${article.categories?.slug || 'news'}/${article.slug}` },
  ]

  const readingTimeMinutes = calculateReadingTime(article.content || '')
  const summaryPoints = generateSixtySecondSummary(article)
  const aeoSnapshot = generateAeoSnapshot(article)
  const articleKeywords = buildArticleKeywords(article)
  const keywordTopicLinks = keywordsToTopicLinks(articleKeywords)
  const safeArticleContent = applyLinkPolicyToHtml(article.content || '', {
    baseUrl: siteUrl,
    nofollowExternal: true,
  })
  const faqItems = [
    {
      question: `What is this article about?`,
      answer: article.excerpt || `This article covers ${article.title}.`,
    },
    {
      question: 'How long does this article take to read?',
      answer: `About ${readingTimeMinutes} minute${readingTimeMinutes > 1 ? 's' : ''}.`,
    },
  ]
  const schemas = generateArticleSchemas({
    article,
    articleUrl,
    readingTimeMinutes,
    faqItems,
    breadcrumbs: [
      { name: 'Home', url: siteUrl },
      { name: article.categories?.name || 'News', url: `${siteUrl}/category/${article.categories?.slug || 'news'}` },
      { name: article.title, url: articleUrl },
    ],
  })

    return (
    <>
      <StructuredData data={schemas.newsArticle} />
      <StructuredData data={schemas.blogPosting} />
      <StructuredData data={schemas.breadcrumbList} />
      <StructuredData data={schemas.faqPage} />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <PublicHeader categories={categories || []} />

        {/* Article Content */}
        <article className="w-full max-w-6xl mx-auto px-4 py-8">
          <Breadcrumb items={breadcrumbItems} />

          <Card className="p-8 md:p-12 dark:bg-gray-800 dark:border-gray-700">
            {/* Category Badge */}
            {article.categories && (
              <Link href={`/category/${article.categories.slug}`}>
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
                  Published {format(new Date(article.published_at), 'MMMM d, yyyy')} ({formatDistanceToNow(new Date(article.published_at), { addSuffix: true })})
                </time>
              </div>
              {article.updated_at !== article.published_at && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <time dateTime={article.updated_at}>
                    Updated {format(new Date(article.updated_at), 'MMMM d, yyyy')} ({formatDistanceToNow(new Date(article.updated_at), { addSuffix: true })})
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
            <ArticleSummary points={summaryPoints} />
            <section className="mb-6 p-5 rounded-xl border bg-amber-50/70 border-amber-100 dark:bg-amber-950/30 dark:border-amber-900/50">
              <h2 className="text-lg font-bold mb-3 text-amber-900 dark:text-amber-200">Quick Context</h2>
              <ul className="list-disc pl-5 space-y-1.5 text-sm text-amber-900/90 dark:text-amber-100/90">
                <li><strong>What changed:</strong> {aeoSnapshot.whatChanged}</li>
                <li><strong>Why it matters:</strong> {aeoSnapshot.whyItMatters}</li>
                <li><strong>Key context:</strong> {aeoSnapshot.keyContext}</li>
              </ul>
            </section>
            <ArticleEngagementBar articleId={article.id} articleUrl={articleUrl} articleTitle={article.title} />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {readingTimeMinutes} min read
            </p>
            <div
              className="article-content prose prose-lg dark:prose-invert max-w-none mb-8"
              dangerouslySetInnerHTML={{ __html: safeArticleContent }}
            />

            {/* In-Article Ad */}
            <InArticleAd />

            {/* Tags */}
            {article.article_tags && article.article_tags.length > 0 && (
              <div className="mt-12 pt-8 border-t dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase">Tagged</h3>
                <div className="flex flex-wrap gap-2">
                  {article.article_tags.map((at) => (
                    <Link key={at.tags.slug} href={`/tags/${at.tags.slug}`}>
                      <Badge variant="outline" className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                        {at.tags.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {keywordTopicLinks.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase">Related Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {keywordTopicLinks.map((item) => (
                    <Link key={item.slug} href={`/topic/${item.slug}`}>
                      <Badge variant="outline" className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                        {item.keyword}
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

          {/* You May Also Like */}
          {relatedArticles && relatedArticles.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6 dark:text-white">You May Also Like</h2>
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
                            sizes="(max-width: 768px) 100vw, 33vw"
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
                          <span>-</span>
                          <time>{format(new Date(related.published_at), 'MMM d, yyyy')}</time>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Trending Now */}
          {trendingArticles && trendingArticles.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6 dark:text-white">Trending Now</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {trendingArticles.map((trending) => (
                  <ArticleMiniCard key={trending.id} article={trending} compact />
                ))}
              </div>
            </div>
          )}

          {/* Latest News */}
          {latestArticles && latestArticles.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6 dark:text-white">Latest News</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {latestArticles.slice(0, 6).map((item) => (
                  <ArticleMiniCard key={item.id} article={item} compact />
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
  } catch (error) {
    console.error('Article page SSR failed:', error)
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-6xl mx-auto px-4 py-12">
          <p className="text-gray-700 dark:text-gray-300">Article is temporarily unavailable. Please try again.</p>
        </div>
      </div>
    )
  }
}
