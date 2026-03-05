export const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://newsharpal.com'

export function absoluteUrl(path = '/') {
  if (!path.startsWith('/')) return `${SITE_URL}/${path}`
  return `${SITE_URL}${path}`
}

export function slugFromText(value = '') {
  return value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}
