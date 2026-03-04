/**
 * Media Library API Routes
 * Handles GET (list), POST (upload), DELETE (remove) with auth and validation
 */

import { createClient } from '@/lib/supabase/server'
import { apiResponse } from '@/lib/api-utils'
import { validateFileUpload, sanitizeFilename } from '@/lib/security-utils'

/**
 * GET /api/media
 * List all media with pagination and filtering
 * Query params: page=1, limit=20, type=image|video|audio|document, search=term
 */
export async function GET(request) {
    try {
        const supabase = createClient()
        const url = new URL(request.url)
        const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
        const limit = Math.min(100, parseInt(url.searchParams.get('limit') || '20'))
        const type = url.searchParams.get('type')
        const search = url.searchParams.get('search')

        // Build query
        let query = supabase
            .from('media_library')
            .select('*', { count: 'exact' })

        // Filter by file type
        if (type) {
            const typeMap = {
                image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
                video: ['video/mp4', 'video/webm', 'video/quicktime'],
                audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
                document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            }

            const mimeTypes = typeMap[type.toLowerCase()]
            if (mimeTypes) {
                query = query.in('file_type', mimeTypes)
            }
        }

        // Search by filename
        if (search && search.trim()) {
            query = query.ilike('filename', `%${search}%`)
        }

        // Order and pagination
        query = query
            .order('created_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1)

        const { data, count, error } = await query

        if (error) throw error

        return apiResponse(200, {
            media: data || [],
            pagination: {
                page,
                limit,
                total: count || 0,
                pages: Math.ceil((count || 0) / limit),
            },
        })
    } catch (error) {
        console.error('Media GET error:', error)
        return apiResponse(500, null, {
            message: 'Failed to fetch media',
            error: error.message,
        })
    }
}

/**
 * POST /api/media
 * Upload a new media file with compression and validation
 * Requires: form-data with file field
 */
export async function POST(request) {
    try {
        const supabase = createClient()

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return apiResponse(401, null, { message: 'Unauthorized' })
        }

        const formData = await request.formData()
        const file = formData.get('file')

        if (!file) {
            return apiResponse(400, null, { message: 'No file provided' })
        }

        // Validate file
        const uploadValidation = validateFileUpload(file, {
            maxSize: 50 * 1024 * 1024, // 50MB for media
            allowedTypes: [
                'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
                'video/mp4', 'video/webm', 'video/quicktime',
                'audio/mpeg', 'audio/wav', 'audio/ogg',
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ],
        })

        if (!uploadValidation.valid) {
            return apiResponse(400, null, {
                message: 'File validation failed',
                errors: uploadValidation.errors,
            })
        }

        // Generate organized storage path: media/YYYY/MM/DD/filename
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        const sanitized = sanitizeFilename(file.name)
        const filePath = `media/${year}/${month}/${day}/${Date.now()}_${sanitized}`

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('media')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
            })

        if (uploadError) throw uploadError

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('media')
            .getPublicUrl(filePath)

        // Get file dimensions for images
        let dimensions = null
        if (file.type.startsWith('image/')) {
            try {
                const buffer = await file.arrayBuffer()
                // Note: In production, use a library like 'image-size' on server
                // For now, store dimensions from client metadata if available
                const metadata = formData.get('dimensions')
                if (metadata) {
                    dimensions = JSON.parse(metadata)
                }
            } catch (err) {
                console.warn('Could not extract image dimensions:', err)
            }
        }

        // Insert metadata into media_library table
        const { data: mediaRecord, error: insertError } = await supabase
            .from('media_library')
            .insert({
                filename: sanitized,
                file_url: publicUrl,
                file_type: file.type,
                file_size: file.size,
                uploaded_by: user.id,
                storage_path: filePath,
                width: dimensions?.width,
                height: dimensions?.height,
                metadata: {
                    originalName: file.name,
                    uploadedAt: new Date().toISOString(),
                },
            })
            .select()

        if (insertError) throw insertError

        return apiResponse(201, {
            media: mediaRecord?.[0],
            message: 'File uploaded successfully',
        })
    } catch (error) {
        console.error('Media POST error:', error)
        return apiResponse(500, null, {
            message: 'File upload failed',
            error: error.message,
        })
    }
}

/**
 * DELETE /api/media?id=<media-id>
 * Delete media file from storage and database
 * Requires: authentication and ownership or admin role
 */
export async function DELETE(request) {
    try {
        const supabase = createClient()

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return apiResponse(401, null, { message: 'Unauthorized' })
        }

        const url = new URL(request.url)
        const mediaId = url.searchParams.get('id')

        if (!mediaId) {
            return apiResponse(400, null, { message: 'Media ID required' })
        }

        // Fetch media record
        const { data: media, error: fetchError } = await supabase
            .from('media_library')
            .select('*')
            .eq('id', mediaId)
            .single()

        if (fetchError || !media) {
            return apiResponse(404, null, { message: 'Media not found' })
        }

        // Check permission (admin or owner)
        const { data: userRecord } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        const isAdmin = userRecord?.role === 'admin'
        const isOwner = media.uploaded_by === user.id

        if (!isAdmin && !isOwner) {
            return apiResponse(403, null, { message: 'Forbidden: Cannot delete this media' })
        }

        // Delete from storage
        if (media.storage_path) {
            const { error: deleteStorageError } = await supabase.storage
                .from('media')
                .remove([media.storage_path])

            if (deleteStorageError) {
                console.warn('Storage deletion warning:', deleteStorageError)
                // Continue even if storage delete fails - database record is source of truth
            }
        }

        // Delete from database
        const { error: deleteError } = await supabase
            .from('media_library')
            .delete()
            .eq('id', mediaId)

        if (deleteError) throw deleteError

        return apiResponse(200, {
            message: 'Media deleted successfully',
            deletedId: mediaId,
        })
    } catch (error) {
        console.error('Media DELETE error:', error)
        return apiResponse(500, null, {
            message: 'Failed to delete media',
            error: error.message,
        })
    }
}
