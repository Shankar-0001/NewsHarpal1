import { createClient } from '@/lib/supabase/server'
import { apiResponse } from '@/lib/api-utils'

const toNumber = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

async function getMetrics(supabase, articleId) {
  const { data } = await supabase
    .from('article_engagement')
    .select('views, likes, shares')
    .eq('article_id', articleId)
    .maybeSingle()

  return {
    views: toNumber(data?.views),
    likes: toNumber(data?.likes),
    shares: toNumber(data?.shares),
  }
}

async function getStoryMetrics(supabase, storyId) {
  const { data } = await supabase
    .from('web_story_engagement')
    .select('views, likes, shares')
    .eq('story_id', storyId)
    .maybeSingle()

  return {
    views: toNumber(data?.views),
    likes: toNumber(data?.likes),
    shares: toNumber(data?.shares),
  }
}

export async function GET(request) {
  try {
    const search = new URL(request.url).searchParams
    const entityId = search.get('id')
    const type = search.get('type') || 'article'
    if (!entityId) return apiResponse(400, null, 'id is required')

    const supabase = await createClient()
    const metrics = type === 'story'
      ? await getStoryMetrics(supabase, entityId)
      : await getMetrics(supabase, entityId)
    return apiResponse(200, { metrics }, null)
  } catch (error) {
    return apiResponse(500, null, error.message || 'Failed to fetch engagement')
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const entityId = body.id
    const action = body.action
    const type = body.type || 'article'

    if (!entityId) return apiResponse(400, null, 'id is required')
    if (!['view', 'like', 'share'].includes(action)) {
      return apiResponse(400, null, 'Invalid action')
    }

    const supabase = await createClient()
    const current = type === 'story'
      ? await getStoryMetrics(supabase, entityId)
      : await getMetrics(supabase, entityId)
    const next = {
      views: current.views + (action === 'view' ? 1 : 0),
      likes: current.likes + (action === 'like' ? 1 : 0),
      shares: current.shares + (action === 'share' ? 1 : 0),
    }

    const table = type === 'story' ? 'web_story_engagement' : 'article_engagement'
    const idField = type === 'story' ? 'story_id' : 'article_id'
    const { error } = await supabase
      .from(table)
      .upsert(
        {
          [idField]: entityId,
          ...next,
          updated_at: new Date().toISOString(),
        },
        { onConflict: idField }
      )

    if (error) return apiResponse(500, null, error.message)
    return apiResponse(200, { metrics: next }, null)
  } catch (error) {
    return apiResponse(500, null, error.message || 'Failed to update engagement')
  }
}
