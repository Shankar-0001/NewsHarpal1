import { createClient } from '@/lib/supabase/server'
import { apiResponse } from '@/lib/api-utils'

// POST - Create article tag relationships
export async function POST(request) {
    try {
        const supabase = await createClient()

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return apiResponse(401, null, 'Unauthorized')
        }

        const tagRelations = await request.json()

        if (!Array.isArray(tagRelations) || tagRelations.length === 0) {
            return apiResponse(400, null, 'Tag relations must be a non-empty array')
        }

        // Validate all tag relations have required fields
        const valid = tagRelations.every(rel => rel.article_id && rel.tag_id)
        if (!valid) {
            return apiResponse(400, null, 'Each tag relation must have article_id and tag_id')
        }

        // Insert tag relations
        const { data, error } = await supabase
            .from('article_tags')
            .insert(tagRelations)
            .select()

        if (error) {
            return apiResponse(500, null, error.message)
        }

        return apiResponse(201, data, null)
    } catch (error) {
        console.error('[API] Error creating article tags:', error)
        return apiResponse(500, null, error.message)
    }
}

// DELETE - Delete article tag relationship
export async function DELETE(request) {
    try {
        const supabase = await createClient()

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return apiResponse(401, null, 'Unauthorized')
        }

        const { articleId } = await request.json()

        if (!articleId) {
            return apiResponse(400, null, 'Article ID is required')
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
