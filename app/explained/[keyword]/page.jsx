import { createClient } from '@/lib/supabase/server'
import { createClient as createPublicClient } from '@supabase/supabase-js'
import PublicHeader from '@/components/layout/PublicHeader'
import StructuredData from '@/components/seo/StructuredData'
import ArticleMiniCard from '@/components/content/ArticleMiniCard'
import { extractTopicKeywords, matchesKeyword } from '@/lib/topic-utils'
import { absoluteUrl } from '@/lib/site-config'
import { notFound } from 'next/navigation'
import { stripHtml } from '@/lib/content-utils'
import Link from 'next/link'

export const revalidate = 1200

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
  const url = absoluteUrl(`/explained/${params.keyword}`)
  return {
    title: `${keyword} Explained | NewsHarpal`,
    description: `Simple explainers and latest context for ${keyword}, with linked source articles.`,
    alternates: { canonical: url },
    openGraph: { title: `${keyword} Explained`, description: `Explainers for ${keyword}.`, url, type: 'article' },
    twitter: { card: 'summary_large_image', title: `${keyword} Explained`, description: `Explainers for ${keyword}.` },
  }
}

function makeExplainers(articles, keyword) {
  return articles.slice(0, 4).map((a) => {
    const sentences = stripHtml(a.content || a.excerpt || '')
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter(Boolean)
    return {
      title: a.title,
      point: sentences.find((s) => s.toLowerCase().includes(keyword.toLowerCase())) || sentences[0] || a.excerpt || a.title,
      slug: a.slug,
      categorySlug: a.categories?.slug || 'news',
    }
  })
}

export default async function ExplainedKeywordPage({ params }) {
  const keyword = decodeURIComponent(params.keyword).replace(/-/g, ' ').trim()
  const supabase = await createClient()

  const [{ data: categories }, { data: articles }, { data: engagementRows }] = await Promise.all([
    supabase.from('categories').select('id, name, slug').order('name'),
    supabase
      .from('articles')
      .select('id, title, slug, excerpt, content, featured_image_url, published_at, categories(name, slug)')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(100),
    supabase.from('article_engagement').select('article_id, views, likes, shares').limit(500),
  ])

  const matched = (articles || []).filter((a) => matchesKeyword(a, keyword))
  if (matched.length === 0) notFound()

  const explainers = makeExplainers(matched, keyword)
  const scoreMap = new Map((engagementRows || []).map((row) => [row.article_id, (row.views || 0) + (row.likes || 0) * 3 + (row.shares || 0) * 5]))
  const trending = [...matched]
    .map((item) => ({ ...item, _score: scoreMap.get(item.id) || 0 }))
    .sort((a, b) => b._score - a._score)
    .slice(0, 6)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: explainers.map((item) => ({
      '@type': 'Question',
      name: item.title,
      acceptedAnswer: { '@type': 'Answer', text: item.point },
    })),
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <StructuredData data={jsonLd} />
      <PublicHeader categories={categories || []} />
      <main className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">{keyword} Explained</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Fast context and explainers linked to full coverage.</p>

        <section className="mb-10 rounded-xl bg-white dark:bg-gray-800 p-6 border dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Key Explainers</h2>
          <ul className="space-y-3">
            {explainers.map((item) => (
              <li key={item.slug} className="text-gray-700 dark:text-gray-300">
                <Link className="font-semibold text-blue-600 dark:text-blue-400 hover:underline" href={`/${item.categorySlug}/${item.slug}`}>{item.title}</Link>
                <p className="text-sm mt-1">{item.point}</p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Trending Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trending.map((article) => <ArticleMiniCard key={article.id} article={article} compact />)}
          </div>
        </section>
      </main>
    </div>
  )
}
