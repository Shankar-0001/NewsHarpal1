import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, User, TrendingUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { HeaderAd } from '@/components/ads/AdComponent'
import StructuredData, { OrganizationSchema, WebSiteSchema } from '@/components/seo/StructuredData'
import PublicHeader from '@/components/layout/PublicHeader'
import BreakingNewsTicker from '@/components/common/BreakingNewsTicker'
import Image from 'next/image'

// Revalidate homepage every 10 minutes (ISR)
export const revalidate = 600

export const metadata = {
  title: 'NewsHarpal - Latest News and Insights',
  description: 'Your source for the latest news, trending stories, and expert insights across multiple categories.',
  openGraph: {
    title: 'NewsHarpal - Latest News and Insights',
    description: 'Your source for the latest news, trending stories, and expert insights.',
    type: 'website',
  },
}

export default async function HomePage() {
  const supabase = await createClient()

  // Get published articles
  const { data: articles } = await supabase
    .from('articles')
    .select(`
      *,
      authors (name),
      categories (name, slug)
    `)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(12)

  // Get trending articles (most recent)
  const { data: trendingArticles } = await supabase
    .from('articles')
    .select(`
      *,
      authors (name),
      categories (name, slug)
    `)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(5)

  // Get breaking news
  const { data: breakingNews } = await supabase
    .from('articles')
    .select('id, title, slug, categories(slug)')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(5)

  // Get categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name') // show all categories alphabetically

  const featuredArticle = articles?.[0]

  return (
    <>
      <StructuredData data={OrganizationSchema()} />
      <StructuredData data={WebSiteSchema()} />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <PublicHeader categories={categories || []} />

        {/* Breaking News Ticker */}
        {breakingNews && breakingNews.length > 0 && (
          <BreakingNewsTicker news={breakingNews} />
        )}

        {/* Header Ad */}
        <div className="container mx-auto px-4 py-4">
          <HeaderAd />
        </div>

        {/* Hero Section with Featured Article */}
        {featuredArticle && (
          <div className="bg-gradient-to-b from-blue-600 to-blue-800 dark:from-blue-900 dark:to-gray-900 text-white py-12">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  {featuredArticle.categories && (
                    <Badge variant="secondary" className="mb-4">
                      {featuredArticle.categories.name}
                    </Badge>
                  )}
                  <h1 className="text-4xl md:text-5xl font-bold mb-4">
                    {featuredArticle.title}
                  </h1>
                  <p className="text-xl text-blue-100 dark:text-gray-300 mb-6">
                    {featuredArticle.excerpt}
                  </p>
                  <div className="flex items-center gap-6 text-blue-100 dark:text-gray-400 mb-6">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{featuredArticle.authors?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {formatDistanceToNow(new Date(featuredArticle.published_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/${featuredArticle.categories?.slug}/${featuredArticle.slug}`}
                  >
                    <Button size="lg" variant="secondary">
                      Read Article
                    </Button>
                  </Link>
                </div>
                {featuredArticle.featured_image_url && (
                  <div className="relative h-96 rounded-lg overflow-hidden shadow-2xl">
                    <Image
                      src={featuredArticle.featured_image_url}
                      alt={featuredArticle.title}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Articles Column */}
            <div className="lg:col-span-2">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Latest Articles</h2>
              </div>

              {articles && articles.length > 0 ? (
                <div className="space-y-6">
                  {articles.slice(1).map((article) => (
                    <Link
                      key={article.id}
                      href={`/${article.categories?.slug || 'news'}/${article.slug}`}
                    >
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer dark:bg-gray-800 dark:border-gray-700">
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
                            <h3 className="text-xl font-bold mb-2 dark:text-white">{article.title}</h3>
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
                <div className="text-center py-12">
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    No articles published yet. Check back soon!
                  </p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Trending Articles */}
              <Card className="mb-6 dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-5 w-5 text-orange-500" />
                    <h3 className="text-xl font-bold dark:text-white">Trending Now</h3>
                  </div>
                  <div className="space-y-4">
                    {trendingArticles?.slice(0, 5).map((article, index) => (
                      <Link
                        key={article.id}
                        href={`/${article.categories?.slug || 'news'}/${article.slug}`}
                        className="block group"
                      >
                        <div className="flex gap-3">
                          <span className="text-2xl font-bold text-gray-300 dark:text-gray-600">
                            {(index + 1).toString().padStart(2, '0')}
                          </span>
                          <div>
                            <h4 className="font-semibold text-sm group-hover:text-blue-600 dark:text-gray-200 dark:group-hover:text-blue-400 line-clamp-2">
                              {article.title}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Categories */}
              <Card className="mb-6 dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 dark:text-white">Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {categories?.map(category => (
                      <Link key={category.id} href={`/category/${category.slug}`}>
                        <Badge variant="outline" className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300">
                          {category.name}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Sidebar Ad */}
              {/* <SidebarAd /> */}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-900 dark:bg-black text-white mt-20">
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">NewsCMS</h3>
                <p className="text-gray-400">Your trusted source for news and insights.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Quick Links</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="/" className="hover:text-white">Home</Link></li>
                  <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Categories</h4>
                <ul className="space-y-2 text-gray-400">
                  {categories?.slice(0, 4).map(category => (
                    <li key={category.id}>
                      <Link href={`/category/${category.slug}`} className="hover:text-white">
                        {category.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Legal</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              <p>© 2025 NewsCMS. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}