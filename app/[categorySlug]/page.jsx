import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PublicHeader from '@/components/layout/PublicHeader'
import ArticleCard from './ArticleCard'

// ISR: refresh category pages every minute
export const revalidate = 60

export const dynamicParams = true // allow on‑demand generation when new categories are added

export async function generateStaticParams() {
    try {
        const supabase = await createClient()
        const { data: categories } = await supabase.from('categories').select('slug')
        return categories?.map(c => ({ categorySlug: c.slug })) || []
    } catch (error) {
        console.error('Error generating static params:', error)
        return []
    }
}

export async function generateMetadata({ params }) {
    const supabase = await createClient()
    const { data: category } = await supabase
        .from('categories')
        .select('name, slug')
        .eq('slug', params.categorySlug)
        .single()

    if (!category) return { title: 'Category not found' }

    return {
        title: `${category.name} – NewsHarpal`,
        description: `Latest articles in the ${category.name} category.`,
        openGraph: {
            title: `${category.name} – NewsHarpal`,
            description: `Latest articles in the ${category.name} category.`,
            type: 'website',
        },
    }
}

export default async function CategoryPage({ params }) {
    const { categorySlug } = params
    const supabase = await createClient()

    // 1. fetch category record by slug
    const { data: category, error: catError } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('slug', categorySlug)
        .single()

    if (catError || !category) {
        notFound()
    }

    // 2. query articles belonging to that category only
    const { data: articles, error: artError } = await supabase
        .from('articles')
        .select(`
      *,
      authors (name, slug),
      categories (name, slug)
    `)
        .eq('status', 'published')
        .eq('category_id', category.id)
        .order('published_at', { ascending: false })

    if (artError) {
        console.error('Error loading articles for category', categorySlug, artError)
        // we could throw to show 500 page, but for now render empty list
    }

    // 3. header categories (small subset)
    const { data: allCategories } = await supabase
        .from('categories')
        .select('id,name,slug')
        .order('name') // fetch all categories for header

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <PublicHeader categories={allCategories || []} />
            <div className="container mx-auto px-4 py-12">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
                    {category.name}
                </h1>

                {articles && articles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {articles.map((article) => (
                            <ArticleCard key={article.id} article={article} />
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-600 dark:text-gray-400">
                        No articles in this category yet.
                    </p>
                )}
            </div>
        </div>
    )
}
