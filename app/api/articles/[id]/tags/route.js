import { createClient } from '@/lib/supabase/server'
import { apiResponse } from '@/lib/api-utils'

// DELETE - Delete all tags for an article
export async function DELETE(request, { params }) {
    try {
        const supabase = await createClient()

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return apiResponse(401, null, 'Unauthorized')
        }

        const { id: articleId } = params

        if (!articleId) {
            return apiResponse(400, null, 'Article ID is required')
        }

        // Verify user has permission to delete tags for this article
        const { data: article, error: articleError } = await supabase
            .from('articles')
            .select('author_id')
            .eq('id', articleId)
            .single()

        if (articleError || !article) {
            return apiResponse(404, null, 'Article not found')
        }

        // Get user role for permission check
        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        const isAdmin = userData?.role === 'admin'

        if (!isAdmin) {
            const { data: authorData } = await supabase
                .from('authors')
                .select('id')
                .eq('user_id', user.id)
                .single()

            if (article.author_id !== authorData?.id) {
                return apiResponse(403, null, 'You do not have permission to delete tags for this article')
            }
        }

        // Delete all tags for this article
        const { error } = await supabase
            .from('article_tags')
            .delete()
            .eq('article_id', articleId)

        if (error) {
            return apiResponse(500, null, error.message)
        }

        return apiResponse(200, { deleted: true }, null)
    } catch (error) {
        console.error('[API] Error deleting article tags:', error)
        return apiResponse(500, null, error.message)
    }
}
