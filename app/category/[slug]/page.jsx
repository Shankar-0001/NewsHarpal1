import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PublicHeader from '@/components/layout/PublicHeader'
import StructuredData from '@/components/seo/StructuredData'
import ArticleMiniCard from '@/components/content/ArticleMiniCard'
import Image from 'next/image'
import Link from 'next/link'
import { absoluteUrl } from '@/lib/site-config'
import { InArticleAd } from '@/components/ads/AdComponent'

export const revalidate = 600

export async function generateMetadata({ params }) {
  const supabase = await createClient()
  const { data: category } = await supabase.from('categories').select('name, slug').eq('slug', params.slug).maybeSingle()

  if (!category) return { title: 'Category Not Found | NewsHarpal' }
  const url = absoluteUrl(`/category/${category.slug}`)

  return {
    title: `${category.name} News Hub | NewsHarpal`,
    description: `Authority hub for ${category.name}: featured, trending, and latest stories.`,
    alternates: { canonical: url },
    openGraph: { title: `${category.name} News Hub`, description: `Top ${category.name} coverage.`, url, type: 'website' },
    twitter: { card: 'summary_large_image', title: `${category.name} News Hub`, description: `Top ${category.name} coverage.` },
  }
}

export default async function CategoryHubPage({ params }) {
  const supabase = await createClient()
  const adsEnabled = process.env.NEXT_PUBLIC_ADS_ENABLED === 'true'

  const [{ data: categories }, { data: category }] = await Promise.all([
    supabase.from('categories').select('id, name, slug').order('name'),
    supabase.from('categories').select('id, name, slug').eq('slug', params.slug).maybeSingle(),
  ])

  if (!category) notFound()

  const [{ data: articles }, { data: engagementRows }] = await Promise.all([
    supabase
      .from('articles')
      .select('id, title, slug, excerpt, featured_image_url, published_at, categories(name, slug), authors(name)')
      .eq('status', 'published')
      .eq('category_id', category.id)
      .order('published_at', { ascending: false })
      .limit(40),
    supabase.from('article_engagement').select('article_id, views, likes, shares').limit(800),
  ])

  const featured = (articles || [])[0]
  const scoreMap = new Map((engagementRows || []).map((row) => [row.article_id, (row.views || 0) + (row.likes || 0) * 3 + (row.shares || 0) * 5]))
  const trending = (articles || [])
    .map((item) => ({ ...item, _score: scoreMap.get(item.id) || 0 }))
    .sort((a, b) => b._score - a._score)
    .slice(0, 6)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category.name} category hub`,
    url: absoluteUrl(`/category/${category.slug}`),
    mainEntity: (articles || []).slice(0, 10).map((item) => ({
      '@type': 'NewsArticle',
      headline: item.title,
      url: absoluteUrl(`/${item.categories?.slug || 'news'}/${item.slug}`),
    })),
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <StructuredData data={jsonLd} />
      <PublicHeader categories={categories || []} />

      <main className="w-full max-w-6xl mx-auto px-4 py-12 md:py-16">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{category.name} Authority Hub</h1>

        {featured && (
          <section className="rounded-xl overflow-hidden bg-white dark:bg-gray-800 border dark:border-gray-700 mb-10">
            <div className="relative w-full aspect-[16/9]">
              {featured.featured_image_url && (
                <Image src={featured.featured_image_url} alt={featured.title} fill className="object-cover" priority sizes="100vw" />
              )}
            </div>
            <div className="p-6">
              <p className="text-sm text-blue-600 font-semibold mb-2">Featured Article</p>
              <Link href={`/${featured.categories?.slug || 'news'}/${featured.slug}`} className="text-2xl font-bold text-gray-900 dark:text-white hover:underline">{featured.title}</Link>
              <p className="text-gray-600 dark:text-gray-400 mt-2">{featured.excerpt}</p>
            </div>
          </section>
        )}

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Trending in {category.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trending.map((article) => <ArticleMiniCard key={article.id} article={article} compact />)}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Latest {category.name} Stories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(articles || []).slice(1, 10).map((article, idx) => (
              <div key={article.id} className="contents">
                <ArticleMiniCard article={article} />
                {adsEnabled && (idx + 1) % 4 === 0 && (
                  <div className="md:col-span-2 lg:col-span-3 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                    <InArticleAd />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
