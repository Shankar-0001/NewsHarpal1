'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { slugFromText } from '@/lib/site-config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

function emptySlide() {
  return {
    image: '',
    headline: '',
    seo_description: '',
    cta_text: '',
    cta_url: '',
    whatsapp_group_url: '',
  }
}

export default function WebStoryEditor({ mode = 'create', storyId = null }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [categories, setCategories] = useState([])
  const [authors, setAuthors] = useState([])
  const [userRole, setUserRole] = useState('author')

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [authorId, setAuthorId] = useState('')
  const [relatedArticleSlug, setRelatedArticleSlug] = useState('')
  const [tagsText, setTagsText] = useState('')
  const [slides, setSlides] = useState([emptySlide()])

  useEffect(() => {
    const bootstrap = async () => {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData?.user) return

      const [{ data: userRow }, { data: categoryRows }, { data: authorRows }] = await Promise.all([
        supabase.from('users').select('role').eq('id', authData.user.id).single(),
        supabase.from('categories').select('id, name').order('name'),
        supabase.from('authors').select('id, name').order('name'),
      ])

      setUserRole(userRow?.role || 'author')
      setCategories(categoryRows || [])
      setAuthors(authorRows || [])

      if (mode === 'create' && userRow?.role !== 'admin') {
        const { data: ownAuthor } = await supabase.from('authors').select('id').eq('user_id', authData.user.id).single()
        setAuthorId(ownAuthor?.id || '')
      }

      if (mode === 'edit' && storyId) {
        const response = await fetch(`/api/web-stories/${storyId}`)
        const payload = await response.json()
        const story = payload?.data?.story
        if (!story) return

        setTitle(story.title || '')
        setSlug(story.slug || '')
        setCoverImage(story.cover_image || '')
        setCategoryId(story.category_id || '')
        setAuthorId(story.author_id || '')
        setRelatedArticleSlug(story.related_article_slug || '')
        setTagsText(Array.isArray(story.tags) ? story.tags.join(', ') : '')
        setSlides(Array.isArray(story.slides) && story.slides.length > 0 ? story.slides : [emptySlide()])
      }
    }

    bootstrap()
  }, [mode, storyId])

  const setSlide = (idx, patch) => {
    setSlides((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)))
  }

  const addSlide = () => setSlides((prev) => [...prev, emptySlide()])
  const removeSlide = (idx) => setSlides((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)))
  const moveSlide = (idx, dir) => {
    setSlides((prev) => {
      const nextIndex = idx + dir
      if (nextIndex < 0 || nextIndex >= prev.length) return prev
      const clone = [...prev]
      const temp = clone[idx]
      clone[idx] = clone[nextIndex]
      clone[nextIndex] = temp
      return clone
    })
  }

  const uploadMedia = async (file) => {
    if (!file) return ''
    const formData = new FormData()
    formData.append('file', file)
    setUploading(true)
    const response = await fetch('/api/media', { method: 'POST', body: formData })
    setUploading(false)
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      alert(payload?.error?.message || payload?.error || 'Upload failed')
      return ''
    }
    return payload?.data?.media?.file_url || ''
  }

  const save = async () => {
    setLoading(true)

    const preparedSlides = [...slides]
    while (preparedSlides.length < 12) {
      preparedSlides.push(emptySlide())
    }

    // Keep CTA only on slide 11 and WhatsApp only on slide 12.
    preparedSlides.forEach((slide, idx) => {
      if (idx !== 10) {
        slide.cta_text = ''
        slide.cta_url = ''
      }
      if (idx !== 11) {
        slide.whatsapp_group_url = ''
      }
    })

    const firstSlide = preparedSlides[0] || emptySlide()
    const derivedTitle = (firstSlide.headline || title || '').trim() || 'Untitled Story'
    const derivedSlug = slugFromText(slug || title || firstSlide.headline || 'untitled-story')
    const derivedCover = firstSlide.image || coverImage || ''
    const derivedSeo = preparedSlides.find((s) => s.seo_description)?.seo_description || null

    const payload = {
      title: derivedTitle,
      slug: derivedSlug,
      cover_image: derivedCover,
      category_id: categoryId || null,
      author_id: authorId || null,
      related_article_slug: relatedArticleSlug || null,
      seo_description: derivedSeo,
      tags: tagsText.split(',').map((t) => t.trim()).filter(Boolean),
      slides: preparedSlides,
    }

    const endpoint = mode === 'edit' ? `/api/web-stories/${storyId}` : '/api/web-stories'
    const method = mode === 'edit' ? 'PATCH' : 'POST'

    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    setLoading(false)
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      alert(payload?.error || 'Failed to save web story')
      return
    }

    router.push('/dashboard/web-stories')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Category</Label>
          <Select value={categoryId || undefined} onValueChange={setCategoryId}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Author</Label>
          <Select value={authorId || undefined} onValueChange={setAuthorId}>
            <SelectTrigger><SelectValue placeholder="Select author" /></SelectTrigger>
            <SelectContent>
              {authors.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="related_article_slug">Related Article Slug</Label>
          <Input id="related_article_slug" name="related_article_slug" value={relatedArticleSlug} onChange={(e) => setRelatedArticleSlug(e.target.value)} />
        </div>
      </div>

      <div>
        <Label htmlFor="story_tags">Tags (comma separated)</Label>
        <Input id="story_tags" name="story_tags" value={tagsText} onChange={(e) => setTagsText(e.target.value)} />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Slides</h3>
          <Button type="button" variant="outline" onClick={addSlide}>Add Slide</Button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Slide 11 is reserved for Read More CTA. Slide 12 is reserved for WhatsApp CTA.
        </p>

        {slides.map((slide, idx) => (
          <div key={idx} className="rounded-lg border dark:border-gray-700 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-medium text-gray-900 dark:text-white">Slide {idx + 1}</p>
              <div className="flex gap-1">
                <Button type="button" variant="ghost" onClick={() => moveSlide(idx, -1)}>Up</Button>
                <Button type="button" variant="ghost" onClick={() => moveSlide(idx, 1)}>Down</Button>
                <Button type="button" variant="ghost" onClick={() => removeSlide(idx)}>Remove</Button>
              </div>
            </div>

            <div>
              <Label htmlFor={`slide_image_${idx}`}>Image</Label>
              <Input id={`slide_image_${idx}`} name={`slide_image_${idx}`} value={slide.image || ''} onChange={(e) => setSlide(idx, { image: e.target.value })} />
              <Input
                id={`slide_file_${idx}`}
                name={`slide_file_${idx}`}
                type="file"
                accept="image/*"
                className="mt-2"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  const url = await uploadMedia(file)
                  if (url) setSlide(idx, { image: url })
                }}
              />
            </div>

            <div>
              <Label htmlFor={`slide_headline_${idx}`}>Web Stories Headline</Label>
              <Input id={`slide_headline_${idx}`} name={`slide_headline_${idx}`} value={slide.headline || ''} onChange={(e) => setSlide(idx, { headline: e.target.value })} />
            </div>

            <div>
              <Label htmlFor={`slide_seo_description_${idx}`}>SEO description (metadata only)</Label>
              <Textarea
                id={`slide_seo_description_${idx}`}
                name={`slide_seo_description_${idx}`}
                value={slide.seo_description || ''}
                onChange={(e) => setSlide(idx, { seo_description: e.target.value })}
              />
            </div>

            {idx === 10 && (
              <>
                <div>
                  <Label htmlFor={`slide_cta_text_${idx}`}>CTA Button Text (Slide 11)</Label>
                  <Input id={`slide_cta_text_${idx}`} name={`slide_cta_text_${idx}`} value={slide.cta_text || ''} onChange={(e) => setSlide(idx, { cta_text: e.target.value })} placeholder="Read more stories" />
                </div>
                <div>
                  <Label htmlFor={`slide_cta_url_${idx}`}>CTA Website URL (Slide 11)</Label>
                  <Input id={`slide_cta_url_${idx}`} name={`slide_cta_url_${idx}`} value={slide.cta_url || ''} onChange={(e) => setSlide(idx, { cta_url: e.target.value })} placeholder="https://news-harpal.vercel.app/" />
                </div>
              </>
            )}

            {idx === 11 && (
              <div>
                <Label htmlFor={`slide_whatsapp_${idx}`}>WhatsApp Group Join URL (Slide 12)</Label>
                <Input id={`slide_whatsapp_${idx}`} name={`slide_whatsapp_${idx}`} value={slide.whatsapp_group_url || ''} onChange={(e) => setSlide(idx, { whatsapp_group_url: e.target.value })} placeholder="https://chat.whatsapp.com/" />
              </div>
            )}
          </div>
        ))}
      </div>

      <Button onClick={save} disabled={loading || uploading}>
        {uploading ? 'Uploading...' : loading ? 'Saving...' : mode === 'edit' ? 'Update Story' : 'Create Story'}
      </Button>
    </div>
  )
}
