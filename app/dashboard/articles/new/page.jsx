'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import TipTapEditor from '@/components/editor/TipTapEditor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, Eye, Save, Send, CheckCircle } from 'lucide-react'
import slugify from 'slugify'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function ArticleEditorPage({ params }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [authorId, setAuthorId] = useState(null)
  const [showPreview, setShowPreview] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState({ json: null, html: '' })
  const [categoryId, setCategoryId] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [featuredImage, setFeaturedImage] = useState('')
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [status, setStatus] = useState('published') // Authors publish directly

  // Options
  const [categories, setCategories] = useState([])
  const [tags, setTags] = useState([])

  useEffect(() => {
    loadUserAndData()
  }, [])

  const loadUserAndData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setUser(user)

    // Get user role and author ID
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    setUserRole(userData?.role)

    const { data: authorData } = await supabase
      .from('authors')
      .select('id')
      .eq('user_id', user.id)
      .single()

    setAuthorId(authorData?.id)

    // Load categories and tags
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    setCategories(categoriesData || [])

    const { data: tagsData } = await supabase
      .from('tags')
      .select('*')
      .order('name')

    setTags(tagsData || [])
  }

  const handleTitleChange = (newTitle) => {
    setTitle(newTitle)
    if (!slug) {
      setSlug(slugify(newTitle, { lower: true, strict: true }))
    }
  }

  const handleImageUpload = async (file) => {
    if (!file) return null

    // Validate image size
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    return new Promise((resolve) => {
      img.onload = async () => {
        URL.revokeObjectURL(objectUrl)

        if (img.width < 1200) {
          alert('Image width should be at least 1200px for best quality')
        }

        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `articles/${fileName}`

        const { data, error } = await supabase.storage
          .from('media')
          .upload(filePath, file)

        if (error) {
          console.error('Upload error:', error)
          alert('Failed to upload image')
          resolve(null)
          return
        }

        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(filePath)

        // Save to media library
        await supabase.from('media_library').insert({
          filename: file.name,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size,
          uploaded_by: user.id,
        })

        resolve(publicUrl)
      }
      img.src = objectUrl
    })
  }

  const handleSaveDraft = async () => {
    await saveArticle('draft')
  }

  const handleSubmitForReview = async () => {
    await saveArticle('pending')
  }

  const handlePublish = async () => {
    await saveArticle('published')
  }

  const saveArticle = async (newStatus) => {
    if (!title || !authorId) {
      alert('Title is required')
      return
    }

    setLoading(true)

    try {
      const articleData = {
        title,
        slug,
        excerpt,
        content: content.html,
        content_json: content.json,
        author_id: authorId,
        category_id: categoryId || null,
        featured_image_url: featuredImage || null,
        seo_title: seoTitle || title,
        seo_description: seoDescription || excerpt,
        status: newStatus,
        published_at: newStatus === 'published' ? new Date().toISOString() : null,
      }

      // call server API to create article
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articleData),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to create')
      const article = result.article

      // handle tags via API as well (direct supabase call since server has access)
      if (selectedTags.length > 0 && article) {
        const tagRelations = selectedTags.map(tagId => ({
          article_id: article.id,
          tag_id: tagId,
        }))
        await fetch('/api/article_tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tagRelations),
        })
      }

      alert(`Article ${newStatus === 'draft' ? 'saved as draft' : newStatus === 'pending' ? 'submitted for review' : 'published successfully'}!`)
      router.push('/dashboard/articles')
    } catch (error) {
      console.error('Error saving article:', error)
      alert('Failed to save article: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleTag = (tagId) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Article</h1>
        <p className="text-gray-600 mt-2">Write and publish your article</p>
      </div>

      <div className="space-y-6">
        {/* Title */}
        <Card>
          <CardHeader>
            <CardTitle>Article Title</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Enter article title..."
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="text-lg"
            />
          </CardContent>
        </Card>

        {/* Slug */}
        <Card>
          <CardHeader>
            <CardTitle>URL Slug</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Input
                placeholder="article-url-slug"
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value, { lower: true, strict: true }))}
              />
              <p className="text-sm text-gray-500">
                Preview: <span className="font-mono text-blue-600">/articles/{slug || 'article-slug'}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Excerpt */}
        <Card>
          <CardHeader>
            <CardTitle>Excerpt</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Brief description of the article..."
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Category and Tags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Category</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <Badge
                    key={tag.id}
                    variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.name}
                    {selectedTags.includes(tag.id) && <X className="ml-1 h-3 w-3" />}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Featured Image */}
        <Card>
          <CardHeader>
            <CardTitle>Featured Image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (file) {
                  const url = await handleImageUpload(file)
                  if (url) setFeaturedImage(url)
                }
              }}
            />
            {featuredImage && (
              <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                <img src={featuredImage} alt="Featured" className="w-full h-full object-cover" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content Editor */}
        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
          </CardHeader>
          <CardContent>
            <TipTapEditor
              content={content.html}
              onChange={setContent}
              onImageUpload={handleImageUpload}
            />
          </CardContent>
        </Card>

        {/* SEO Fields */}
        <Card>
          <CardHeader>
            <CardTitle>SEO Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>SEO Title</Label>
              <Input
                placeholder={title || 'SEO title...'}
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
              />
            </div>
            <div>
              <Label>SEO Description</Label>
              <Textarea
                placeholder={excerpt || 'SEO description...'}
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 sticky bottom-4 bg-white p-4 rounded-lg border shadow-lg">
          <Button
            variant="outline"
            onClick={() => setShowPreview(true)}
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          {userRole === 'admin' && (
            <>
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={loading}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Draft
              </Button>
              <Button
                onClick={handleSubmitForReview}
                disabled={loading}
              >
                <Send className="mr-2 h-4 w-4" />
                Submit for Review
              </Button>
            </>
          )}
          <Button
            onClick={handlePublish}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            {userRole === 'author' ? 'Publish Article' : 'Publish'}
          </Button>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Article Preview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {featuredImage && (
              <img src={featuredImage} alt={title} className="w-full h-64 object-cover rounded-lg" />
            )}
            <h1 className="text-4xl font-bold">{title}</h1>
            <p className="text-xl text-gray-600">{excerpt}</p>
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: content.html }}
            />
          </div>
        </DialogContent>
      </Dialog >
    </div >
  )
}