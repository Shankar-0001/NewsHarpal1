'use client'

import { useEffect, useMemo, useState } from 'react'
import { Heart, Eye, Share2, Link as LinkIcon, Facebook, Twitter, Linkedin } from 'lucide-react'

export default function ArticleEngagementBar({ articleId, articleUrl, articleTitle, type = 'article' }) {
  const [metrics, setMetrics] = useState({ views: 0, likes: 0, shares: 0 })
  const [busy, setBusy] = useState(false)

  const encodedUrl = useMemo(() => encodeURIComponent(articleUrl), [articleUrl])
  const encodedTitle = useMemo(() => encodeURIComponent(articleTitle || ''), [articleTitle])

  useEffect(() => {
    if (!articleId) return

    let isMounted = true
    ;(async () => {
      try {
        await fetch('/api/engagement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: articleId, action: 'view', type }),
        })
        const res = await fetch(`/api/engagement?id=${encodeURIComponent(articleId)}&type=${encodeURIComponent(type)}`)
        const json = await res.json()
        if (isMounted && res.ok) setMetrics(json.data?.metrics || metrics)
      } catch {
        // No-op: avoid hard failures in UI
      }
    })()

    return () => {
      isMounted = false
    }
  }, [articleId])

  const performAction = async (action) => {
    if (!articleId || busy) return
    setBusy(true)
    try {
      const res = await fetch('/api/engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: articleId, action, type }),
      })
      const json = await res.json()
      if (res.ok) {
        setMetrics(json.data?.metrics || metrics)
      }
    } finally {
      setBusy(false)
    }
  }

  const openShare = async (url) => {
    window.open(url, '_blank', 'noopener,noreferrer,width=640,height=640')
    await performAction('share')
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(articleUrl)
      await performAction('share')
    } catch {
      // ignore
    }
  }

  return (
    <section className="mb-8 p-4 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700">
      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700 dark:text-gray-300">
        <span className="inline-flex items-center gap-1.5"><Eye className="h-4 w-4" /> {metrics.views}</span>
        <button onClick={() => performAction('like')} className="inline-flex items-center gap-1.5 hover:text-red-600">
          <Heart className="h-4 w-4" /> {metrics.likes}
        </button>
        <span className="inline-flex items-center gap-1.5"><Share2 className="h-4 w-4" /> {metrics.shares}</span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button onClick={() => openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`)} className="px-3 py-1.5 border rounded text-xs inline-flex items-center gap-1.5"><Facebook className="h-3.5 w-3.5" /> Facebook</button>
        <button onClick={() => openShare(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`)} className="px-3 py-1.5 border rounded text-xs inline-flex items-center gap-1.5"><Twitter className="h-3.5 w-3.5" /> Twitter</button>
        <button onClick={() => openShare(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`)} className="px-3 py-1.5 border rounded text-xs inline-flex items-center gap-1.5"><Linkedin className="h-3.5 w-3.5" /> LinkedIn</button>
        <button onClick={() => openShare(`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`)} className="px-3 py-1.5 border rounded text-xs inline-flex items-center gap-1.5">WhatsApp</button>
        <button onClick={copyLink} className="px-3 py-1.5 border rounded text-xs inline-flex items-center gap-1.5"><LinkIcon className="h-3.5 w-3.5" /> Copy Link</button>
      </div>
    </section>
  )
}
