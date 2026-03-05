import { createClient } from '@/lib/supabase/server'
import { absoluteUrl } from '@/lib/site-config'
import { urlsetXml, xmlResponse } from '@/lib/sitemap-utils'

export async function GET() {
  const supabase = await createClient()
  const { data: stories } = await supabase
    .from('web_stories')
    .select('slug, updated_at, created_at')
    .order('created_at', { ascending: false })
    .limit(1000)

  const entries = (stories || []).map((story) => ({
    loc: absoluteUrl(`/web-stories/${story.slug}`),
    lastmod: new Date(story.updated_at || story.created_at).toISOString(),
    changefreq: 'weekly',
    priority: 0.7,
  }))

  entries.unshift({
    loc: absoluteUrl('/web-stories'),
    lastmod: new Date().toISOString(),
    changefreq: 'daily',
    priority: 0.7,
  })

  return xmlResponse(urlsetXml(entries))
}
