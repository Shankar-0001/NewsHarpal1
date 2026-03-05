import { createClient } from '@/lib/supabase/server'
import { apiResponse, logger } from '@/lib/api-utils'
import { validateArticle, ValidationError } from '@/lib/validation'
import { requireAuth, getUserAuthorId } from '@/lib/auth-utils'
import { sanitizeRichText } from '@/lib/security-utils'

export async function POST(request) {
    const requestId = 'POST-article'

    try {
        // 1. Authenticate
        const user = await requireAuth()
        logger.info(`[${requestId}] User authenticated`, { userId: user.userId })

        // 2. Parse & validate
        const articleData = await request.json()
        validateArticle(articleData)

        // 3. Resolve author ID (admins may assign an explicit author_id)
        const supabase = await createClient()
        let authorId = await getUserAuthorId(user.userId)

        if (user.role === 'admin' && articleData.author_id) {
            const { data: authorRecord } = await supabase
                .from('authors')
                .select('id')
                .eq('id', articleData.author_id)
                .single()
            if (authorRecord) {
                authorId = authorRecord.id
            }
        }

        if (!authorId) {
            logger.warn(`[${requestId}] User has no author profile`, { userId: user.userId })
            return apiResponse(400, null, 'User must have an author profile')
        }

        // 4. Create article
        const sanitizedContent = sanitizeRichText(articleData.content)
        const { data: article, error } = await supabase
            .from('articles')
            .insert([{
                ...articleData,
                author_id: authorId,
                content: sanitizedContent,
            }])
            .select()
            .single()

        if (error) {
            logger.error(`[${requestId}] Database error`, error)
            return apiResponse(400, null, error.message)
        }

        logger.info(`[${requestId}] Article created`, { articleId: article.id })
        return apiResponse(201, { article })
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
