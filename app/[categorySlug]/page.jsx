import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import PublicHeader from '@/components/layout/PublicHeader'
import Image from 'next/image'

export const dynamicParams = false // ensure static generation for known categories

export async function generateStaticParams() {
    const supabase = await createClient()
    const { data: categories } = await supabase.from('categories').select('slug')

    return categories?.map(c => ({ categorySlug: c.slug })) || []
}

export default async function CategoryPage({ params }) {
    const { categorySlug } = params
    const supabase = await createClient()

    // fetch category info (name)
    const { data: categories } = await supabase
        .from('categories')
        .select('name, slug')
        .eq('slug', categorySlug)
        .single()

    // fetch articles in this category
    const { data: articles } = await supabase
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

    if (!categories) {
        return <div className="container mx-auto py-12">Category not found.</div>
    }

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
                            <Link
                                key={article.id}
                                href={`/${article.categories?.slug}/${article.slug}`}
                            >
                                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full dark:bg-gray-800 dark:border-gray-700">
                                    <div className="flex flex-col md:flex-row">
                                        {article.featured_image_url && (
                                            <div className="relative w-full md:w-64 h-48 md:h-auto">
                                                <Image
                                                    src={article.featured_image_url}
                                                    alt={article.title}
                                                    fill
                                                    className="object-cover rounded-t-lg md:rounded-l-lg md:rounded-t-none"
                                                />
                                            </div>
                                        )}
                                        <CardContent className="flex-1 p-6">
                                            <div className="flex items-center gap-2 mb-3">
                                                {article.categories && (
                                                    <Badge variant="secondary" className="dark:bg-gray-700">
                                                        {article.categories.name}
                                                    </Badge>
                                                )}
                                            </div>
                                            <h3 className="text-xl font-bold mb-2 dark:text-white">
                                                {article.title}
                                            </h3>
                                            <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                                                {article.excerpt}
                                            </p>
                                            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4" />
                                                    <span>{article.authors?.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>
                                                        {formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </div>
                                </Card>
                            </Link>
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
