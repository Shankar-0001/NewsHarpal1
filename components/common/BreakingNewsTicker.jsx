'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function BreakingNewsTicker({ news }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (news.length === 0) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % news.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [news.length])

  if (!news || news.length === 0) return null

  return (
    <div className="bg-red-600 dark:bg-red-700 text-white py-2 overflow-hidden">
      <div className="w-full max-w-6xl mx-auto px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-bold whitespace-nowrap">
            <span className="uppercase text-sm">Breaking News</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <Link
              href={`/${news[currentIndex].categories?.slug || 'news'}/${news[currentIndex].slug}`}
              className="block animate-fade-in hover:underline"
            >
              {news[currentIndex].title}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
