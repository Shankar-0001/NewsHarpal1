import { createClient } from '@/lib/supabase/server'

export default async function sitemap() {
  const supabase = await createClient()
  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://newsharpal.com'

  // Get all published articles
  const { data: articles } = await supabase
    .from('articles')
    .select('slug, updated_at, categories(slug)')
    .eq('status', 'published')

  // Get all categories
  const { data: categories } = await supabase
    .from('categories')
    .select('slug, updated_at')

  // Get all tags
  const { data: tags } = await supabase
    .from('tags')
    .select('slug, updated_at')

  const articleEntries = articles?.map((article) => ({
    url: `${siteUrl}/${article.categories?.slug || 'news'}/${article.slug}`,
    lastModified: new Date(article.updated_at),
    changeFrequency: 'daily',
    priority: 0.8,
  })) || []

  const categoryEntries = categories?.map((category) => ({
    url: `${siteUrl}/${category.slug}`,
    lastModified: new Date(category.updated_at),
    changeFrequency: 'daily',
    priority: 0.7,
  })) || []
  const categoryHubEntries = categories?.map((category) => ({
    url: `${siteUrl}/category/${category.slug}`,
    lastModified: new Date(category.updated_at),
    changeFrequency: 'daily',
    priority: 0.7,
  })) || []

  const tagEntries = tags?.map((tag) => ({
    url: `${siteUrl}/tags/${tag.slug}`,
    lastModified: new Date(tag.updated_at),
    changeFrequency: 'weekly',
    priority: 0.5,
  })) || []

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/news-sitemap.xml`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/category-sitemap.xml`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/topic-sitemap.xml`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/web-stories-sitemap.xml`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.6,
    },
    ...articleEntries,
    ...categoryEntries,
    ...categoryHubEntries,
    ...tagEntries,
  ]
}

