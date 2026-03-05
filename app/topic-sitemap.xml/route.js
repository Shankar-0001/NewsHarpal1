import { createClient } from '@/lib/supabase/server'
import { absoluteUrl } from '@/lib/site-config'
import { extractTopicKeywords } from '@/lib/topic-utils'
import { urlsetXml, xmlResponse } from '@/lib/sitemap-utils'

export async function GET() {
  const supabase = await createClient()
  const { data: articles } = await supabase
    .from('articles')
    .select('title, excerpt, content, updated_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(300)

  const topics = extractTopicKeywords(articles || [], 80)
  const updatedAt = (articles || [])[0]?.updated_at || new Date().toISOString()

  const entries = topics.flatMap((topic) => [
    {
      loc: absoluteUrl(`/topic/${topic.slug}`),
      lastmod: new Date(updatedAt).toISOString(),
      changefreq: 'weekly',
      priority: 0.6,
    },
    {
      loc: absoluteUrl(`/trending/${topic.slug}`),
      lastmod: new Date(updatedAt).toISOString(),
      changefreq: 'daily',
      priority: 0.6,
    },
    {
      loc: absoluteUrl(`/explained/${topic.slug}`),
      lastmod: new Date(updatedAt).toISOString(),
      changefreq: 'weekly',
      priority: 0.6,
    },
  ])

  return xmlResponse(urlsetXml(entries))
}
