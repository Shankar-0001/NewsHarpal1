import { createClient } from '@/lib/supabase/server'
import { sitemapIndexXml, xmlResponse } from '@/lib/sitemap-utils'

const PAGE_SIZE = 5000

export async function GET() {
  const supabase = await createClient()
  const { count } = await supabase
    .from('articles')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published')

  const totalPages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE))
  const paths = Array.from({ length: totalPages }, (_, idx) => `/sitemaps/articles/${idx + 1}.xml`)
  return xmlResponse(sitemapIndexXml(paths))
}

