import { absoluteUrl } from '@/lib/site-config'

export function xmlResponse(xml) {
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600',
    },
  })
}

export function urlsetXml(entries = []) {
  const body = entries
    .map((entry) => {
      const lastmod = entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ''
      const changefreq = entry.changefreq ? `<changefreq>${entry.changefreq}</changefreq>` : ''
      const priority = typeof entry.priority === 'number' ? `<priority>${entry.priority.toFixed(1)}</priority>` : ''
      return `<url><loc>${entry.loc}</loc>${lastmod}${changefreq}${priority}</url>`
    })
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`
}

export function sitemapIndexXml(paths = []) {
  const body = paths
    .map((path) => `<sitemap><loc>${absoluteUrl(path)}</loc></sitemap>`)
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`
}
