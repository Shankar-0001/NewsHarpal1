/**
 * Database Indexes & Query Optimization Guide
 * Provides recommended indexes and query patterns for optimal performance
 */

export const RECOMMENDED_INDEXES = `
-- Article Queries
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX idx_articles_author_id ON articles(author_id);
CREATE INDEX idx_articles_category_id ON articles(category_id);
CREATE INDEX idx_articles_slug ON articles(slug) WHERE status = 'published';

-- Author Queries
CREATE INDEX idx_authors_user_id ON authors(user_id);
CREATE INDEX idx_authors_slug ON authors(slug);

-- Category Queries
CREATE INDEX idx_categories_slug ON categories(slug);

-- Tag Queries
CREATE INDEX idx_tags_slug ON tags(slug);

-- Article Tags (Relationships)
CREATE INDEX idx_article_tags_article_id ON article_tags(article_id);
CREATE INDEX idx_article_tags_tag_id ON article_tags(tag_id);

-- Media Library
CREATE INDEX idx_media_library_uploaded_by ON media_library(uploaded_by);
CREATE INDEX idx_media_library_created_at ON media_library(created_at DESC);

-- User Queries
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- Complex Queries
CREATE INDEX idx_articles_published_status_date ON articles(status, published_at DESC) WHERE status = 'published';
`

/**
 * Optimized Query Examples
 */
export const OPTIMIZED_QUERIES = {
  // Get published articles with relations in single query
  getPublishedArticles: `
    SELECT 
      a.id, a.title, a.slug, a.excerpt, a.featured_image_url,
      a.published_at, a.status,
      au.id as author_id, au.name as author_name,
      c.id as category_id, c.name as category_name, c.slug as category_slug
    FROM articles a
    LEFT JOIN authors au ON a.author_id = au.id
    LEFT JOIN categories c ON a.category_id = c.id
    WHERE a.status = 'published'
    ORDER BY a.published_at DESC
    LIMIT 12
  `,

  // Get article with tags
  getArticleWithTags: `
    SELECT 
      a.*, 
      json_agg(json_build_object('id', t.id, 'name', t.name, 'slug', t.slug)) as tags
    FROM articles a
    LEFT JOIN article_tags at ON a.id = at.article_id
    LEFT JOIN tags t ON at.tag_id = t.id
    WHERE a.slug = $1 AND a.status = 'published'
    GROUP BY a.id
  `,

  // Get author with article count
  getAuthorStats: `
    SELECT 
      a.id, a.name, a.bio, a.slug,
      COUNT(ar.id) as article_count
    FROM authors a
    LEFT JOIN articles ar ON a.id = ar.author_id AND ar.status = 'published'
    GROUP BY a.id
  `,

  // Get trending articles (by recent date)
  getTrendingArticles: `
    SELECT 
      id, title, slug, excerpt, featured_image_url,
      published_at, view_count
    FROM articles
    WHERE status = 'published'
    AND published_at > NOW() - INTERVAL '30 days'
    ORDER BY view_count DESC, published_at DESC
    LIMIT 10
  `,
}

/**
 * Pagination helper
 */
export const getPaginationParams = (page = 1, pageSize = 10) => {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  return { from, to }
}

/**
 * N+1 Query Prevention Pattern
 * Use batch loading instead of iterating queries
 */
export const BATCH_QUERY_EXAMPLE = `
// ❌ BAD: N+1 Query Problem
async function getArticlesWithAuthors_Bad(articleIds) {
  const articles = await supabase
    .from('articles')
    .select('id, title, author_id')
    .in('id', articleIds)

  // This causes N separate queries!
  for (const article of articles.data) {
    const { data: author } = await supabase
      .from('authors')
      .select('name')
      .eq('id', article.author_id)
      .single()
    article.author = author
  }

  return articles.data
}

// ✅ GOOD: Batch load all authors at once
async function getArticlesWithAuthors_Good(articleIds) {
  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, author_id')
    .in('id', articleIds)

  const authorIds = [...new Set(articles.map(a => a.author_id))]
  const { data: authors } = await supabase
    .from('authors')
    .select('id, name')
    .in('id', authorIds)

  const authorMap = new Map(authors.map(a => [a.id, a]))

  return articles.map(a => ({
    ...a,
    author: authorMap.get(a.author_id),
  }))
}
`

/**
 * Connection Pooling Configuration
 */
export const CONNECTION_POOL_CONFIG = {
  min: 5,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
}

/**
 * Query Result Caching TTL (Time To Live)
 */
export const CACHE_TTL = {
  STATIC_CONTENT: 3600 * 24, // 1 day
  ARTICLES_LIST: 600, // 10 minutes
  ARTICLE_DETAIL: 1800, // 30 minutes
  USER_PROFILE: 3600, // 1 hour
  SEARCH_RESULTS: 300, // 5 minutes
}

/**
 * Suggested Revalidation Times for ISR
 */
export const ISR_REVALIDATE = {
  HOMEPAGE: 600, // 10 minutes
  ARTICLE_PAGE: 1800, // 30 minutes
  CATEGORY_PAGE: 300, // 5 minutes
  AUTHOR_PAGE: 3600, // 1 hour
}
