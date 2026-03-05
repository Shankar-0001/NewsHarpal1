import { createClient } from '@/lib/supabase/server'
import { apiResponse } from '@/lib/api-utils'

const sanitizeNumber = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : 0)

async function getCurrentMetrics(supabase, articleId) {
  const { data } = await supabase
    .from('article_engagement')
    .select('views, likes, shares')
    .eq('article_id', articleId)
    .maybeSingle()

  return {
    views: sanitizeNumber(data?.views),
    likes: sanitizeNumber(data?.likes),
    shares: sanitizeNumber(data?.shares),
  }
}

export async function GET(_request, { params }) {
  try {
    const supabase = await createClient()
    const articleId = params?.id
    if (!articleId) return apiResponse(400, null, 'Article ID is required')

    const metrics = await getCurrentMetrics(supabase, articleId)
    return apiResponse(200, { metrics }, null)
  } catch (error) {
    return apiResponse(500, null, error.message || 'Failed to load engagement')
  }
}

export async function POST(request, { params }) {
  try {
    const supabase = await createClient()
    const articleId = params?.id
    if (!articleId) return apiResponse(400, null, 'Article ID is required')

    const { action } = await request.json()
    if (!['view', 'like', 'share'].includes(action)) {
      return apiResponse(400, null, 'Invalid action')
    }

    const current = await getCurrentMetrics(supabase, articleId)
    const next = {
      views: current.views + (action === 'view' ? 1 : 0),
      likes: current.likes + (action === 'like' ? 1 : 0),
      shares: current.shares + (action === 'share' ? 1 : 0),
    }

    const { error } = await supabase
      .from('article_engagement')
      .upsert(
        {
          article_id: articleId,
          ...next,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'article_id' }
      )

    if (error) return apiResponse(500, null, error.message)
    return apiResponse(200, { metrics: next }, null)
  } catch (error) {
    return apiResponse(500, null, error.message || 'Failed to update engagement')
  }
}
