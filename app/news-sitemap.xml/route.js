import { createClient } from '@/lib/supabase/server'
import { absoluteUrl } from '@/lib/site-config'
import { urlsetXml, xmlResponse } from '@/lib/sitemap-utils'

export async function GET() {
  const supabase = await createClient()
  const { data: articles } = await supabase
    .from('articles')
    .select('slug, updated_at, published_at, categories(slug)')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(2000)

  const entries = (articles || []).map((a) => ({
    loc: absoluteUrl(`/${a.categories?.slug || 'news'}/${a.slug}`),
    lastmod: new Date(a.updated_at || a.published_at).toISOString(),
    changefreq: 'daily',
    priority: 0.8,
  }))

  return xmlResponse(urlsetXml(entries))
}
