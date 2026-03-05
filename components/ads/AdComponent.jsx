'use client'

import { useEffect } from 'react'

export default function AdComponent({ slot, format = 'auto', responsive = true, className = '' }) {
  // Check if ads are enabled (you can add this to admin settings)
  const adsEnabled = process.env.NEXT_PUBLIC_ADS_ENABLED === 'true'
  const adClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID
  
  if (!adsEnabled || !adClientId) {
    return null
  }

  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch (err) {
      console.error('AdSense error:', err)
    }
  }, [])

  return (
    <div className={`ad-container ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={adClientId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      />
    </div>
  )
}

// Pre-configured ad components
export function HeaderAd() {
  return <AdComponent slot="1234567890" format="horizontal" className="mb-4" />
}

export function SidebarAd() {
  return <AdComponent slot="0987654321" format="rectangle" className="mb-4" />
}

export function InArticleAd() {
  return <AdComponent slot="1122334455" format="fluid" className="my-6" />
}

export function MobileStickyAd() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white dark:bg-gray-900 border-t shadow-lg">
      <AdComponent slot="5544332211" format="horizontal" responsive={true} />
    </div>
  )
}
