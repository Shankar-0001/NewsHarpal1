import './globals.css'
import { ThemeProvider } from 'next-themes'
import SiteFooter from '@/components/layout/SiteFooter'
import Script from 'next/script'

export const metadata = {
  title: 'NewsHarpal - Latest News and Insights',
  description: 'Your trusted source for breaking news, trending stories, and expert insights.',
}

export default function RootLayout({ children }) {
  const adsEnabled = process.env.NEXT_PUBLIC_ADS_ENABLED === 'true'
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID
  const adsenseScriptSrc = adsenseClientId
    ? `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`
    : null

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="robots" content="max-image-preview:large" />
      </head>
      <body className="font-sans">
        {/* Lazy-load third-party ad script to protect initial paint/Core Web Vitals */}
        {adsEnabled && adsenseScriptSrc && (
          <Script
            src={adsenseScriptSrc}
            strategy="lazyOnload"
            crossOrigin="anonymous"
          />
        )}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  )
}
