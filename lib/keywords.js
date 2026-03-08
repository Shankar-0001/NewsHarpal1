import { slugFromText } from '@/lib/site-config'
import { stripHtml } from '@/lib/content-utils'

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'has', 'was', 'were',
  'will', 'into', 'about', 'your', 'their', 'them', 'they', 'are', 'you', 'our',
  'but', 'not', 'out', 'all', 'his', 'her', 'she', 'him', 'its', 'who', 'what',
  'when', 'where', 'how', 'why', 'can', 'could', 'should', 'would', 'than', 'then',
  'new', 'latest', 'news', 'update', 'updates',
])

function tokenize(text = '') {
  return stripHtml(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token))
}

export function extractKeywordsFromText(text = '', limit = 12) {
  const counts = new Map()
  tokenize(text).forEach((token) => {
    counts.set(token, (counts.get(token) || 0) + 1)
  })

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word)
}

export function buildArticleKeywords(article = {}, limit = 12) {
  const manual = (article.article_tags || article.tags || [])
    .map((item) => item?.tags?.name || item?.name || '')
    .map((name) => name.trim())
    .filter(Boolean)

  const derived = extractKeywordsFromText(
    [article.title, article.excerpt, article.content].filter(Boolean).join(' '),
    limit
  )

  const merged = [...new Set([...manual, ...derived])]
    .slice(0, limit)

  return merged
}

export function keywordsToMetadataValue(keywords = []) {
  return (keywords || [])
    .map((item) => item.trim())
    .filter(Boolean)
    .join(', ')
}

export function keywordsToTopicLinks(keywords = [], limit = 8) {
  return (keywords || [])
    .slice(0, limit)
    .map((keyword) => ({
      keyword,
      slug: slugFromText(keyword),
    }))
    .filter((item) => item.slug)
}

