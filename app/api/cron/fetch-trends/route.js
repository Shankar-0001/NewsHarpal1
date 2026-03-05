import { apiResponse } from '@/lib/api-utils'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchTrendingQueries } from '@/lib/trends-fetcher'

function isAuthorized(request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return true

  const authHeader = request.headers.get('authorization') || ''
  if (authHeader === `Bearer ${secret}`) return true

  // Vercel cron also sends this header.
  const vercelCron = request.headers.get('x-vercel-cron')
  return vercelCron === '1'
}

export async function GET(request) {
  try {
    if (!isAuthorized(request)) {
      return apiResponse(401, null, 'Unauthorized cron request')
    }

    const trends = await fetchTrendingQueries()
    if (!trends.length) {
      return apiResponse(200, { inserted: 0, updated: 0, total: 0, source: 'google-trends-rss-empty' }, null)
    }

    const admin = createAdminClient()
    const now = new Date().toISOString()
    const payload = trends.map((item, index) => ({
      keyword: item.keyword,
      slug: item.slug,
      search_volume: Math.max(1, trends.length - index),
      updated_at: now,
    }))

    const { error } = await admin
      .from('trending_topics')
      .upsert(payload, { onConflict: 'slug' })

    if (error) return apiResponse(500, null, error.message)

    return apiResponse(200, {
      inserted: payload.length,
      updated: payload.length,
      total: payload.length,
      source: 'google-trends-rss',
      fetched_at: now,
    }, null)
  } catch (error) {
    return apiResponse(500, null, error.message || 'Failed to fetch trends')
  }
}

