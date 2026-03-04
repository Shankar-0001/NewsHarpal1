/**
 * Input Sanitization Utilities
 * Prevents XSS and injection attacks
 */

import DOMPurify from 'dompurify'

/**
 * Sanitize HTML content (for editor output)
 */
export const sanitizeHTML = (html) => {
    if (!html) return ''

    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
            'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'a', 'img', 'blockquote', 'pre', 'code', 'ul', 'ol', 'li',
            'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr',
            'iframe', 'video', 'audio', 'source'
        ],
        ALLOWED_ATTR: {
            a: ['href', 'title', 'target'],
            img: ['src', 'alt', 'title', 'width', 'height'],
            iframe: ['src', 'width', 'height', 'allowfullscreen'],
            video: ['src', 'width', 'height', 'controls'],
            audio: ['src', 'controls'],
            code: ['class'],
            pre: ['class'],
        },
        KEEP_CONTENT: true,
    })
}

/**
 * Sanitize text input (removes all HTML)
 */
export const sanitizeText = (text) => {
    if (!text) return ''

    // Remove any HTML tags
    return text.replace(/<[^>]*>/g, '')
}

/**
 * Sanitize URL to prevent javascript: and data: URLs
 */
export const sanitizeURL = (url) => {
    if (!url) return ''

    try {
        const parsed = new URL(url)
        // Only allow http and https protocols
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return ''
        }
        return url
    } catch {
        // If URL parsing fails, treat as relative path
        if (url.startsWith('/')) {
            return url
        }
        return ''
    }
}

/**
 * Escape HTML entities to prevent XSS
 */
export const escapeHTML = (text) => {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    }
    return text.replace(/[&<>"']/g, (m) => map[m])
}

/**
 * Validate email format
 */
export const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
}

/**
 * Validate URL format
 */
export const validateURL = (url) => {
    try {
        new URL(url)
        return true
    } catch {
        return false
    }
}

/**
 * Remove potentially dangerous attributes
 */
export const removeScriptAttributes = (html) => {
    if (!html) return ''

    // Remove event handlers
    let cleaned = html.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    // Remove javascript: protocol
    cleaned = cleaned.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"')
    // Remove data: protocol from non-image contexts
    cleaned = cleaned.replace(/href\s*=\s*["']data:[^"']*["']/gi, 'href="#"')

    return cleaned
}

/**
 * Validate file upload
 */
export const validateFileUpload = (file, allowedMimes = [], maxSize = 5 * 1024 * 1024) => {
    const errors = []

    if (!file) {
        return { valid: false, errors: ['No file provided'] }
    }

    if (allowedMimes.length > 0 && !allowedMimes.includes(file.type)) {
        errors.push(`File type not allowed. Allowed types: ${allowedMimes.join(', ')}`)
    }

    if (file.size > maxSize) {
        errors.push(`File size must be less than ${maxSize / 1024 / 1024}MB`)
    }

    return {
        valid: errors.length === 0,
        errors,
    }
}

/**
 * Slugify text safely
 */
export const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
}

/**
 * Sanitize object data (for API requests)
 */
export const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') {
        return obj
    }

    const sanitized = {}

    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitized[key] = sanitizeText(value)
        } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeObject(value)
        } else {
            sanitized[key] = value
        }
    }

    return sanitized
}

export default {
    sanitizeHTML,
    sanitizeText,
    sanitizeURL,
    escapeHTML,
    validateEmail,
    validateURL,
    removeScriptAttributes,
    validateFileUpload,
    slugify,
    sanitizeObject,
}
