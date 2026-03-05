import './globals.css'
import { ThemeProvider } from 'next-themes'
import SiteFooter from '@/components/layout/SiteFooter'

export const metadata = {
  title: 'NewsHarpal - Latest News and Insights',
  description: 'Your trusted source for breaking news, trending stories, and expert insights.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="robots" content="max-image-preview:large" />
        {/* AdSense Script */}
        {process.env.NEXT_PUBLIC_ADS_ENABLED === 'true' && (
          <script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className="font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  )
}
