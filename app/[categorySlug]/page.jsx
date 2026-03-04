import { createClient } from '@/lib/supabase/server'
import PublicHeader from '@/components/layout/PublicHeader'
import ArticleCard from './ArticleCard'

export const dynamicParams = true // allow on-demand generation for unknown categories

export async function generateStaticParams() {
    try {
        const supabase = await createClient()
        const { data: categories } = await supabase.from('categories').select('slug')
        return categories?.map(c => ({ categorySlug: c.slug })) || []
    } catch (error) {
        console.error('Error generating static params:', error)
        return [] // if fetch fails during build, pages generate on-demand
    }
}

export default async function CategoryPage({ params }) {
    const { categorySlug } = params
    const supabase = await createClient()

    // fetch category info (name)
    const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('name, slug')
        .eq('slug', categorySlug)
        .single()

    if (catError || !categories) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="container mx-auto py-12 text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Category not found</h1>
                    <p className="text-gray-600 dark:text-gray-400">The category you are looking for does not exist.</p>
                </div>
            </div>
        )
    }

    // fetch articles in this category
    const { data: articles, error: artError } = await supabase
        .from('articles')
        .select(`
      *,
      authors (name),
      categories (name, slug)
    `)
        .eq('status', 'published')
        .eq('categories.slug', categorySlug)
        .order('published_at', { ascending: false })

    // also get categories for header
    const { data: allCategories } = await supabase
        .from('categories')
        .select('*')
        .limit(6)

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <PublicHeader categories={allCategories || []} />
            <div className="container mx-auto px-4 py-12">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
                    {categories.name}
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
