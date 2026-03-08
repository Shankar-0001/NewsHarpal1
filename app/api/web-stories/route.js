import { createClient } from '@/lib/supabase/server'
import { apiResponse } from '@/lib/api-utils'
import { requireAuth, getUserAuthorId } from '@/lib/auth-utils'
import { slugFromText } from '@/lib/site-config'
import { validateWebStoryPayload } from '@/lib/web-story-validation'

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

export async function GET(request) {
  try {
    const supabase = await createClient()
    const search = new URL(request.url).searchParams
    const limit = Math.min(50, Math.max(1, Number(search.get('limit') || 24)))

    const { data, error } = await supabase
      .from('web_stories')
      .select('id, title, slug, cover_image, slides, author_id, category_id, tags, related_article_slug, cta_text, cta_url, whatsapp_group_url, ad_slot, seo_description, created_at, updated_at, authors(name, slug), categories(name, slug)')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) return apiResponse(500, null, error.message)
    return apiResponse(200, { stories: data || [] })
  } catch (error) {
    return apiResponse(500, null, error.message || 'Failed to fetch stories')
  }
}

export async function POST(request) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()
    const payload = await request.json()

    let authorId = payload.author_id || null
    const ownAuthorId = await getUserAuthorId(user.userId)

    if (user.role === 'admin') {
      if (authorId) {
        const { data: selectedAuthor } = await supabase
          .from('authors')
          .select('id')
          .eq('id', authorId)
          .maybeSingle()
        if (!selectedAuthor) return apiResponse(422, null, 'Selected author not found')
      } else {
        authorId = ownAuthorId
      }
    } else {
      if (!authorId) {
        authorId = ownAuthorId
      } else {
        const { data: selectedAuthor } = await supabase
          .from('authors')
          .select('id, user_id')
          .eq('id', authorId)
          .maybeSingle()

        if (!selectedAuthor) return apiResponse(422, null, 'Selected author not found')
        if (selectedAuthor.user_id !== user.userId) {
          return apiResponse(403, null, 'Authors can only select their own author profile')
        }
      }
    }

    if (!authorId) return apiResponse(400, null, 'Author profile is required')

    const slides = normalizeSlides(payload.slides)
    if (slides.length === 0) return apiResponse(422, null, 'At least one valid slide is required')

    const titleFromPayload = (payload.title || '').trim()
    const title = titleFromPayload || (slides[0]?.headline || '').trim()
    if (!title) return apiResponse(422, null, 'Title is required')

    const slug = payload.slug ? slugFromText(payload.slug) : slugFromText(title)
    const derivedSeoDescription = payload.seo_description || slides.find((s) => s.seo_description)?.seo_description || null
    const coverImage = payload.cover_image || slides[0].image
    const validation = validateWebStoryPayload({
      title,
      coverImage,
      slides,
    })
    if (!validation.valid) {
      return apiResponse(422, null, validation.issues[0])
    }

    const insertData = {
      title,
      slug,
      cover_image: coverImage,
      slides,
      author_id: authorId,
      category_id: payload.category_id || null,
      tags: Array.isArray(payload.tags) ? payload.tags : [],
      related_article_slug: payload.related_article_slug || null,
      cta_text: null,
      cta_url: null,
      whatsapp_group_url: null,
      ad_slot: null,
      seo_description: derivedSeoDescription,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('web_stories')
      .insert(insertData)
      .select('*')
      .single()

    if (error) return apiResponse(500, null, error.message)
    return apiResponse(201, { story: data })
  } catch (error) {
    if (error.name === 'AuthError') return apiResponse(401, null, error.message)
    return apiResponse(500, null, error.message || 'Failed to create story')
  }
}
