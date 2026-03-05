import { slugFromText } from '@/lib/site-config'

const GOOGLE_TRENDS_RSS_URL = 'https://trends.google.com/trending/rss?geo=US'

function decodeXmlEntities(text = '') {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function extractTitlesFromRss(xml = '') {
  const titles = []
  const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/gi) || []

  for (const item of itemMatches) {
    const match = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/i) || item.match(/<title>(.*?)<\/title>/i)
    if (match?.[1]) titles.push(decodeXmlEntities(match[1].trim()))
  }

  return titles
}

export function normalizeTrendingKeywords(keywords = []) {
  const map = new Map()

  for (const raw of keywords) {
    const keyword = (raw || '').toString().trim().toLowerCase()
    if (!keyword) continue
    const slug = slugFromText(keyword)
    if (!slug) continue
    if (!map.has(slug)) {
      map.set(slug, { keyword, slug })
    }
  }

  return [...map.values()]
}

export async function fetchGoogleTrendsKeywords() {
  const response = await fetch(GOOGLE_TRENDS_RSS_URL, {
    next: { revalidate: 1800 },
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; NewsHarpalTrendsBot/1.0)',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch trends RSS: ${response.status}`)
  }

  const xml = await response.text()
  return extractTitlesFromRss(xml)
}

export async function fetchTrendingQueries() {
  try {
    const keywords = await fetchGoogleTrendsKeywords()
    return normalizeTrendingKeywords(keywords)
  } catch {
    return []
  }
}

