/**
 * Authentication & Authorization Utilities
 */

import { createClient } from '@/lib/supabase/server'

export class AuthError extends Error {
    constructor(message) {
        super(message)
        this.name = 'AuthError'
    }
}

/**
 * Get current user from session
 * Returns: { userId, email, role } or null if not authenticated
 */
export async function getAuthUser() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        return null
    }

    // Get user role from public.users
    const { data: userRecord } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    return {
        userId: user.id,
        email: user.email,
        role: userRecord?.role || 'author',
    }
}

/**
 * Check if user is authenticated
 */
export async function requireAuth() {
    const user = await getAuthUser()
    if (!user) {
        throw new AuthError('Unauthorized')
    }
    return user
}

/**
 * Check if user has admin role
 */
export async function requireAdmin() {
    const user = await requireAuth()
    if (user.role !== 'admin') {
        throw new AuthError('Forbidden: Admin role required')
    }
    return user
}

/**
 * Get user's author profile
 */
export async function getUserAuthorId(userId) {
    const supabase = await createClient()
    const { data: author } = await supabase
        .from('authors')
        .select('id')
        .eq('user_id', userId)
        .single()

    return author?.id || null
}

/**
 * Check if user owns the article
 */
export async function isArticleOwner(articleId, userId) {
    const supabase = await createClient()
    const { data: article } = await supabase
        .from('articles')
        .select('author_id')
        .eq('id', articleId)
        .single()

    if (!article) return false

    const authorId = await getUserAuthorId(userId)
    return article.author_id === authorId
}

/**
 * Check if user can edit article
 * Admins can edit all, authors can edit own
 */
export async function canEditArticle(articleId, user) {
    if (user.role === 'admin') return true
    return await isArticleOwner(articleId, user.userId)
}

/**
 * Check if user can delete article
 * Admins can delete all, authors can delete own
 */
export async function canDeleteArticle(articleId, user) {
    if (user.role === 'admin') return true
    return await isArticleOwner(articleId, user.userId)
}

/**
 * Middleware: Require authentication
 * Usage: await withAuth(request, async (user) => { ... })
 */
export async function withAuth(request, handler) {
    try {
        const user = await requireAuth()
        return await handler(user)
    } catch (error) {
        if (error instanceof AuthError) {
            return new Response(JSON.stringify({ error: error.message }), { status: 401 })
        }
        throw error
    }
}

/**
 * Check if user can delete media file
 * Admins can delete all, users can delete own
 */
export async function canDeleteUserMedia(userId, mediaId) {
    const supabase = await createClient()
    const { data: media } = await supabase
        .from('media_library')
        .select('uploaded_by')
        .eq('id', mediaId)
        .single()

    if (!media) return false

    // Check if admin or owner
    const { data: user } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()

    if (user?.role === 'admin') return true
    return media.uploaded_by === userId
}

/**
 * Middleware: Require admin
 * Usage: await withAdmin(request, async (user) => { ... })
 */
export async function withAdmin(request, handler) {
    try {
        const user = await requireAdmin()
        return await handler(user)
    } catch (error) {
        if (error instanceof AuthError) {
            const status = error.message.includes('Admin') ? 403 : 401
            return new Response(JSON.stringify({ error: error.message }), { status })
        }
        throw error
    }
}
