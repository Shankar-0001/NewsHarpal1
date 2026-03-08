import { createClient } from '@/lib/supabase/server'
import { absoluteUrl } from '@/lib/site-config'
import { extractTopicKeywords } from '@/lib/topic-utils'
import { urlsetXml, xmlResponse } from '@/lib/sitemap-utils'

const PAGE_SIZE = 1200

function toPageNumber(raw) {
  const page = Number.parseInt(raw, 10)
  return Number.isFinite(page) && page > 0 ? page : 1
}

function buildTopicEntries(slug, lastmod, priority = 0.6) {
  return [
    {
      loc: absoluteUrl(`/topic/${slug}`),
      lastmod,
      changefreq: 'weekly',
      priority,
    },
    {
      loc: absoluteUrl(`/trending/${slug}`),
      lastmod,
      changefreq: 'daily',
      priority: Math.max(priority, 0.7),
    },
    {
      loc: absoluteUrl(`/explained/${slug}`),
      lastmod,
      changefreq: 'weekly',
      priority,
    },
  ]
}

export async function GET(_request, context) {
  const page = toPageNumber(context?.params?.page)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  const supabase = await createClient()

  const { data: trendRows } = await supabase
    .from('trending_topics')
    .select('slug, updated_at')
    .order('updated_at', { ascending: false })
    .range(from, to)

  const trendEntries = (trendRows || []).flatMap((row) =>
    buildTopicEntries(
      row.slug,
      new Date(row.updated_at || Date.now()).toISOString(),
      0.7
    )
  )

  // Add keyword-derived topic URLs on first page to keep discovery healthy even with sparse trend rows.
  let extractedEntries = []
  if (page === 1) {
    const { data: articles } = await supabase
      .from('articles')
      .select('title, excerpt, content, updated_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(400)

    const extracted = extractTopicKeywords(articles || [], 120)
    const updatedAt = new Date((articles || [])[0]?.updated_at || Date.now()).toISOString()
    extractedEntries = extracted.flatMap((item) => buildTopicEntries(item.slug, updatedAt, 0.6))
  }

  const dedup = new Map()
  ;[...trendEntries, ...extractedEntries].forEach((entry) => {
    if (!dedup.has(entry.loc)) dedup.set(entry.loc, entry)
  })

  return xmlResponse(urlsetXml([...dedup.values()]))
}
