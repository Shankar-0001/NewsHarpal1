/**
 * Input Validation Utilities - Simple but powerful validation
 */

export class ValidationError extends Error {
    constructor(message, fields = {}) {
        super(message)
        this.fields = fields
        this.name = 'ValidationError'
    }
}

/**
 * Article validation schema
 */
export const validateArticle = (data) => {
    const errors = {}

    if (!data.title?.trim()) {
        errors.title = 'Title is required'
    } else if (data.title.length < 5) {
        errors.title = 'Title must be at least 5 characters'
    } else if (data.title.length > 200) {
        errors.title = 'Title must be less than 200 characters'
    }

    if (!data.slug?.trim()) {
        errors.slug = 'Slug is required'
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) {
        errors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens'
    }

    if (data.excerpt && data.excerpt.length > 500) {
        errors.excerpt = 'Excerpt must be less than 500 characters'
    }

    if (!data.content?.trim()) {
        errors.content = 'Content is required'
    }

    if (data.status && !['draft', 'pending', 'published', 'archived'].includes(data.status)) {
        errors.status = 'Invalid status'
    }

    if (Object.keys(errors).length > 0) {
        throw new ValidationError('Article validation failed', errors)
    }

    return true
}

/**
 * Author validation schema
 */
export const validateAuthor = (data) => {
    const errors = {}

    if (!data.name?.trim()) {
        errors.name = 'Name is required'
    } else if (data.name.length < 2) {
        errors.name = 'Name must be at least 2 characters'
    } else if (data.name.length > 100) {
        errors.name = 'Name must be less than 100 characters'
    }

    if (!data.slug?.trim()) {
        errors.slug = 'Slug is required'
    }

    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.email = 'Invalid email format'
    }

    if (data.bio && data.bio.length > 1000) {
        errors.bio = 'Bio must be less than 1000 characters'
    }

    if (Object.keys(errors).length > 0) {
        throw new ValidationError('Author validation failed', errors)
    }

    return true
}

/**
 * Category validation schema
 */
export const validateCategory = (data) => {
    const errors = {}

    if (!data.name?.trim()) {
        errors.name = 'Name is required'
    } else if (data.name.length < 2 || data.name.length > 50) {
        errors.name = 'Name must be between 2 and 50 characters'
    }

    if (!data.slug?.trim()) {
        errors.slug = 'Slug is required'
    }

    if (Object.keys(errors).length > 0) {
        throw new ValidationError('Category validation failed', errors)
    }

    return true
}

/**
 * Tag validation schema
 */
export const validateTag = (data) => {
    const errors = {}

    if (!data.name?.trim()) {
        errors.name = 'Name is required'
    } else if (data.name.length < 2 || data.name.length > 30) {
        errors.name = 'Name must be between 2 and 30 characters'
    }

    if (Object.keys(errors).length > 0) {
        throw new ValidationError('Tag validation failed', errors)
    }

    return true
}

/**
 * File upload validation
 */
export const validateFileUpload = (file, maxSizeMB = 5, allowedTypes = ['image/jpeg', 'image/png', 'image/webp']) => {
    const errors = []

    if (!file) {
        errors.push('File is required')
    } else {
        const maxBytes = maxSizeMB * 1024 * 1024
        if (file.size > maxBytes) {
            errors.push(`File size must be less than ${maxSizeMB}MB`)
        }

        if (!allowedTypes.includes(file.type)) {
            errors.push(`File type must be one of: ${allowedTypes.join(', ')}`)
        }
    }

    if (errors.length > 0) {
        throw new ValidationError(errors.join('; '), { file: errors })
    }

    return true
}
