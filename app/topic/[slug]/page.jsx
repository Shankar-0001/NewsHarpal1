import { createClient } from '@/lib/supabase/server'
import { createClient as createPublicClient } from '@supabase/supabase-js'
import PublicHeader from '@/components/layout/PublicHeader'
import StructuredData from '@/components/seo/StructuredData'
import ArticleMiniCard from '@/components/content/ArticleMiniCard'
import { extractTopicKeywords, matchesKeyword } from '@/lib/topic-utils'
import { absoluteUrl, SITE_URL, slugFromText } from '@/lib/site-config'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const revalidate = 900

export async function generateStaticParams() {
  try {
    const supabase = createPublicClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    const { data: articles } = await supabase
      .from('articles')
      .select('title, excerpt, content')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(200)

    return extractTopicKeywords(articles || [], 60).map((item) => ({ slug: item.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }) {
  const keyword = decodeURIComponent(params.slug).replace(/-/g, ' ')
  const url = absoluteUrl(`/topic/${params.slug}`)
  return {
    title: `${keyword} News, Trends and Analysis | NewsHarpal`,
    description: `Latest ${keyword} news, explainers, and trending coverage curated by NewsHarpal.`,
    alternates: { canonical: url },
    openGraph: {
      title: `${keyword} News, Trends and Analysis`,
      description: `Latest ${keyword} coverage and internal recommendations.`,
      url,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${keyword} News, Trends and Analysis`,
      description: `Latest ${keyword} coverage and internal recommendations.`,
    },
  }
}

export default async function TopicPage({ params }) {
  const keyword = decodeURIComponent(params.slug).replace(/-/g, ' ').trim()
  const supabase = await createClient()

  const [{ data: categories }, { data: latestArticles }, { data: engagementRows }] = await Promise.all([
    supabase.from('categories').select('id, name, slug').order('name'),
    supabase
      .from('articles')
      .select('id, title, slug, excerpt, content, featured_image_url, published_at, categories(name, slug), authors(name)')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(80),
    supabase.from('article_engagement').select('article_id, views, likes, shares').limit(500),
  ])

  const matched = (latestArticles || []).filter((a) => matchesKeyword(a, keyword))
  if (matched.length === 0) {
    notFound()
  }

  const scoreMap = new Map((engagementRows || []).map((row) => [row.article_id, (row.views || 0) + (row.likes || 0) * 3 + (row.shares || 0) * 5]))
  const trending = [...matched]
    .map((a) => ({ ...a, _score: scoreMap.get(a.id) || 0 }))
    .sort((a, b) => b._score - a._score)
    .slice(0, 6)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${keyword} topic page`,
    url: absoluteUrl(`/topic/${params.slug}`),
    about: keyword,
    isPartOf: SITE_URL,
    mainEntity: matched.slice(0, 10).map((item) => ({
      '@type': 'NewsArticle',
      headline: item.title,
      url: absoluteUrl(`/${item.categories?.slug || 'news'}/${item.slug}`),
    })),
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <StructuredData data={jsonLd} />
      <PublicHeader categories={categories || []} />
      <main className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">{keyword} Topic Hub</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Curated coverage, trending stories, and explainers for {keyword}.</p>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Related Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matched.slice(0, 9).map((article) => <ArticleMiniCard key={article.id} article={article} />)}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Trending on {keyword}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trending.map((article) => <ArticleMiniCard key={article.id} article={article} compact />)}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Internal Links</h2>
          <div className="flex flex-wrap gap-2">
            <Link href="/" className="text-blue-600 hover:underline">Home</Link>
            <Link href={`/trending/${slugFromText(keyword)}`} className="text-blue-600 hover:underline">Trending {keyword}</Link>
            <Link href={`/explained/${slugFromText(keyword)}`} className="text-blue-600 hover:underline">{keyword} Explained</Link>
          </div>
        </section>
      </main>
    </div>
  )
}
