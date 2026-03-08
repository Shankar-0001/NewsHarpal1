/**
 * Content processing helpers for SEO/UX.
 */

export function stripHtml(html = '') {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function calculateReadingTime(content = '') {
  const text = stripHtml(content)
  const words = text ? text.split(/\s+/).length : 0
  const minutes = Math.max(1, Math.ceil(words / 220))
  return minutes
}

export function generateSixtySecondSummary(article = {}) {
  const summary = []
  const title = article.title?.trim()
  const excerpt = article.excerpt?.trim()
  const text = stripHtml(article.content || '')
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean)

  if (title) summary.push(`${title}`)
  if (excerpt) summary.push(excerpt)
  if (sentences[0]) summary.push(sentences[0])
  if (sentences[1]) summary.push(sentences[1])
  if (article.categories?.name) summary.push(`Category: ${article.categories.name}`)

  const unique = [...new Set(summary.map((s) => s.replace(/\s+/g, ' ').trim()))]
    .filter(Boolean)
    .slice(0, 5)

  return unique.length > 0 ? unique : ['Key updates from this story in under a minute.']
}

export function generateAeoSnapshot(article = {}) {
  const text = stripHtml(article.content || '')
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean)

  const whatChanged = sentences[0] || article.excerpt || article.title || 'Latest developments in this story.'
  const whyItMatters = sentences[1] || article.excerpt || 'This update can affect policy, markets, or daily life depending on context.'
  const keyContext = sentences[2] || `Coverage topic: ${article.categories?.name || 'General News'}.`

  return {
    whatChanged,
    whyItMatters,
    keyContext,
  }
}
