import { createClient } from '@/lib/supabase/server'
import { apiResponse } from '@/lib/api-utils'
import { requireAuth, getUserAuthorId } from '@/lib/auth-utils'
import { slugFromText } from '@/lib/site-config'

function normalizeSlides(slides) {
  if (!Array.isArray(slides)) return []
  return slides
    .map((slide) => ({
      image: slide?.image || '',
      headline: slide?.headline || '',
      description: slide?.description || '',
      relatedArticleUrl: slide?.relatedArticleUrl || '',
      cta_text: slide?.cta_text || '',
      cta_url: slide?.cta_url || '',
      whatsapp_group_url: slide?.whatsapp_group_url || '',
      seo_description: slide?.seo_description || '',
    }))
    .filter((slide) => slide.image && slide.headline)
}

async function canMutateStory(supabase, storyId, user) {
  if (user.role === 'admin') return true
  const authorId = await getUserAuthorId(user.userId)
  if (!authorId) return false

  const { data: story } = await supabase
    .from('web_stories')
    .select('author_id')
    .eq('id', storyId)
    .maybeSingle()

  return story?.author_id === authorId
}

export async function GET(_request, { params }) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('web_stories')
      .select('id, title, slug, cover_image, slides, author_id, category_id, tags, related_article_slug, cta_text, cta_url, whatsapp_group_url, ad_slot, seo_description, created_at, updated_at, authors(name, slug), categories(name, slug)')
      .eq('id', params.id)
      .maybeSingle()

    if (error) return apiResponse(500, null, error.message)
    if (!data) return apiResponse(404, null, 'Story not found')
    return apiResponse(200, { story: data })
  } catch (error) {
    return apiResponse(500, null, error.message || 'Failed to load story')
  }
}

export async function PATCH(request, { params }) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()

    const allowed = await canMutateStory(supabase, params.id, user)
    if (!allowed) return apiResponse(403, null, 'Forbidden')

    const payload = await request.json()
    const updates = {
      updated_at: new Date().toISOString(),
    }

    if (typeof payload.title === 'string' && payload.title.trim()) {
      updates.title = payload.title.trim()
    }
    if (typeof payload.slug === 'string' && payload.slug.trim()) {
      updates.slug = slugFromText(payload.slug)
    }
    if (typeof payload.cover_image === 'string' && payload.cover_image.trim()) {
      updates.cover_image = payload.cover_image
    }
    if (Array.isArray(payload.tags)) {
      updates.tags = payload.tags
    }
    if ('related_article_slug' in payload) {
      updates.related_article_slug = payload.related_article_slug || null
    }
    updates.cta_text = null
    updates.cta_url = null
    updates.whatsapp_group_url = null
    updates.ad_slot = null
    if ('seo_description' in payload) {
      updates.seo_description = payload.seo_description || null
    }
    if ('category_id' in payload) {
      updates.category_id = payload.category_id || null
    }
    if ('author_id' in payload && payload.author_id) {
      if (user.role === 'admin') {
        const { data: selectedAuthor } = await supabase
          .from('authors')
          .select('id')
          .eq('id', payload.author_id)
          .maybeSingle()
        if (!selectedAuthor) return apiResponse(422, null, 'Selected author not found')
        updates.author_id = payload.author_id
      } else {
        const { data: selectedAuthor } = await supabase
          .from('authors')
          .select('id, user_id')
          .eq('id', payload.author_id)
          .maybeSingle()
        if (!selectedAuthor) return apiResponse(422, null, 'Selected author not found')
        if (selectedAuthor.user_id !== user.userId) {
          return apiResponse(403, null, 'Authors can only select their own author profile')
        }
        updates.author_id = payload.author_id
      }
    }
    if (payload.slides) {
      const slides = normalizeSlides(payload.slides)
      if (slides.length === 0) return apiResponse(422, null, 'At least one valid slide is required')
      updates.slides = slides
      if (!updates.cover_image) {
        updates.cover_image = slides[0].image
      }
      if (!updates.title) {
        updates.title = slides[0].headline
      }
      if (!updates.slug) {
        updates.slug = slugFromText(updates.title)
      }
      if (!updates.seo_description) {
        updates.seo_description = slides.find((s) => s.seo_description)?.seo_description || null
      }
    }

    const { data, error } = await supabase
      .from('web_stories')
      .update(updates)
      .eq('id', params.id)
      .select('*')
      .single()

    if (error) return apiResponse(500, null, error.message)
    return apiResponse(200, { story: data })
  } catch (error) {
    if (error.name === 'AuthError') return apiResponse(401, null, error.message)
    return apiResponse(500, null, error.message || 'Failed to update story')
  }
}

export async function DELETE(_request, { params }) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()

    const allowed = await canMutateStory(supabase, params.id, user)
    if (!allowed) return apiResponse(403, null, 'Forbidden')

    const { error } = await supabase.from('web_stories').delete().eq('id', params.id)
    if (error) return apiResponse(500, null, error.message)

    return apiResponse(200, { ok: true })
  } catch (error) {
    if (error.name === 'AuthError') return apiResponse(401, null, error.message)
    return apiResponse(500, null, error.message || 'Failed to delete story')
  }
}
