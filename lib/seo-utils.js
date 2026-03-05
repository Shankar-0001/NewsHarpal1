/**
 * SEO & Metadata Utilities
 * Generates optimized metadata for articles and pages
 */

/**
 * Generate article metadata
 */
export const generateArticleMetadata = (article) => {
    return {
        title: article.seo_title || article.title || 'Article',
        description: article.seo_description || article.excerpt || '',
        keywords: article.tags?.map(t => t.name).join(', ') || '',
        authors: article.authors?.name ? [{ name: article.authors.name }] : [],
        publishedTime: article.published_at,
        modifiedTime: article.updated_at,
        images: article.featured_image_url ? [{ url: article.featured_image_url }] : [],
        openGraph: {
            type: 'article',
            title: article.seo_title || article.title,
            description: article.seo_description || article.excerpt,
            url: `/articles/${article.slug}`,
            images: article.featured_image_url
                ? [{ url: article.featured_image_url, width: 1200, height: 630 }]
                : [],
            article: {
                authors: article.authors ? [article.authors.name] : [],
                publishedTime: article.published_at,
                modifiedTime: article.updated_at,
                tags: article.tags?.map(t => t.name) || [],
            },
        },
        twitter: {
            card: 'summary_large_image',
            title: article.seo_title || article.title,
            description: article.seo_description || article.excerpt,
            image: article.featured_image_url || '',
        },
    }
}

/**
 * Generate category page metadata
 */
export const generateCategoryMetadata = (category) => {
    return {
        title: `${category.name} - NewsHarpal`,
        description: `Read all articles in the ${category.name} category on NewsHarpal`,
        keywords: `${category.name}, news, articles`,
        openGraph: {
            type: 'website',
            title: `${category.name} - NewsHarpal`,
            description: `Explore articles in the ${category.name} category`,
            url: `/${category.slug}`,
        },
    }
}

/**
 * Generate author page metadata
 */
export const generateAuthorMetadata = (author) => {
    return {
        title: `${author.name} - NewsHarpal`,
        description: author.bio || `Read articles by ${author.name}`,
        keywords: `${author.name}, author, articles`,
        openGraph: {
            type: 'profile',
            title: `${author.name} - NewsHarpal`,
            description: author.bio,
            url: `/authors/${author.slug}`,
            images: author.avatar_url ? [{ url: author.avatar_url }] : [],
        },
    }
}

/**
 * Structured Data (Schema.org) for Article
 */
export const generateArticleSchema = (article, siteUrl = 'https://newsharpal.com') => {
    return {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: article.title,
        description: article.excerpt,
        image: article.featured_image_url,
        datePublished: article.published_at,
        dateModified: article.updated_at || article.published_at,
        author: {
            '@type': 'Person',
            name: article.authors?.name || 'NewsHarpal',
            url: article.authors?.slug ? `${siteUrl}/authors/${article.authors.slug}` : undefined,
        },
        publisher: {
            '@type': 'Organization',
            name: 'NewsHarpal',
            logo: {
                '@type': 'ImageObject',
                url: `${siteUrl}/logo.png`,
                width: 250,
                height: 60,
            },
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `${siteUrl}/articles/${article.slug}`,
        },
        articleSection: article.categories?.name || 'News',
        keywords: article.tags?.map(t => t.name).join(', '),
    }
}

/**
 * Structured Data for Organization
 */
export const generateOrganizationSchema = (config = {}) => {
    const {
        name = 'NewsHarpal',
        url = 'https://newsharpal.com',
        logo = 'https://newsharpal.com/logo.png',
        description = 'Latest news and insights',
        socialProfiles = [],
    } = config

    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name,
        url,
        logo,
        description,
        sameAs: socialProfiles,
    }
}

/**
 * Structured Data for Breadcrumb
 */
export const generateBreadcrumbSchema = (items) => {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    }
}

/**
 * Generate robots.txt content
 */
export const generateRobotsTxt = (siteUrl = 'https://newsharpal.com') => {
    return `User-agent: *
Allow: /
Disallow: /admin
Disallow: /dashboard
Disallow: /api
Disallow: /login
Disallow: /signup

Sitemap: ${siteUrl}/sitemap.xml
`
}

/**
 * Generate sitemap XML
 */
export const generateSitemap = (articles = [], pages = [], siteUrl = 'https://newsharpal.com') => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${pages
            .map(
                page => `
  <url>
    <loc>${siteUrl}${page.path}</loc>
    <lastmod>${new Date(page.modifiedTime).toISOString()}</lastmod>
    <changefreq>${page.changefreq || 'weekly'}</changefreq>
    <priority>${page.priority || 0.8}</priority>
  </url>
  `
            )
            .join('')}
  ${articles
            .filter(a => a.status === 'published')
            .map(
                article => `
  <url>
    <loc>${siteUrl}/articles/${article.slug}</loc>
    <lastmod>${new Date(article.published_at).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  `
            )
            .join('')}
</urlset>`
    return xml
}

/**
 * Meta tags configuration object
 */
export const createMetaTags = (config) => {
    const {
        title = 'NewsHarpal',
        description = 'Latest news and insights',
        image = 'https://newsharpal.com/og-image.png',
        url = 'https://newsharpal.com',
        type = 'website',
        twitterHandle = '@newsharpal',
    } = config

    return {
        metadataBase: new URL(url),
        title,
        description,
        openGraph: {
            title,
            description,
            images: [{ url: image }],
            type,
            url,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            image,
            creator: twitterHandle,
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                'max-video-preview': -1,
                'max-image-preview': 'large',
                'max-snippet': -1,
            },
        },
        alternates: {
            canonical: url,
        },
    }
}

export default {
    generateArticleMetadata,
    generateCategoryMetadata,
    generateAuthorMetadata,
    generateArticleSchema,
    generateOrganizationSchema,
    generateBreadcrumbSchema,
    generateRobotsTxt,
    generateSitemap,
    createMetaTags,
}
