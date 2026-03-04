/**
 * Performance & Caching Utilities
 * Implements caching strategies and performance optimizations
 */

const CACHE_DURATIONS = {
    SHORT: 5 * 60, // 5 minutes
    MEDIUM: 15 * 60, // 15 minutes
    LONG: 60 * 60, // 1 hour
    VERY_LONG: 24 * 60 * 60, // 1 day
}

const memoryCache = new Map()

/**
 * Get cache key
 */
const getCacheKey = (type, id = '', params = {}) => {
    const paramStr = Object.keys(params).length > 0
        ? `_${JSON.stringify(params)}`
        : ''
    return `${type}_${id}${paramStr}`
}

/**
 * Get from memory cache
 */
export const getFromCache = (type, id = '', params = {}) => {
    const key = getCacheKey(type, id, params)
    const cached = memoryCache.get(key)

    if (!cached) return null

    const { data, expiresAt } = cached
    if (Date.now() > expiresAt) {
        memoryCache.delete(key)
        return null
    }

    return data
}

/**
 * Set to memory cache
 */
export const setToCache = (type, id = '', params = {}, data, duration = CACHE_DURATIONS.MEDIUM) => {
    const key = getCacheKey(type, id, params)
    const expiresAt = Date.now() + (duration * 1000)

    memoryCache.set(key, { data, expiresAt })

    // Auto cleanup expired entries
    if (Math.random() < 0.1) cleanupExpiredCache()
}

/**
 * Clear specific cache
 */
export const clearCaché = (type, id = '', params = {}) => {
    const key = getCacheKey(type, id, params)
    memoryCache.delete(key)
}

/**
 * Clear all cache
 */
export const clearAllCache = () => {
    memoryCache.clear()
}

/**
 * Cleanup expired cache entries
 */
const cleanupExpiredCache = () => {
    const now = Date.now()
    for (const [key, { expiresAt }] of memoryCache.entries()) {
        if (now > expiresAt) {
            memoryCache.delete(key)
        }
    }
}

/**
 * Batch query optimization
 * Prevents N+1 queries by loading related data in single query
 */
export const optimizeBatchQueries = async (supabase, table, ids, relatedTables) => {
    if (!ids || ids.length === 0) return {}

    const uniqueIds = [...new Set(ids)]
    let query = supabase.from(table).select('*')

    if (relatedTables && relatedTables.length > 0) {
        const selectStr = `*, ${relatedTables.join(', ')}`
        query = supabase.from(table).select(selectStr)
    }

    query = query.in('id', uniqueIds)

    const { data, error } = await query

    if (error) throw error

    // Create map for easy access
    const mapped = {}
    data.forEach(item => {
        mapped[item.id] = item
    })

    return mapped
}

/**
 * Debounce queries
 */
export const debounceQuery = (fn, delay = 300) => {
    let timeoutId
    return (...args) => {
        clearTimeout(timeoutId)
        return new Promise((resolve) => {
            timeoutId = setTimeout(() => {
                resolve(fn(...args))
            }, delay)
        })
    }
}

/**
 * ISR (Incremental Static Regeneration) headers helper
 */
export const getISRHeaders = (revalidate = 3600) => {
    return {
        'Cache-Control': `s-maxage=${revalidate}, stale-while-revalidate=86400`,
    }
}

/**
 * Public page ISR revalidation times
 */
export const ISR_REVALIDATE = {
    ARTICLES_LIST: 300, // 5 minutes
    ARTICLE_DETAIL: 600, // 10 minutes
    CATEGORY_PAGE: 300, // 5 minutes
    HOMEPAGE: 600, // 10 minutes
}

/**
 * Database query optimization builder
 */
export class QueryBuilder {
    constructor(supabase) {
        this.supabase = supabase
        this.query = null
        this.table = null
    }

    from(table) {
        this.table = table
        this.query = this.supabase.from(table)
        return this
    }

    select(...columns) {
        const selectStr = columns.length > 0 ? columns.join(', ') : '*'
        this.query = this.query.select(selectStr)
        return this
    }

    where(column, operator, value) {
        this.query = this.query.filter(column, operator, value)
        return this
    }

    orderBy(column, ascending = true) {
        this.query = this.query.order(column, { ascending })
        return this
    }

    limit(count) {
        this.query = this.query.limit(count)
        return this
    }

    range(from, to) {
        this.query = this.query.range(from, to)
        return this
    }

    eq(column, value) {
        this.query = this.query.eq(column, value)
        return this
    }

    neq(column, value) {
        this.query = this.query.neq(column, value)
        return this
    }

    gt(column, value) {
        this.query = this.query.gt(column, value)
        return this
    }

    gte(column, value) {
        this.query = this.query.gte(column, value)
        return this
    }

    lt(column, value) {
        this.query = this.query.lt(column, value)
        return this
    }

    lte(column, value) {
        this.query = this.query.lte(column, value)
        return this
    }

    in(column, values) {
        this.query = this.query.in(column, values)
        return this
    }

    async execute() {
        return this.query
    }
}

export { CACHE_DURATIONS }
