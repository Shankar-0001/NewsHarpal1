import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'

export const revalidate = 600

export default async function LegacyArticleRedirectPage({ params }) {
  const supabase = await createClient()
  const slug = params.slug

  let { data: article } = await supabase
    .from('articles')
    .select('slug, categories(slug)')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (!article) {
    const { data: slugHistory } = await supabase
      .from('slug_history')
      .select('new_slug')
      .eq('old_slug', slug)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (slugHistory?.new_slug) {
      const { data: redirectedArticle } = await supabase
        .from('articles')
        .select('slug, categories(slug)')
        .eq('slug', slugHistory.new_slug)
        .eq('status', 'published')
        .maybeSingle()
      article = redirectedArticle
    }
  }

  if (!article) notFound()

  redirect(`/${article.categories?.slug || 'news'}/${article.slug}`)
}

