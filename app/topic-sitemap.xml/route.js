import { createClient } from '@/lib/supabase/server'
import { sitemapIndexXml, xmlResponse } from '@/lib/sitemap-utils'

const PAGE_SIZE = 1200

export async function GET() {
  const supabase = await createClient()
  const { count } = await supabase
    .from('trending_topics')
    .select('slug', { count: 'exact', head: true })

  const totalPages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE))
  const paths = Array.from({ length: totalPages }, (_, idx) => `/sitemaps/topics/${idx + 1}.xml`)
  return xmlResponse(sitemapIndexXml(paths))
}

