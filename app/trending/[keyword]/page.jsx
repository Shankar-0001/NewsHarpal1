import { createClient } from '@/lib/supabase/server'
import { createClient as createPublicClient } from '@supabase/supabase-js'
import PublicHeader from '@/components/layout/PublicHeader'
import StructuredData from '@/components/seo/StructuredData'
import ArticleMiniCard from '@/components/content/ArticleMiniCard'
import { extractTopicKeywords, matchesKeyword } from '@/lib/topic-utils'
import { absoluteUrl } from '@/lib/site-config'
import { notFound } from 'next/navigation'

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

    return extractTopicKeywords(articles || [], 40).map((item) => ({ keyword: item.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }) {
  const keyword = decodeURIComponent(params.keyword).replace(/-/g, ' ')
  const url = absoluteUrl(`/trending/${params.keyword}`)
  return {
    title: `Trending ${keyword} News | NewsHarpal`,
    description: `Live trending stories for ${keyword} ranked by views, likes, and shares.`,
    alternates: { canonical: url },
    openGraph: { title: `Trending ${keyword} News`, description: `Top engagement stories about ${keyword}.`, url, type: 'website' },
    twitter: { card: 'summary_large_image', title: `Trending ${keyword} News`, description: `Top engagement stories about ${keyword}.` },
  }
}

export default async function TrendingKeywordPage({ params }) {
  const keyword = decodeURIComponent(params.keyword).replace(/-/g, ' ').trim()
  const supabase = await createClient()

  const [{ data: categories }, { data: articles }, { data: engagementRows }] = await Promise.all([
    supabase.from('categories').select('id, name, slug').order('name'),
    supabase
      .from('articles')
      .select('id, title, slug, excerpt, content, featured_image_url, published_at, categories(name, slug), authors(name)')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(120),
    supabase.from('article_engagement').select('article_id, views, likes, shares').limit(1000),
  ])

  const filtered = (articles || []).filter((a) => matchesKeyword(a, keyword))
  if (filtered.length === 0) notFound()

  const scoreMap = new Map((engagementRows || []).map((row) => [row.article_id, (row.views || 0) + (row.likes || 0) * 3 + (row.shares || 0) * 5]))
  const ranked = filtered
    .map((a) => ({ ...a, _score: scoreMap.get(a.id) || 0 }))
    .sort((a, b) => b._score - a._score)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Trending ${keyword} stories`,
    itemListElement: ranked.slice(0, 15).map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: absoluteUrl(`/${item.categories?.slug || 'news'}/${item.slug}`),
      name: item.title,
    })),
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <StructuredData data={jsonLd} />
      <PublicHeader categories={categories || []} />
      <main className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Trending: {keyword}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Ranked by engagement score (views + likes*3 + shares*5).</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ranked.slice(0, 12).map((article) => <ArticleMiniCard key={article.id} article={article} />)}
        </div>
      </main>
    </div>
  )
}
