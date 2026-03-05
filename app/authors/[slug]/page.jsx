import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Calendar } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import Image from 'next/image'
import PublicHeader from '@/components/layout/PublicHeader'

export default async function AuthorProfilePage({ params }) {
    try {
        const supabase = await createClient()
        const { slug } = params

    // Get author by slug or id
    const { data: author, error: authorError } = await supabase
        .from('authors')
        .select('*')
        .or(`slug.eq.${slug},id.eq.${slug}`)
        .single()

        if (authorError || !author) {
            notFound()
        }

    // Get all articles by this author
    const { data: articles } = await supabase
        .from('articles')
        .select(`
            *,
            categories (name, slug),
            authors (name)
        `)
        .eq('author_id', author.id)
        .eq('status', 'published')
        .order('published_at', { ascending: false })

    const { data: categories } = await supabase
        .from('categories')
        .select('id, name, slug')
        .order('name')

        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <PublicHeader categories={categories || []} />
                <div className="container mx-auto px-4 max-w-6xl py-12">
                {/* Author Header */}
                <Card className="mb-8 dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader className="text-center py-12">
                        <div className="flex flex-col items-center">
                            <Avatar className="h-32 w-32 mb-4" suppressHydrationWarning>
                                <AvatarImage src={author.avatar_url} />
                                <AvatarFallback className="text-2xl">
                                    {author.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                            </Avatar>
                            <h1 className="text-4xl font-bold mb-2 dark:text-white">{author.name}</h1>
                            {author.title && (
                                <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">{author.title}</p>
                            )}
                            {author.bio && (
                                <p className="text-gray-700 dark:text-gray-300 max-w-2xl text-center mb-4">
                                    {author.bio}
                                </p>
                            )}
                            {author.email && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {author.email}
                                </p>
                            )}
                            {author.social_links && Object.keys(author.social_links).length > 0 && (
                                <div className="flex gap-4 mt-4">
                                    {author.social_links.twitter && (
                                        <a
                                            href={author.social_links.twitter}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                            Twitter
                                        </a>
                                    )}
                                    {author.social_links.linkedin && (
                                        <a
                                            href={author.social_links.linkedin}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                            LinkedIn
                                        </a>
                                    )}
                                    {author.social_links.website && (
                                        <a
                                            href={author.social_links.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                            Website
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardHeader>
                </Card>

                {/* Articles Section */}
                <div>
                    <h2 className="text-3xl font-bold mb-6 dark:text-white">
                        Articles by {author.name}
                    </h2>

                    {articles.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {articles.map((article) => (
                                <Link
                                    key={article.id}
                                    href={`/${article.categories?.slug || 'news'}/${article.slug}`}
                                >
                                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full dark:bg-gray-800 dark:border-gray-700">
                                        {article.featured_image_url && (
                                            <div className="relative w-full aspect-video overflow-hidden rounded-t-lg">
                                                <Image
                                                    src={article.featured_image_url}
                                                    alt={article.title}
                                                    fill
                                                    className="object-cover"
                                                    sizes="(max-width: 768px) 100vw, 50vw"
                                                />
                                            </div>
                                        )}
                                        <CardContent className="p-4">
                                            {article.categories && (
                                                <Badge variant="secondary" className="mb-2">
                                                    {article.categories.name}
                                                </Badge>
                                            )}
                                            <h3 className="font-bold text-lg mb-2 line-clamp-2 dark:text-white">
                                                {article.title}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                                                {article.excerpt}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                                                <Calendar className="h-3 w-3" />
                                                <time>{format(new Date(article.published_at), 'MMM d, yyyy')}</time>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <Card className="p-8 text-center dark:bg-gray-800 dark:border-gray-700">
                            <p className="text-gray-500 dark:text-gray-400">
                                No published articles yet from this author
                            </p>
                        </Card>
                    )}
                </div>
                </div>
            </div>
        )
    } catch (error) {
        console.error('Author page SSR failed:', error)
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="container mx-auto px-4 py-12">
                    <p className="text-gray-700 dark:text-gray-300">Author profile is temporarily unavailable.</p>
                </div>
            </div>
        )
    }
}
