import { stripHtml } from '@/lib/content-utils'
import { slugFromText } from '@/lib/site-config'

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'of', 'in', 'on', 'for', 'with', 'to', 'and', 'or', 'is', 'are', 'was', 'were', 'be', 'by', 'at', 'as', 'from', 'that', 'this', 'it', 'its', 'their', 'his', 'her', 'into', 'about', 'over', 'after', 'before', 'than', 'during'
])

export function extractTopicKeywords(articles = [], limit = 40) {
  const counts = new Map()

  for (const article of articles) {
    const text = `${article.title || ''} ${article.excerpt || ''} ${stripHtml(article.content || '')}`
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')

    const words = text.split(/\s+/).filter(Boolean)
    for (const word of words) {
      if (word.length < 4 || STOP_WORDS.has(word)) continue
      counts.set(word, (counts.get(word) || 0) + 1)
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([keyword, count]) => ({ keyword, slug: slugFromText(keyword), count }))
}

export function matchesKeyword(article, keyword = '') {
  const k = keyword.toLowerCase().trim()
  if (!k) return false
  const hay = `${article.title || ''} ${article.excerpt || ''} ${stripHtml(article.content || '')}`.toLowerCase()
  return hay.includes(k)
}
