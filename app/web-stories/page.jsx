import { createClient } from '@/lib/supabase/server'
import PublicHeader from '@/components/layout/PublicHeader'
import WebStoryCard from '@/components/content/WebStoryCard'
import StructuredData from '@/components/seo/StructuredData'
import { absoluteUrl, buildLanguageAlternates } from '@/lib/site-config'

export const revalidate = 600

export const metadata = {
  title: 'Top Web Stories | NewsHarpal',
  description: 'Visual and mobile-first Web Stories from NewsHarpal.',
  alternates: {
    canonical: absoluteUrl('/web-stories'),
    languages: buildLanguageAlternates('/web-stories'),
  },
  openGraph: { title: 'Top Web Stories | NewsHarpal', description: 'Visual stories from NewsHarpal.', url: absoluteUrl('/web-stories') },
  twitter: { card: 'summary_large_image', title: 'Top Web Stories | NewsHarpal', description: 'Visual stories from NewsHarpal.' },
}

export default async function WebStoriesPage() {
  const supabase = await createClient()
  const [{ data: categories }, { data: stories }] = await Promise.all([
    supabase.from('categories').select('id, name, slug').order('name'),
    supabase
      .from('web_stories')
      .select('id, title, slug, cover_image, created_at, authors(name), categories(name, slug)')
      .order('created_at', { ascending: false })
      .limit(30),
  ])

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Top Web Stories',
    url: absoluteUrl('/web-stories'),
    mainEntity: (stories || []).map((s) => ({ '@type': 'WebPage', name: s.title, url: absoluteUrl(`/web-stories/${s.slug}`) })),
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <StructuredData data={ld} />
      <PublicHeader categories={categories || []} />
      <main className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Top Web Stories</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Fast visual stories optimized for mobile discovery.</p>

        {(stories || []).length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {stories.map((story) => <WebStoryCard key={story.id} story={story} />)}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">No stories published yet.</p>
        )}
      </main>
    </div>
  )
}
