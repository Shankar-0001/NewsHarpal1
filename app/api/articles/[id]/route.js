import { createClient } from '@/lib/supabase/server'
import { apiResponse, logger } from '@/lib/api-utils'
import { validateArticle, ValidationError } from '@/lib/validation'
import { requireAuth, canEditArticle, canDeleteArticle } from '@/lib/auth-utils'
import { sanitizeRichText } from '@/lib/security-utils'

export async function PATCH(request, { params }) {
    const requestId = `PATCH-article-${params.id}`

    try {
        // 1. Authenticate user
        const user = await requireAuth()
        logger.info(`[${requestId}] User authenticated`, { userId: user.userId })

        // 2. Get request body
        const data = await request.json()

        // 3. Validate data
        validateArticle(data)

        // 4. Check permission
        const canEdit = await canEditArticle(params.id, user)
        if (!canEdit) {
            logger.warn(`[${requestId}] Permission denied`, { userId: user.userId, articleId: params.id })
            return apiResponse(403, null, 'Forbidden: Cannot edit this article')
        }

        // 5. Update article
        const updatePayload = {
            ...data,
            content: sanitizeRichText(data.content),
            updated_at: new Date().toISOString(),
        }

        if (user.role !== 'admin') {
            delete updatePayload.author_id
        }

        const supabase = await createClient()
        const { data: updatedArticle, error } = await supabase
            .from('articles')
            .update(updatePayload)
            .eq('id', params.id)
            .select()
            .single()

        if (error) {
            logger.error(`[${requestId}] Database error`, error)
            return apiResponse(400, null, error.message)
        }

        logger.info(`[${requestId}] Article updated successfully`)
        return apiResponse(200, { article: updatedArticle })
    } catch (error) {
        if (error.name === 'ValidationError') {
            return apiResponse(422, null, error.message)
        }
        if (error.name === 'AuthError') {
            return apiResponse(error.message.includes('Forbidden') ? 403 : 401, null, error.message)
        }

        logger.error(requestId, error)
        return apiResponse(500, null, 'Internal server error')
    }
}

export async function DELETE(request, { params }) {
    const requestId = `DELETE-article-${params.id}`

    try {
        // 1. Authenticate user
        const user = await requireAuth()
        logger.info(`[${requestId}] User authenticated`, { userId: user.userId })

        // 2. Check permission
        const canDelete = await canDeleteArticle(params.id, user)
        if (!canDelete) {
            logger.warn(`[${requestId}] Permission denied`, { userId: user.userId })
            return apiResponse(403, null, 'Forbidden: Cannot delete this article')
        }

        // 3. Delete article
        const supabase = await createClient()
        const { error } = await supabase
            .from('articles')
            .delete()
            .eq('id', params.id)

        if (error) {
            logger.error(`[${requestId}] Database error`, error)
            return apiResponse(400, null, error.message)
        }

        logger.info(`[${requestId}] Article deleted successfully`)
        return apiResponse(200, { success: true })
    } catch (error) {
        if (error.name === 'AuthError') {
            return apiResponse(error.message.includes('Forbidden') ? 403 : 401, null, error.message)
        }

        logger.error(requestId, error)
        return apiResponse(500, null, 'Internal server error')
    }
}
