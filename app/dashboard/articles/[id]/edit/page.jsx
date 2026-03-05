'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import {
    validateImageFile,
    compressImage,
    generateStoragePath,
    formatFileSize,
    getImageDimensions,
} from '@/lib/image-utils'
import TipTapEditor from '@/components/editor/TipTapEditor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { X, Eye, Save, Trash2, AlertTriangle } from 'lucide-react'
import slugify from 'slugify'
import Link from 'next/link'

export default function EditArticlePage() {
    const router = useRouter()
    const params = useParams()
    const supabase = createClient()
    const { toast } = useToast()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [user, setUser] = useState(null)
    const [userRole, setUserRole] = useState(null)
    const [authorId, setAuthorId] = useState(null)
    const [selectedAuthorId, setSelectedAuthorId] = useState('')
    const [article, setArticle] = useState(null)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [error, setError] = useState(null)

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
    const [status, setStatus] = useState('published')

    // Options
    const [categories, setCategories] = useState([])
    const [tags, setTags] = useState([])
    const [authors, setAuthors] = useState([])
    const [newTagName, setNewTagName] = useState('')

    useEffect(() => {
        loadUserAndArticle()
    }, [])

    const loadUserAndArticle = async () => {
        try {
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
            setSelectedAuthorId(authorData?.id || '')

            // Load the article
            const { data: articleData, error: articleError } = await supabase
                .from('articles')
                .select(`
          *,
          article_tags (tag_id)
        `)
                .eq('id', params.id)
                .single()

            if (articleError || !articleData) {
                setError('Article not found')
                setTimeout(() => router.push('/dashboard/articles'), 2000)
                return
            }

            // Check permissions: authors can only edit their own articles
            if (userData?.role === 'author' && articleData.author_id !== authorData?.id) {
                setError('You do not have permission to edit this article')
                setTimeout(() => router.push('/dashboard/articles'), 2000)
                return
            }

            setArticle(articleData)
            setTitle(articleData.title || '')
            setSlug(articleData.slug || '')
            setExcerpt(articleData.excerpt || '')
            setContent({ json: articleData.content_json, html: articleData.content || '' })
            setCategoryId(articleData.category_id || '')
            setSelectedAuthorId(articleData.author_id || authorData?.id || '')
            setFeaturedImage(articleData.featured_image_url || '')
            setSeoTitle(articleData.seo_title || '')
            setSeoDescription(articleData.seo_description || '')
            setStatus(articleData.status || 'published')

            if (articleData.article_tags) {
                setSelectedTags(articleData.article_tags.map(at => at.tag_id))
            }

            // Load categories and tags
            const { data: categoriesData } = await supabase
                .from('categories')
                .select('id, name')
                .order('name')

            const { data: tagsData } = await supabase
                .from('tags')
                .select('id, name')
                .order('name')

            if (userData?.role === 'admin') {
                const { data: authorsData } = await supabase
                    .from('authors')
                    .select('id, name')
                    .order('name')
                setAuthors(authorsData || [])
            } else {
                setAuthors(authorData ? [{ id: authorData.id, name: user.email?.split('@')[0] || 'Me' }] : [])
            }

            setCategories(categoriesData || [])
            setTags(tagsData || [])

            setLoading(false)
        } catch (err) {
            console.error('Error loading article:', err)
            setError(err.message || 'Failed to load article')
            setLoading(false)
        }
    }

    const handleTitleChange = (newTitle) => {
        setTitle(newTitle)
        if (!slug || slug === slugify(article?.title || '', { lower: true, strict: true })) {
            setSlug(slugify(newTitle, { lower: true, strict: true }))
        }
    }

    const handleImageUpload = (file) => {
        return new Promise(async (resolve) => {
            if (!file) {
                resolve(null)
                return
            }

            try {
                // Validate image
                const validation = validateImageFile(file)
                if (!validation.valid) {
                    toast({
                        variant: 'destructive',
                        title: 'Invalid file',
                        description: validation.errors.join(', '),
                    })
                    resolve(null)
                    return
                }

                // Get image dimensions
                const dimensions = await getImageDimensions(file)

                // Warn if image is smaller than recommended
                if (dimensions.width < 1200 || dimensions.height < 630) {
                    toast({
                        title: 'Warning',
                        description: `Image is ${dimensions.width}x${dimensions.height}. For best quality, use at least 1200x630px.`,
                    })
                }

                // Compress image
                const compressedFile = await compressImage(file, 1920, 1920)

                if (!user) {
                    resolve(null)
                    return
                }

                // Upload to Supabase Storage
                const fileExt = file.name.split('.').pop()
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
                const filePath = generateStoragePath('articles', fileName)

                const { data, error } = await supabase.storage
                    .from('media')
                    .upload(filePath, compressedFile)

                if (error) {
                    toast({
                        variant: 'destructive',
                        title: 'Upload failed',
                        description: error.message,
                    })
                    resolve(null)
                    return
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('media')
                    .getPublicUrl(filePath)

                // Save to media library
                const { error: insertError } = await supabase.from('media_library').insert({
                    filename: file.name,
                    file_url: publicUrl,
                    file_path: filePath,
                    file_type: file.type,
                    file_size: file.size,
                    original_width: dimensions.width,
                    original_height: dimensions.height,
                    uploaded_by: user.id,
                })

                if (insertError) {
                    console.warn('Failed to save media library record:', insertError)
                }

                toast({
                    title: 'Success',
                    description: `Image uploaded (${formatFileSize(compressedFile.size)})`,
                })

                resolve(publicUrl)
            } catch (err) {
                console.error('Error uploading image:', err)
                toast({
                    variant: 'destructive',
                    title: 'Upload error',
                    description: err.message || 'Failed to upload image',
                })
                resolve(null)
            }
        })
    }

    const saveArticle = async (newStatus) => {
        if (!title.trim()) {
            toast({
                variant: 'destructive',
                title: 'Validation error',
                description: 'Article title is required',
            })
            return
        }

        if (!content.html || content.html.trim().length === 0) {
            toast({
                variant: 'destructive',
                title: 'Validation error',
                description: 'Article content cannot be empty',
            })
            return
        }

        setSaving(true)
        setError(null)

        try {
            // For authors, always force status to 'published'
            const finalStatus = userRole === 'author' ? 'published' : newStatus

            const articleData = {
                title: title.trim(),
                slug: slug || slugify(title, { lower: true, strict: true }),
                excerpt: excerpt.trim(),
                content: content.html,
                content_json: content.json,
                category_id: categoryId || null,
                featured_image_url: featuredImage || null,
                seo_title: seoTitle || title,
                seo_description: seoDescription || excerpt,
                status: finalStatus,
                published_at: finalStatus === 'published' ? new Date().toISOString() : null,
                author_id: selectedAuthorId || authorId,
            }

            // Update via API proxy
            const response = await fetch(`/api/articles/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(articleData),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Failed to update article')
            }

            // Handle tags
            if (selectedTags.length > 0) {
                // Delete old tags
                await fetch(`/api/articles/${params.id}/tags`, { method: 'DELETE' })

                // Add new tags
                await fetch('/api/articles/tags', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(
                        selectedTags.map(tagId => ({ article_id: params.id, tag_id: tagId }))
                    ),
                })
            }

            toast({
                title: 'Success',
                description: 'Article updated successfully',
            })

            router.push('/dashboard/articles')
        } catch (err) {
            console.error('Error saving article:', err)
            setError(err.message || 'Failed to save article')
            toast({
                variant: 'destructive',
                title: 'Error',
                description: err.message || 'Failed to save article',
            })
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        setSaving(true)
        setError(null)

        try {
            const response = await fetch(`/api/articles/${params.id}`, { method: 'DELETE' })
            const json = await response.json()

            if (!response.ok) {
                throw new Error(json.error || 'Failed to delete article')
            }

            toast({
                title: 'Success',
                description: 'Article deleted successfully',
            })

            router.push('/dashboard/articles')
        } catch (err) {
            console.error('Error deleting article:', err)
            setError(err.message || 'Failed to delete article')
            toast({
                variant: 'destructive',
                title: 'Error',
                description: err.message || 'Failed to delete article',
            })
            setSaving(false)
        }
    }

    const toggleTag = (tagId) => {
        setSelectedTags(prev =>
            prev.includes(tagId)
                ? prev.filter(id => id !== tagId)
                : [...prev, tagId]
        )
    }

    const createTag = async () => {
        const name = newTagName.trim()
        if (!name) return
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

        const response = await fetch('/api/articles/tags', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, slug }),
        })

        const result = await response.json()
        if (response.ok && result?.data?.tag) {
            const createdTag = result.data.tag
            setTags((prev) => [...prev, createdTag])
            setSelectedTags((prev) => [...prev, createdTag.id])
            setNewTagName('')
            return
        }

        toast({
            variant: 'destructive',
            title: 'Tag creation failed',
            description: result?.error || 'Could not create tag',
        })
    }

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto">
                <div className="text-center py-12">
                    <p className="text-gray-600 dark:text-gray-400">Loading article...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="max-w-5xl mx-auto">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="ml-2">
                        {error}
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Article</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Update your article content and settings</p>
                </div>
                <Link href={`/articles/${slug}`} target="_blank">
                    <Button variant="outline">
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                    </Button>
                </Link>
            </div>

            <div className="space-y-6">
                {/* Title */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Article Title</CardTitle>
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
                        <CardTitle className="text-lg">URL Slug</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Input
                                placeholder="article-url-slug"
                                value={slug}
                                onChange={(e) => setSlug(slugify(e.target.value, { lower: true, strict: true }))}
                            />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Preview: <span className="font-mono text-blue-600">/articles/{slug || 'article-slug'}</span>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Excerpt */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Excerpt</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            placeholder="Brief description of the article..."
                            value={excerpt}
                            onChange={(e) => setExcerpt(e.target.value)}
                            rows={3}
                            className="resize-none"
                        />
                    </CardContent>
                </Card>

                {/* Category and Author */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Category</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Select value={categoryId} onValueChange={val => setCategoryId(val === 'none' ? '' : val)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
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
                            <CardTitle className="text-lg">Author</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Select value={selectedAuthorId} onValueChange={setSelectedAuthorId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select author" />
                                </SelectTrigger>
                                <SelectContent>
                                    {authors.map(author => (
                                        <SelectItem key={author.id} value={author.id}>
                                            {author.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>
                </div>

                {/* Featured Image */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Featured Image</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Input
                            type="text"
                            placeholder="Image URL..."
                            value={featuredImage}
                            onChange={(e) => setFeaturedImage(e.target.value)}
                        />
                    </CardContent>
                </Card>

                {/* Tags */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Tags</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2 mb-4">
                            <Input
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                placeholder="Create new tag"
                            />
                            <Button type="button" variant="outline" onClick={createTag}>
                                Add
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {tags.length > 0 ? (
                                tags.map(tag => (
                                    <Badge
                                        key={tag.id}
                                        variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}
                                        className="cursor-pointer"
                                        onClick={() => toggleTag(tag.id)}
                                    >
                                        {tag.name}
                                    </Badge>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500">No tags available</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Editor */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Content</CardTitle>
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
                        <CardTitle className="text-lg">SEO Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label>SEO Title</Label>
                            <Input
                                placeholder={title || 'SEO title...'}
                                value={seoTitle}
                                onChange={(e) => setSeoTitle(e.target.value)}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {seoTitle.length}/60 characters
                            </p>
                        </div>
                        <div>
                            <Label>SEO Description</Label>
                            <Textarea
                                placeholder={excerpt || 'SEO description...'}
                                value={seoDescription}
                                onChange={(e) => setSeoDescription(e.target.value)}
                                rows={2}
                                className="resize-none"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {seoDescription.length}/160 characters
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Status (Admin only) */}
                {userRole === 'admin' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="pending">Pending Review</SelectItem>
                                    <SelectItem value="published">Published</SelectItem>
                                    <SelectItem value="archived">Archived</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-2">
                                {status === 'published' ? 'This article is publicly visible' : 'This article is not publicly visible'}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-between gap-3 sticky bottom-4 bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800 shadow-lg">
                    <Button
                        variant="destructive"
                        onClick={() => setShowDeleteDialog(true)}
                        disabled={saving}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Article
                    </Button>

                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => router.back()}
                            disabled={saving}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => saveArticle(status)}
                            disabled={saving}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Article</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{title}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={saving}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {saving ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
