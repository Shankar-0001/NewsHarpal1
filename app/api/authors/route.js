import { createClient } from '@/lib/supabase/server'
import { apiResponse, logger } from '@/lib/api-utils'
import { validateAuthor, ValidationError } from '@/lib/validation'
import { requireAuth, requireAdmin } from '@/lib/auth-utils'

export async function POST(request) {
    const requestId = 'POST-author'

    try {
        // 1. Authenticate
        const user = await requireAuth()
        logger.info(`[${requestId}] User authenticated`, { userId: user.userId })

        // 2. Parse & validate
        const authorData = await request.json()
        validateAuthor(authorData)

        // 3. Create author with user_id
        const supabase = await createClient()
        const { data: author, error } = await supabase
            .from('authors')
            .insert([{
                ...authorData,
                user_id: user.userId,
            }])
            .select()
            .single()

        if (error) {
            logger.error(`[${requestId}] Database error`, error)
            return apiResponse(400, null, error.message)
        }

        logger.info(`[${requestId}] Author created`, { authorId: author.id })
        return apiResponse(201, { author })
    } catch (error) {
        if (error.name === 'ValidationError') {
            return apiResponse(422, null, error.message)
        }
        if (error.name === 'AuthError') {
            return apiResponse(401, null, error.message)
        }

        logger.error(requestId, error)
        return apiResponse(500, null, 'Internal server error')
    }
}

export async function PATCH(request) {
    const requestId = 'PATCH-author'

    try {
        // 1. Authenticate (admin or owner)
        const user = await requireAuth()
        logger.info(`[${requestId}] User authenticated`, { userId: user.userId })

        // 2. Parse & validate
        const { id, ...updateData } = await request.json()
        if (!id) {
            return apiResponse(400, null, 'Author ID is required')
        }
        validateAuthor(updateData)

        // 3. Check permission (admin only for now)
        if (user.role !== 'admin') {
            return apiResponse(403, null, 'Only admins can update authors')
        }

        // 4. Update
        const supabase = await createClient()
        const { data: author, error } = await supabase
            .from('authors')
            .update(updateData)
            .eq('id', id)
            .select()
            .maybeSingle()

        if (error) {
            logger.error(`[${requestId}] Database error`, error)
            return apiResponse(400, null, error.message)
        }

        logger.info(`[${requestId}] Author updated`, { authorId: id })
        return apiResponse(200, { author })
    } catch (error) {
        if (error.name === 'ValidationError') {
            return apiResponse(422, null, error.message)
        }
        if (error.name === 'AuthError') {
            return apiResponse(401, null, error.message)
        }

        logger.error(requestId, error)
        return apiResponse(500, null, 'Internal server error')
    }
}

export async function DELETE(request) {
    const requestId = 'DELETE-author'

    try {
        // 1. Require admin
        const user = await requireAdmin()
        logger.info(`[${requestId}] Admin authenticated`, { userId: user.userId })

        // 2. Get ID
        const { id } = await request.json()
        if (!id) {
            return apiResponse(400, null, 'Author ID is required')
        }

        // 3. Delete
        const supabase = await createClient()
        const { error } = await supabase
            .from('authors')
            .delete()
            .eq('id', id)

        if (error) {
            logger.error(`[${requestId}] Database error`, error)
            return apiResponse(400, null, error.message)
        }

        logger.info(`[${requestId}] Author deleted`, { authorId: id })
        return apiResponse(200, { success: true })
    } catch (error) {
        if (error.name === 'AuthError') {
            const status = error.message.includes('Admin') ? 403 : 401
            return apiResponse(status, null, error.message)
        }

        logger.error(requestId, error)
        return apiResponse(500, null, 'Internal server error')
    }
}
