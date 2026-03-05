import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PublicHeader from '@/components/layout/PublicHeader'
import ArticleCard from './ArticleCard'
import { InArticleAd } from '@/components/ads/AdComponent'

export const revalidate = 120
export const dynamicParams = true

const PAGE_SIZE = 12

export async function generateStaticParams() {
  try {
    // generateStaticParams runs outside request scope, so avoid cookie-bound client
    const { createClient: createPublicClient } = await import('@supabase/supabase-js')
    const supabase = createPublicClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    const { data: categories } = await supabase.from('categories').select('slug')
    return categories?.map((c) => ({ categorySlug: c.slug })) || []
  } catch {
    return []
  }
}

export async function generateMetadata({ params }) {
  try {
    const supabase = await createClient()
    const { data: category } = await supabase
      .from('categories')
      .select('name, slug')
      .eq('slug', params.categorySlug)
      .single()

    if (!category) return { title: 'Category not found' }

    return {
      title: `${category.name} - NewsHarpal`,
      description: `Latest articles in ${category.name}.`,
    }
  } catch {
    return {
      title: 'Category - NewsHarpal',
      description: 'Latest category news.',
    }
  }
}

export default async function CategoryPage({ params, searchParams }) {
  const adsEnabled = process.env.NEXT_PUBLIC_ADS_ENABLED === 'true'
  const categorySlug = params.categorySlug
  const page = Math.max(1, parseInt(searchParams?.page || '1', 10))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()

  try {
    const { data: category, error: catError } = await supabase
      .from('categories')
      .select('id, name, slug')
      .eq('slug', categorySlug)
      .single()

    if (catError || !category) {
      notFound()
    }

    const { data: articles, count } = await supabase
      .from('articles')
      .select(
        `
        id,
        title,
        slug,
        excerpt,
        featured_image_url,
        published_at,
        categories (name, slug),
        authors (name, slug)
      `,
        { count: 'exact' }
      )
      .eq('status', 'published')
      .eq('category_id', category.id)
      .order('published_at', { ascending: false })
      .range(from, to)

    const { data: allCategories } = await supabase
      .from('categories')
      .select('id, name, slug')
      .order('name')

    const totalPages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE))

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <PublicHeader categories={allCategories || []} />
        <div className="w-full max-w-6xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">{category.name}</h1>

          {articles && articles.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {articles.map((article, idx) => (
                  <div key={article.id} className="contents">
                    <ArticleCard article={article} />
                    {adsEnabled && (idx + 1) % 4 === 0 && (
                      <div className="md:col-span-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                        <InArticleAd />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-between text-sm">
                  {page > 1 ? (
                    <a href={`/${categorySlug}?page=${page - 1}`} className="text-blue-600 hover:underline">
                      Previous
                    </a>
                  ) : (
                    <span className="text-gray-400">Previous</span>
                  )}

                  <span className="text-gray-600 dark:text-gray-400">Page {page} of {totalPages}</span>

                  {page < totalPages ? (
                    <a href={`/${categorySlug}?page=${page + 1}`} className="text-blue-600 hover:underline">
                      Next
                    </a>
                  ) : (
                    <span className="text-gray-400">Next</span>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No articles in this category yet.</p>
          )}
        </div>
      </div>
    )
  } catch (error) {
    if (error?.digest === 'NEXT_NOT_FOUND') {
      throw error
    }
    console.error('Category page SSR failed:', error)
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-6xl mx-auto px-4 py-12">
          <p className="text-gray-700 dark:text-gray-300">Category is temporarily unavailable. Please try again.</p>
        </div>
      </div>
    )
  }
}
