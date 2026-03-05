import { createClient } from '@/lib/supabase/server'
import { absoluteUrl } from '@/lib/site-config'
import { urlsetXml, xmlResponse } from '@/lib/sitemap-utils'

export async function GET() {
  const supabase = await createClient()
  const [{ data: articles }, { data: trendRows }] = await Promise.all([
    supabase
      .from('articles')
      .select('slug, updated_at, published_at, categories(slug)')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(2000),
    supabase
      .from('trending_topics')
      .select('slug, updated_at')
      .order('updated_at', { ascending: false })
      .limit(500),
  ])

  const entries = (articles || []).map((a) => ({
    loc: absoluteUrl(`/${a.categories?.slug || 'news'}/${a.slug}`),
    lastmod: new Date(a.updated_at || a.published_at).toISOString(),
    changefreq: 'daily',
    priority: 0.8,
  }))

  const trendingEntries = (trendRows || []).map((row) => ({
    loc: absoluteUrl(`/trending/${row.slug}`),
    lastmod: new Date(row.updated_at || Date.now()).toISOString(),
    changefreq: 'daily',
    priority: 0.7,
  }))

  return xmlResponse(urlsetXml([...entries, ...trendingEntries]))
}
